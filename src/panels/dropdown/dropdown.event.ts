import { appInstance } from "@/app";
import { getConnectionNames } from "@/shared/selectors/connection.selectors";
import blessed from "neo-blessed";
import { state } from "@/shared/state";
import { logger } from "@/utils/logger/logger.service";
import { EVENTS } from "@/services/enum";
import { openForm } from "../form/form.panel";
import { openDialogConfirm } from "../modal.panel";
function resetCollectionSelection(collectionDD: blessed.Widgets.BoxOptions) {
  state.collections = [];
  collectionDD.header.setContent(" Select Collection ▼ ");
}
function resetDBSelection(
  databaseDD: blessed.Widgets.BoxOptions,
  collectionDD: blessed.Widgets.BoxOptions,
) {
  state.databases = [];
  state.collections = [];

  databaseDD.header.setContent(" Select Database ▼ ");
  collectionDD.header.setContent(" Select Collection ▼ ");
}
function openDropdown(dd: any, items: any) {
  if (!Array.isArray(items) || items.length === 0) return;

  dd.list.setItems(items);
  dd.list.show();
  dd.list.focus();
  appInstance.renderScreen();
}
export function focusDropdown(dd: any) {
  dd.header.focus();
  appInstance.renderScreen();
}
function closeDropdown(dd: any) {
  dd.list.hide();
  dd.header.focus();
  appInstance.renderScreen();
}
export const initDropdownEvents = () => {
  registerEventConnectionDD();
  registerEventDatabaseDD();
  registerEventCollectionDD();
};

const registerEventCollectionDD = () => {
  const workspacePanel = appInstance.ui.panels.workspace;
  const { collectionDD } = appInstance.ui.dropdowns;
  collectionDD!.header.setContent(" Select Collection ▼ ");

  collectionDD!.header.key("enter", () => {
    openDropdown(collectionDD, state.collections);
  });

  collectionDD!.list.on("select", (_: any, index: any) => {
    try {
      const name = state.collections[index];
      state.selectedCollectionIndex = index;

      collectionDD!.header.setContent(` ${name} ▼ `);
      closeDropdown(collectionDD);

      appInstance.eventBus.emit(EVENTS.DB_COLLECTIONS_SELECTED, name);
      appInstance.renderScreen();
    } catch (err: any) {
      logger.error({ message: "Collection selection error:", err });
      workspacePanel!.setContent(`Error: ${err.message}`);
      appInstance.renderScreen();
    }
  });
};

const registerEventDatabaseDD = () => {
  const workspacePanel = appInstance.ui.panels.workspace;

  const { databaseDD, collectionDD } = appInstance.ui.dropdowns;
  databaseDD!.header.setContent(" Select Database ▼ ");

  databaseDD!.header.key("enter", () => {
    openDropdown(databaseDD, state.databases);
  });

  // 🔹 create a new database (requires an initial collection, since
  // MongoDB doesn't persist an empty database)
  databaseDD!.header.key(["C-e"], () => {
    openForm({
      title: "New Database",
      fields: [
        { name: "databaseName", label: "databaseName", value: "" },
        {
          name: "collectionName",
          label: "initial collection",
          value: "default",
        },
      ],
      onSubmit(data) {
        if (!data.databaseName?.trim()) return;
        appInstance.eventBus.emit(
          EVENTS.DATABASE_CREATE,
          data.databaseName.trim(),
          data.collectionName?.trim() || "default",
        );
      },
    });
  });

  databaseDD!.list.on("select", (_: any, index: number) => {
    try {
      const dbName = state.databases[index];
      state.selectedDatabaseIndex = index;

      databaseDD!.header.setContent(` ${dbName} ▼ `);
      closeDropdown(databaseDD);

      //      workspacePanel!.setContent(appInstance.renderWorkspace(dbName));

      appInstance.eventBus.emit(EVENTS.DB_DATABASES_SELECTED, dbName);

      resetCollectionSelection(collectionDD!);
      //      collectionDD!.header.focus();
      appInstance.renderScreen();
    } catch (err: any) {
      logger.error({ message: "Database selection error:", err });
      workspacePanel!.setContent(`Error: ${err.message}`);
      appInstance.renderScreen();
    }
  });

  // 🔹 drop the highlighted database
  databaseDD!.list.key(["d"], () => {
    const index = (databaseDD!.list as any).selected ?? 0;
    const dbName = state.databases[index];
    if (!dbName) return;

    openDialogConfirm(
      `Drop database "${dbName}"? This cannot be undone.`,
      () => {
        appInstance.eventBus.emit(EVENTS.DATABASE_DROP, dbName);
      },
    );
  });
};
const registerEventConnectionDD = () => {
  const { connectionDD, databaseDD, collectionDD } = appInstance.ui.dropdowns;
  const workspacePanel = appInstance.ui.panels.workspace;
  connectionDD!.header.setContent(" Select Connection ▼ ");
  connectionDD!.header.key(["C-e"], () => {
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
        appInstance.ui.dropdowns.connectionDD!.header.setContent(" Manual ▼ ");
        appInstance.ui.dropdowns.connectionDD!.header.render();
        appInstance.eventBus.emit(EVENTS.DB_CONNECT, data, true);
      },
    });
    // openInputPanel("Enter Mongo URI", (uri: any) => {
    //   appInstance.ui.dropdowns.connectionDD!.header.setContent(" Manual ▼ ");
    //   appInstance.ui.dropdowns.connectionDD!.header.render();
    //   appInstance.eventBus.emit(EVENTS.DB_CONNECT, uri, true);
    // });
  });

  connectionDD!.header.key("enter", () => {
    openDropdown(appInstance.ui.dropdowns.connectionDD!, getConnectionNames());
  });

  connectionDD!.list.on(
    "select",
    async (_: blessed.Widgets.BoxOptions, index: number) => {
      try {
        const conn = state.connections[index];
        const uri = conn.connectionOptions.connectionString;
        logger.info({ message: `Connecting to ${uri}` });
        state.selectedConnectionIndex = index;

        connectionDD!.header.setContent(` ${conn.favorite.name} ▼ `);
        closeDropdown(connectionDD!);

        resetDBSelection(databaseDD!, collectionDD!);
        appInstance.eventBus.emit(
          EVENTS.DB_CONNECT,
          { connectionString: uri },
          false,
        );

        appInstance.renderScreen();
      } catch (err: any) {
        logger.error({ message: "Connection error:", err });
        workspacePanel!.setContent(err?.message);
        appInstance.renderScreen();
      }
    },
  );

  // 🔹 edit the highlighted saved connection (Compass-style connection CRUD)
  connectionDD!.list.key(["e"], () => {
    const index = (connectionDD!.list as any).selected ?? 0;
    const conn = state.connections[index];
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

        connectionDD!.list.setItems(getConnectionNames());
        if (index === state.selectedConnectionIndex) {
          connectionDD!.header.setContent(` ${data.connectionName} ▼ `);
        }
        appInstance.renderScreen();
      },
    });
  });

  // 🔹 delete the highlighted saved connection
  connectionDD!.list.key(["d"], () => {
    const index = (connectionDD!.list as any).selected ?? 0;
    const conn = state.connections[index];
    if (!conn) return;

    openDialogConfirm(
      `Delete connection "${conn.favorite.name}"?`,
      () => {
        appInstance.eventBus.emit(EVENTS.CONNECTION_DELETE, conn.id);

        connectionDD!.list.setItems(getConnectionNames());
        if (index === state.selectedConnectionIndex) {
          connectionDD!.header.setContent(" Select Connection ▼ ");
        }
        appInstance.renderScreen();
      },
    );
  });
};

//
