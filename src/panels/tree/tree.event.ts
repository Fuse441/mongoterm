import { appInstance } from "@/app";
import { getConnectionNames } from "@/shared/selectors/connection.selectors";
import blessed from "neo-blessed";
import os from "os";
import path from "path";
import { state } from "@/shared/state";
import { logger } from "@/utils/logger/logger.service";
import { EVENTS } from "@/services/enum";
import { openForm } from "@/panels/form/form.panel";
import { openDialogConfirm, promptInline } from "@/panels/modal.panel";
import { createTree, TreeNode } from "@/panels/tree/tree.panel";
import { theme } from "@/config/app.config";
import { getConfiguration, saveConnection } from "@/services/helper";

// ".json" -> the Compass-compatible `{ connections: [...] }` shape (also
// what this app itself uses for ~/.mongoterm/compass.json); anything else
// -> a plain mongosh-style URI list. Keeps import/export to a single
// file-path prompt instead of a separate format picker.
function detectConnectionFileFormat(filePath: string): "compass" | "uri" {
  return filePath.trim().toLowerCase().endsWith(".json") ? "compass" : "uri";
}

function waitFor(
  check: () => boolean,
  timeoutMs: number,
  intervalMs = 150,
): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = setInterval(() => {
      // logger.debug({
      //   message: `Polling for condition... elapsed: ${state.databases.length} ${Date.now() - start}ms`,
      // });
      if (state.databases.length || Date.now() - start > timeoutMs) {
        clearInterval(id);
        resolve();
      }
    }, intervalMs);
  });
}

