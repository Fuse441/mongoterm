import blessed from "neo-blessed";
import { theme } from "../config/app.config.js";
import { attachFocusStyle } from "../core/addListener.js";

export const connectionPanel = () => {
  const box = blessed.box({
    top: 0,
    left: 0,
    width: "25%",
    height: "100%",
    label: " Connection ",
    border: "line",
    style: {
      border: { fg: theme.border.blur },
      label: {},
    },
  });

  return box;
};

export function createDropdown(top, parent) {
  const header = blessed.box({
    parent,
    top,
    left: 1,
    width: "90%",
    height: 3,
    content: " ▼ ",
    border: "line",
    keys: true,
    mouse: true,
    style: {
      border: { fg: "cyan" },
      bg: "black",
    },
  });
  const list = blessed.list({
    parent,
    top: top + 3,
    left: 1,
    width: "90%",
    height: 10,
    hidden: true,
    border: "line",
    keys: true,
    mouse: true,
    vi: true, // ✅ ถูกต้อง
    scrollable: true, // ✅ ใส่ที่ list
    alwaysScroll: true,
    scrollbar: {
      ch: " ",
      inverse: true,
    },
    style: {
      selected: {
        bg: "cyan",
        fg: "black",
      },
    },
  });
  attachFocusStyle(header, {
    focusBorder: theme.border.focus,
    blurBorder: theme.border.blur,
  });

  attachFocusStyle(header, {
    focusBg: theme.header.focusBg,
    blurBorder: theme.border.blur,
  });

  return { header, list };
}
