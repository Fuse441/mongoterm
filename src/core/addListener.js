import { screen } from "./screen.js";
import { state } from "./state.js";
import { eventBus } from "./eventBus.js";
import { dialogConnect } from "../utils/logger.js";
function getConnectionNames() {
  return (state.connections || [])
    .map((c) => c?.favorite?.name)
    .filter(Boolean);
}

export const attachFocusStyle = (
  widget,
  { focusBorder, blurBorder, focusBg, blurBg },
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
  eventBus.on("query:result", (query) => {
    workspacePanel.setContent(JSON.stringify(query));

    screen.render();
  });
  eventBus.on("db:collectionsLoaded", (colls) => { });
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

      workspacePanel.setContent(dialogConnect("-", "-"));

      screen.render();

      eventBus.emit("db:connect", uri);
      //await connectMongo(uri);
      //   workspacePanel.setContent(msg);
      eventBus.emit("db:fetchDatabases", state.databases);
      state.collections = [];

      databaseDD.header.setContent(" Select Database ▼ ");
      databaseDD.header.focus();
      collectionDD.header.setContent(" Select Collection ▼ ");

      //workspacePanel.setContent();
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
      workspacePanel.setContent(dialogConnect(dbName, "-"));

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
      workspacePanel.setContent(
        dialogConnect(state.databases[state.selectedDatabaseIndex], name),
      );
      closeDropdown(collectionDD);

      screen.render();
    } catch (error) {
      workspacePanel.setContent(` Error: ${error.message}`);
      screen.render();
    }
  });
};
