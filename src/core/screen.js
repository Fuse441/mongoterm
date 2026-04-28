import _blessed from "neo-blessed";

const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);
import { mogonTermLayout } from "../layout/main.layout.js";
import { connectionPanel } from "../panels/connection.panel.js";
import { workspacePanel } from "../panels/workspace.panel.js";
import {
  addQueryListeners,
  attachActions,
  attachFocusStyle,
} from "./addListener.js";
import { keybindings } from "./keybindings.js";
import { theme } from "../config/app.config.js";
import { registerEventBus } from "./eventBus.js";
let screenInstance = null;

function getScreen() {
  if (!screenInstance) {
    screenInstance = blessed.screen({
      smartCSR: true,
      title: "mongoterm",
      debug: true,
      keys: true,
    });
  }

  return screenInstance;
}
export const screen = getScreen();
console.log("Initializing screen...");
export const ui = mogonTermLayout(screen);
registerEventBus();
attachFocusStyle(ui.connection, {
  focusBorder: theme.border.focus,
  blurBorder: theme.border.blur,
});
addQueryListeners(ui.query);
attachFocusStyle(ui.workspace, {
  focusBorder: theme.border.focus,
  blurBorder: theme.border.blur,
});
attachActions(ui.childConnection, ui.workspace);
ui.childConnection.connectionDD.header.focus();

keybindings(ui);