export function registerDirectoryTree(parent: any, top: any) {
  //  const workspacePanel = appInstance.ui.panels.workspace;
  try {
    const tree = createTree(parent, {
      top: 0,
      left: 0,
      width: "25%",
      height: "100%-3",
      label: " Connection ",
      border: "line",
      style: {
        border: { fg: theme.border.blur },
        label: {},
      },
    });
    function buildConnectionNodes() {
      const names = getConnectionNames();
      const nodes = names.map((name: string, index: number) =>
        tree.makeNode("connection", name, undefined, { index }),
      );
      tree.setRoots(nodes);
    }
    buildConnectionNodes();

    function openNewConnectionForm() {
      openForm({
        title: "MongoDB Connection",
        fields: [
          {
            name: "connectionName",
            label: "connectionName",
            value: "localhost",
          },
          {
            name: "connectionString",
            label: "connectionString",
            value: "mongodb://localhost:27017",
          },
        ],
        onSubmit(data) {
          saveConnection(data);
          state.connections = getConfiguration().connections ?? [];
          appInstance.eventBus.emit(EVENTS.DB_CONNECT, data, true);

          buildConnectionNodes();
        },
      });
    }

    function openEditConnectionForm(node: TreeNode) {
      const conn = state.connections[node.meta.index];
      if (!conn) return;

      openForm({
        title: "Edit Connection",
        fields: [
          {
            name: "connectionName",
            label: "connectionName",
            value: conn.favorite.name,
          },
          {
            name: "connectionString",
            label: "connectionString",
            value: conn.connectionOptions.connectionString,
          },
        ],
        onSubmit(data) {
          appInstance.eventBus.emit(EVENTS.CONNECTION_UPDATE, {
            id: conn.id,
            data,
          });
        },
      });
    }

    function openNewCollectionForm(dbNode: TreeNode) {
      const { dbName } = dbNode.meta;

      openForm({
        title: `New Collection in ${dbName}`,
        fields: [
          { name: "collectionName", label: "collectionName", value: "" },
        ],
        onSubmit(data) {
          if (!data.collectionName?.trim()) return;
          appInstance.eventBus.emit(
            EVENTS.COLLECTION_CREATE,
            dbName,
            data.collectionName.trim(),
          );
        },
      });
    }
    function openNewDatabaseForm(connNode: TreeNode) {
      const conn = state.connections[connNode.meta.index];
      logger.debug({ message: "openNewDatabaseForm", conn });
      if (!conn) return;

      openForm({
        title: `New Database in ${conn.favorite.name}`,
        fields: [{ name: "databaseName", label: "databaseName", value: "" }],
        onSubmit(data) {
          if (!data.databaseName?.trim()) return;
          appInstance.eventBus.emit(
            EVENTS.DATABASE_CREATE,
            data.databaseName.trim(),
          );
        },
      });
    }
    // 🔹 export: the highlighted connection, or all of them if none/other
    // node type is selected
    function exportConnectionsFlow(selected: TreeNode | null | undefined) {
      const single =
        selected?.type === "connection"
          ? state.connections[selected.meta.index]
          : null;
      const toExport = single ? [single] : state.connections;
      if (!toExport.length) return;

      const defaultPath = path.join(
        os.homedir(),
        single ? `${single.favorite.name}.json` : "mongoterm-connections.json",
      );

      promptInline(
        `Export ${toExport.length} connection(s) to (.json = Compass, else = URI list)`,
        defaultPath,
        (filePath) => {
          if (filePath?.trim()) {
            appInstance.eventBus.emit(EVENTS.CONNECTION_EXPORT, {
              filePath: filePath.trim(),
              format: detectConnectionFileFormat(filePath),
              connections: toExport,
            });
          }
          tree.el.focus();
          appInstance.renderScreen();
        },
      );
    }

    // 🔹 import: merge connections from a Compass JSON or URI-list file
    function importConnectionsFlow() {
      const defaultPath = path.join(os.homedir(), "mongoterm-connections.json");

      promptInline(
        "Import connections from (.json = Compass, else = URI list)",
        defaultPath,
        (filePath) => {
          if (filePath?.trim()) {
            appInstance.eventBus.emit(EVENTS.CONNECTION_IMPORT, {
              filePath: filePath.trim(),
              format: detectConnectionFileFormat(filePath),
            });
          }
          tree.el.focus();
          appInstance.renderScreen();
        },
      );
    }

    tree.el.key(["x"], () => {
      exportConnectionsFlow(tree.getSelectedNode());
    });

    tree.el.key(["i"], () => {
      importConnectionsFlow();
    });

    // 🔹 create: context-aware based on the highlighted node
    tree.el.key(["C-e"], () => {
      const selected = tree.getSelectedNode();
      logger.debug({ message: "Create new item", type: selected?.type });
      if (!selected || selected.type === "connection") {
        openNewConnectionForm();
      } else if (selected.type === "database") {
        // create a sibling database within the same connection, mirroring
        // how a "collection" node creates a sibling collection below
        openNewDatabaseForm(selected.parent!);
      } else if (selected.type === "collection") {
        openNewCollectionForm(selected.parent!);
      }
    });

    // 🔹 edit the highlighted connection
    tree.el.key(["e"], () => {
      const selected = tree.getSelectedNode();
      if (selected?.type === "connection") {
        openEditConnectionForm(selected);
      }
    });

    // 🔹 delete/drop the highlighted node (connection / database / collection)
    tree.el.key(["d"], () => {
      const selected = tree.getSelectedNode();
      if (!selected) return;

      if (selected.type === "connection") {
        const conn = state.connections[selected.meta.index];
        if (!conn) return;

        openDialogConfirm(`Delete connection "${conn.favorite.name}"?`, () => {
          appInstance.eventBus.emit(EVENTS.CONNECTION_DELETE, conn.id);
        });
      } else if (selected.type === "database") {
        const { dbName } = selected.meta;

        openDialogConfirm(
          `Drop database "${dbName}"? This cannot be undone.`,
          () => {
            appInstance.eventBus.emit(EVENTS.DATABASE_DROP, dbName);
          },
        );
      } else if (selected.type === "collection") {
        const { dbName, colName } = selected.meta;

        openDialogConfirm(
          `Drop collection "${colName}"? This cannot be undone.`,
          () => {
            appInstance.eventBus.emit(EVENTS.COLLECTION_DROP, dbName, colName);
          },
        );
      }
    });

    // 🔹 keep the tree in sync once a CRUD operation completes
    appInstance.eventBus.on(EVENTS.CONNECTION_UPDATED, () =>
      buildConnectionNodes(),
    );
    appInstance.eventBus.on(EVENTS.CONNECTION_DELETED, () =>
      buildConnectionNodes(),
    );
    appInstance.eventBus.on(EVENTS.CONNECTION_IMPORTED, () =>
      buildConnectionNodes(),
    );

    appInstance.eventBus.on(
      EVENTS.DATABASE_CREATED,
      ({ databases }: { dbName: string; databases: string[] }) => {
        const connNode = tree.getRoots().find((r) => r.expanded);
        if (!connNode) return;

        connNode.children = databases.map((name) =>
          tree.makeNode("database", name, connNode, { dbName: name }),
        );
        tree.render();
      },
    );

    appInstance.eventBus.on(
      EVENTS.DATABASE_DROPPED,
      ({ databases }: { dbName: string; databases: string[] }) => {
        const connNode = tree.getRoots().find((r) => r.expanded);
        if (!connNode) return;

        connNode.children = databases.map((name) =>
          tree.makeNode("database", name, connNode, { dbName: name }),
        );
        tree.render();
      },
    );

    appInstance.eventBus.on(
      EVENTS.COLLECTION_CREATED,
      ({
        dbName,
        collections,
      }: {
        dbName: string;
        colName: string;
        collections: string[];
      }) => {
        const connNode = tree.getRoots().find((r) => r.expanded);
        const dbNode = connNode?.children.find(
          (c) => c.meta?.dbName === dbName,
        );
        if (!dbNode) return;

        dbNode.children = collections.map((name) =>
          tree.makeNode("collection", name, dbNode, { dbName, colName: name }),
        );
        dbNode.loaded = true;
        tree.render();
      },
    );

    appInstance.eventBus.on(
      EVENTS.COLLECTION_DROPPED,
      ({
        dbName,
        collections,
      }: {
        dbName: string;
        colName: string;
        collections: string[];
      }) => {
        const connNode = tree.getRoots().find((r) => r.expanded);
        const dbNode = connNode?.children.find(
          (c) => c.meta?.dbName === dbName,
        );
        if (!dbNode) return;

        dbNode.children = collections.map((name) =>
          tree.makeNode("collection", name, dbNode, { dbName, colName: name }),
        );
        tree.render();
      },
    );

    tree.setCallbacks({
      onExpand: async (node: TreeNode) => {
        if (node.type === "connection") {
          // กันข้อมูลชนกัน: ยุบ connection อื่นที่เปิดค้างไว้ก่อน
          // (เพราะ state.databases / state.collections เป็น global array
          // รองรับ connection ที่ active อยู่ตัวเดียวในตอนนี้)
          for (const root of tree.getRoots()) {
            if (root !== node && root.expanded) {
              root.expanded = false;
              root.children = [];
              root.loaded = false;
            }
          }
          state.databases = [];
          state.collections = [];

          const conn = state.connections[node.meta.index];
          const uri = conn.connectionOptions.connectionString;
          logger.info({ message: `Connecting to ${uri}` });

          appInstance.eventBus.emit(
            EVENTS.DB_CONNECT,
            { connectionString: uri },
            false,
          );

          // ⚠️ ASSUMPTION: ในโค้ดที่ส่งมาไม่มี event ที่บอกว่า
          // "database list โหลดเสร็จแล้ว" เลยใช้วิธี poll state.databases
          // แทนไปก่อน (สูงสุด 8 วิ) ถ้ามี event จริง เช่น
          // EVENTS.DB_DATABASES_LOADED ให้เปลี่ยนมา listen event นั้นแทน
          // จะลื่นกว่าและแม่นกว่า
          await waitFor(() => state.databases.length > 0, 8000);

          node.children = state.databases.map((dbName: string) =>
            tree.makeNode("database", dbName, node, { dbName }),
          );
          appInstance.renderScreen();
        }

        if (node.type === "database") {
          for (const sibling of node.parent!.children) {
            if (sibling !== node && sibling.expanded) {
              sibling.expanded = false;
              sibling.children = [];
              sibling.loaded = false;
            }
          }
          state.collections = [];

          const { dbName } = node.meta;
          state.selectedDatabaseIndex = state.databases.indexOf(dbName);
          appInstance.eventBus.emit(EVENTS.DB_DATABASES_SELECTED, dbName);

          // ⚠️ ASSUMPTION เดียวกันกับด้านบน — poll state.collections
          await waitFor(() => state.collections.length > 0, 8000);

          node.children = state.collections.map((colName: string) =>
            tree.makeNode("collection", colName, node, { dbName, colName }),
          );
        }
      },

      onSelectLeaf: (node: TreeNode) => {
        try {
          const { colName } = node.meta;
          state.selectedCollectionIndex = state.collections.indexOf(colName);
          appInstance.eventBus.emit(EVENTS.DB_COLLECTIONS_SELECTED, colName);
          appInstance.renderScreen();
        } catch (err: any) {
          logger.error({ message: "Collection selection error:", err });
          //         workspacePanel!.setContent(`Error: ${err.message}`);
          appInstance.renderScreen();
        }
      },
    });

    return tree;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error({ message: "Error registering directory tree", error });
    }
  }
}
