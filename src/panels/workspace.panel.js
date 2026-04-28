import _blessed from "neo-blessed";

const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);

import { theme } from "../config/app.config.js";
import { screen } from "../core/screen.js";
import { openEditor } from "./modal.panel.js";

export const workspacePanel = () => {
  const box = blessed.box({
    top: 3,
    left: "25%",
    width: "75%",
    height: "95%",
    label: " Workspace ",
    border: "line",
    tags: true,

    scrollable: true,
    alwaysScroll: true,
    keys: true,
    mouse: true,

    scrollbar: {
      ch: " ",
      track: {
        bg: "gray",
      },
      style: {
        bg: "green",
      },
    },

    style: {
      border: { fg: theme.border.blur },
      label: {},
    },
  });
  box.key(["C-n"], () => {
    openEditor({});
  });

  return box;
};
