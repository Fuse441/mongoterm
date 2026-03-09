/** @type {typeof import("blessed")} */
import blessed from "neo-blessed";
import { mogonTermLayout } from "../layout/main.layout.js";
import { connectionPanel } from "../panels/connection.panel.js";
import { workspacePanel } from "../panels/workspace.panel.js";
import { attachActions, attachFocusStyle } from "./addListener.js";
import { keybindings } from "./keybindings.js";
import { theme } from "../config/app.config.js";

export const screen = blessed.screen({
  smartCSR: true,
  title: "mongoterm",
  debug: true,
});
const ui = mogonTermLayout(screen);
attachFocusStyle(ui.connection, {
  focusBorder: theme.border.focus,
  blurBorder: theme.border.blur,
});

attachFocusStyle(ui.workspace, {
  focusBorder: theme.border.focus,
  blurBorder: theme.border.blur,
});
attachActions(ui.childConnection, ui.workspace);
ui.childConnection.connectionDD.header.focus();

keybindings(ui);
