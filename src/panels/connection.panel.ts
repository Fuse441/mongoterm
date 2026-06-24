import blessed from "neo-blessed";
import { theme } from "../config/app.config.js";
import { keybindbarConfig } from "./keybingbar/keybindbar.config.js";
export const connectionPanel: any = () => {
  const box = blessed.box({
    top: 0,
    left: 0,
    width: "25%",
    height: "90%",
    label: " Connection ",
    border: "line",
    style: {
      border: { fg: theme.border.blur },
      label: {},
    },
  });
  return box;
};

export function createDropdown(top: any, parent: any) {
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
      border: { fg: theme.border.blur },
      bg: "black",
    },
  });
  header.on("focus", () => {
  header.style.border.fg = theme.border.focus;
  header.style.bg = theme.header.focusBg;

  header.screen.render();
});

header.on("blur", () => {
  header.style.border.fg = theme.border.blur;
  header.style.bg = theme.header.blurBg;

  header.screen.render();
});
  const list = blessed.list({
    parent,
    top: top + 3,
    left: 1,
    width: "90%",
    type: "dropdown",
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
      //inverse: true,
    },
    style: {
      selected: {
        bg: "cyan",
        fg: "black",
      },
    },
  });
   return { header, list };
}
