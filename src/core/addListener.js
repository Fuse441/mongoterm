import { screen } from "./screen.js";
import { state } from "./state.js";
import { eventBus } from "./eventBus.js";
import { dialogConnect } from "../utils/logger.js";
import { EVENTS } from "../services/enum.js";
function getConnectionNames() {
  return (state.connections || [])
    .map((c) => c?.favorite?.name)
    .filter(Boolean);
}
export function addQueryListeners(query) {
  query.on("submit", () => {
    screen.debug("on enter query");
    eventBus.emit(EVENTS.QUERY_SEND, query.getValue() || {});
  });
}
export const attachFocusStyle = (
  widget,
  { focusBorder = "", blurBorder = "", focusBg = "", blurBg = "" },
) => {
  widget.on("focus", () => {
    if (focusBorder) widget.style.border.fg = focusBorder;
    if (focusBg) widget.style.bg = focusBg;

    screen.render();
  });

  widget.on("blur", () => {
    if (blurBorder) widget.style.border.fg = blurBorder;
    if (blurBg) widget.style.bg = blurBg;

    screen.render();
  });
};
function openDropdown(dd, items) {
  if (!Array.isArray(items) || items.length === 0) return;

  dd.list.setItems(items);
  dd.list.show();
  dd.list.focus();
  screen.render();
}

function closeDropdown(dd) {
  dd.list.hide();
  dd.header.focus();
  screen.render();
}

export const attachActions = (
  { connectionDD, databaseDD, collectionDD },
  workspacePanel,
) => {
  connectionDD.header.setContent(" Select Connection ▼ ");

  connectionDD.header.key("enter", () => {
    screen.debug("on connectionDD");
    openDropdown(connectionDD, getConnectionNames());
  });
  connectionDD.list.on("select", async (_, index) => {
    try {
      screen.debug(`on select ${_}`);
      state.selectedConnectionIndex = index;

      const conn = state.connections[index];
      const uri = conn.connectionOptions.connectionString;

      connectionDD.header.setContent(` ${conn.favorite.name} ▼ `);
      closeDropdown(connectionDD);

      screen.render();

      eventBus.emit("db:connect", uri);
      eventBus.emit("db:fetchDatabases", state.databases);
      state.collections = [];

      databaseDD.header.setContent(" Select Database ▼ ");
      collectionDD.header.setContent(" Select Collection ▼ ");

      screen.render();
    } catch (err) {
      workspacePanel.setContent(`${err.message}`);
      screen.render();
    }
  });

  //
  // ──────────────────────────────────────────
  // DATABASE SELECT
  // ──────────────────────────────────────────
  //

  databaseDD.header.setContent(" Select Database ▼ ");

  databaseDD.header.key("enter", () => {
    openDropdown(databaseDD, state.databases);
  });

  databaseDD.list.on("select", async (_, index) => {
    try {
      state.selectedDatabaseIndex = index;

      const dbName = state.databases[index];

      databaseDD.header.setContent(` ${dbName} ▼ `);
      workspacePanel.setContent(dialogConnect(dbName));

      closeDropdown(databaseDD);
      eventBus.emit("db:databaseSelected", dbName);

      collectionDD.header.setContent(" Select Collection ▼ ");
      collectionDD.header.focus();
      screen.render();
    } catch (err) {
      workspacePanel.setContent(` Error: ${err.message}`);
      screen.render();
    }
  });

  //
  // ──────────────────────────────────────────
  // COLLECTION SELECT
  // ──────────────────────────────────────────
  //

  collectionDD.header.setContent(" Select Collection ▼ ");

  collectionDD.header.key("enter", () => {
    screen.debug("enter col");
    openDropdown(collectionDD, state.collections);
  });

  collectionDD.list.on("select", async (_, index) => {
    try {
      state.selectedCollectionIndex = index;

      const name = state.collections[index];

      collectionDD.header.setContent(` ${name} ▼ `);
      closeDropdown(collectionDD);
      eventBus.emit(EVENTS.DB_COLLECTIONS_SELECTED, name);

      screen.render();
    } catch (error) {
      workspacePanel.setContent(` Error: ${error.stack}`);
      screen.render();
    }
  });
};
