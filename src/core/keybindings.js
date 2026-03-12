import { workspacePanel } from "../panels/workspace.panel.js";

import { screen } from "./screen.js";
import { state } from "./state.js";

export const keybindings = (ui) => {
  screen.key(["tab"], () => {
    if (screen.focused === ui.workspace) {
      ui.childConnection.connectionDD.header.focus();
    } else {
      ui.workspace.focus();
    }
  });

  screen.key(["k", "up"], () => {
    if (screen.focused === ui.workspace) {
      screen.debug("workspace → query");
      ui.query.focus();
    }
  });

  screen.key(["q", "C-c"], async () => {
    if (state.mongoClient) {
      await state.mongoClient.close();
    }
    process.exit(0);
  });
};
