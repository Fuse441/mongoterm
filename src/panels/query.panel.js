import _blessed from "neo-blessed";

const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);

import { theme } from "../config/app.config.js";
import { screen } from "../core/screen.js";
import { historyPanel } from "./history.panel.js";

export const queryInput = () => {
  const box = blessed.textbox({
    top: 0,
    left: 47,
    width: "75%",
    height: 3,
    label: " Query ",
    border: "line",
    inputOnFocus: true,
    vi: false,
    keys: true,
    mouse: true,
    style: {
      border: { fg: theme.border.blur },
      focus: { border: {} },
    },
  });
  //open box history
  box.key(["C-o"], () => {
    box.cancel();
    screen.debug("Open history panel");
    screen.append(historyPanel());
  });
  return box;
};
