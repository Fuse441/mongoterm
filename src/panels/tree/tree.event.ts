import { appInstance } from "@/app";
import { getConnectionNames } from "@/shared/selectors/connection.selectors";
import blessed from "neo-blessed";
import { state } from "@/shared/state";
import { logger } from "@/utils/logger/logger.service";
import { EVENTS } from "@/services/enum";
import { openForm } from "@/panels/form/form.panel";
import { createTree, TreeNode } from "@/panels/tree/tree.panel";
import { theme } from "@/config/app.config";
import { saveConnection } from "@/services/helper";

function waitFor(
  check: () => boolean,
  timeoutMs: number,
  intervalMs = 150,
): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = setInterval(() => {
      if (check() || Date.now() - start > timeoutMs) {
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
      height: "100%",
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

    tree.el.key(["C-e"], () => {
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
          appInstance.eventBus.emit(EVENTS.DB_CONNECT, data, true);

          buildConnectionNodes();
        },
      });
    });

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
