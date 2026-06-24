import blessed from "neo-blessed";

import { theme } from "../config/app.config.js";
import { openEditor } from "./modal.panel.js";
import { keybindbarConfig } from "./keybingbar/keybindbar.config.js";
import { appInstance } from "@/app.js";

export const workspacePanel: any = () => {
  const id = "workspace";
  const box = blessed.box({
    id,
    top: 3,
    left: "25%",
    width: "75%",
    height: "87%",
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
  box.on("focus", () => {
    box.style.border.fg = theme.border.focus;
    appInstance.setKeybindbarContent(id);
  });

  box.on("blur", () => {
    box.style.border.fg = theme.border.blur;
    box.style.bg = theme.header.blurBg;

    box.screen.render();
  });

  box.key(["C-n"], () => {
    openEditor({});
  });

  return box;
};
