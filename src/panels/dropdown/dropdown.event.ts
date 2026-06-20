import { appInstance } from "@/app";
import { openInputPanel } from "../input.panel";
import { getConnectionNames } from "@/shared/selectors/connection.selectors";
import blessed from "neo-blessed";
import { state } from "@/shared/state";
import { logger } from "@/utils/logger/logger.service";
import { EVENTS } from "@/services/enum";
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
};
const registerEventConnectionDD = () => {
  const { connectionDD, databaseDD, collectionDD } = appInstance.ui.dropdowns;
  const workspacePanel = appInstance.ui.panels.workspace;
  connectionDD!.header.setContent(" Select Connection ▼ ");
  connectionDD!.header.key(["C-e"], () => {
    openInputPanel("Enter Mongo URI", (uri: any) => {
      appInstance.ui.dropdowns.connectionDD!.header.setContent(" Manual ▼ ");
      appInstance.eventBus.emit("db:connect", uri);
    });
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
        appInstance.eventBus.emit(EVENTS.DB_CONNECT, uri);

        appInstance.renderScreen();
      } catch (err: any) {
        logger.error({ message: "Connection error:", err });
        workspacePanel!.setContent(err?.message);
        appInstance.renderScreen();
      }
    },
  );
};

//
