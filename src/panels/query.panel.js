import _blessed from "neo-blessed";

const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);

import { theme } from "../config/app.config.js";

export const queryInput = (workspacePanel) => {
  const box = blessed.textbox({
    //    parent: workspacePanel,
    top: 0,
    left: 47,
    width: "75%",
    height: 3,
    label: " Query ",
    border: "line",
    inputOnFocus: true,
    vi: false,
    cbreak: false,
    keys: true,
    mouse: true,
    style: {
      border: { fg: theme.border.blur },
      focus: {
        border: {},
      },
    },
  });
  return box;
};
