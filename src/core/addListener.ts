// import blessed from "neo-blessed";
//
// import { getScreen } from "@/core/screen";
// import { state } from "@/shared/state";
// import { eventBus } from "@/core/eventBus";
// import { dialogConnect, logger } from "@/utils/logger/logger.service";
// import { EVENTS } from "@/services/enum";
// import { openInputPanel } from "@/panels/input.panel";
// import {
//   resetCollectionSelection,
//   resetDBSelection,
// } from "@/services/helper.js";
// //import { closeDropdown, openDropdown } from "@/components/dropdown.service";
// import { getConnectionNames } from "@/shared/selectors/connection.selectors";
//
// export const attachActions = (
//   { connectionDD, databaseDD, collectionDD }: any,
//   workspacePanel: any,
// ) => {
//   // ─────────────────────────────
//   // CONNECTION
//   // ─────────────────────────────
//   connectionDD.header.setContent(" Select Connection ▼ ");
//
//   // 🔹 manual connection (Ctrl+E)
//   connectionDD.header.key(["C-e"], () => {
//     openInputPanel("Enter Mongo URI", (uri: any) => {
//       connectionDD.header.setContent(" Manual ▼ ");
//       // getgetScreen().).render();
//
//       eventBus.emit("db:connect", uri);
//     });
//   });
//
//   // 🔹 dropdown
//   connectionDD.header.key("enter", () => {
//     openDropdown(connectionDD, getConnectionNames());
//   });
//
//   connectionDD.list.on(
//     "select",
//     async (_: blessed.Widgets.BoxOptions, index: number) => {
//       try {
//         const conn = state.connections[index];
//         const uri = conn.connectionOptions.connectionString;
//         logger.info({ message: `Connecting to ${uri}` });
//         state.selectedConnectionIndex = index;
//
//         connectionDD.header.setContent(` ${conn.favorite.name} ▼ `);
//         closeDropdown(connectionDD);
//
//         resetDBSelection(databaseDD, collectionDD);
//
//         eventBus.emit("db:connect", uri);
//         eventBus.emit("db:fetchDatabases");
//
//         getScreen().render();
//       } catch (err: any) {
//         logger.error({ message: "Connection error:", err });
//         workspacePanel.setContent(err?.message);
//         getScreen().render();
//       }
//     },
//   );
//
//   // ─────────────────────────────
//   // DATABASE
//   // ─────────────────────────────
//   databaseDD.header.setContent(" Select Database ▼ ");
//
//   databaseDD.header.key("enter", () => {
//     openDropdown(databaseDD, state.databases);
//   });
//
//   databaseDD.list.on("select", (_: any, index: number) => {
//     try {
//       const dbName = state.databases[index];
//       state.selectedDatabaseIndex = index;
//
//       databaseDD.header.setContent(` ${dbName} ▼ `);
//       closeDropdown(databaseDD);
//
//       workspacePanel.setContent(dialogConnect(dbName));
//
//       eventBus.emit("db:databaseSelected", dbName);
//
//       resetCollectionSelection(collectionDD);
//       collectionDD.header.focus();
//
//       getScreen().render();
//     } catch (err: any) {
//       workspacePanel.setContent(`Error: ${err.message}`);
//       getScreen().render();
//     }
//   });
//
//   // ─────────────────────────────
//   // COLLECTION
//   // ─────────────────────────────
//
  // ─────────────────────────────
  // 🔥 QUERY MODE (ใหม่)
  // ─────────────────────────────
  // getScreen().key("C-q", () => {
  //   openInputPanel("Mongo Query (JSON)", (query: any) => {
  //     try {
  //       const parsed = JSON.parse(query);
  //
  //       eventBus.emit("db:query", {
  //         collection: state.collections[state.selectedCollectionIndex],
  //         query: parsed,
  //       });
  //
  //       workspacePanel.setContent(` Running query...\n${query}`);
  //     } catch (err: any) {
  //       workspacePanel.setContent(` Invalid JSON:\n${err.message}`);
  //     }
  //
  //     getScreen().render();
  //   });
  // });
//};
