import blessed from "neo-blessed";

import { theme } from "../config/app.config.js";
import { openEditor, promptInline } from "./modal.panel.js";
import { keybindbarConfig } from "./keybingbar/keybindbar.config.js";
import { appInstance } from "@/app.js";
import { state } from "@/shared/state.js";
import { EVENTS } from "@/services/enum.js";
import { showToast } from "./toast.panel.js";

function currentQuery(): string {
  return appInstance.ui.panels.query!.getContent();
}

function rerun() {
  state.page = 1;
  appInstance.eventBus.emit(EVENTS.QUERY_SEND, currentQuery());
}

function openSortPrompt(box: any) {
  const current = state.sort
    ? Object.entries(state.sort)
        .map(([field, dir]) => `${field}:${dir}`)
        .join(",")
    : "";

  promptInline(
    "Sort — field:1 or field:-1 (empty to clear)",
    current,
    (value) => {
      box.focus();
      if (value === null) return;

      const trimmed = value.trim();
      if (!trimmed) {
        state.sort = null;
        rerun();
        return;
      }

      const [field, dirRaw] = trimmed.split(":").map((s) => s.trim());
      const dir = dirRaw === "-1" ? -1 : dirRaw === "1" ? 1 : null;

      if (!field || dir === null) {
        showToast({
          statusCode: 400,
          message: 'Invalid sort — use "field:1" or "field:-1"',
        });
        return;
      }

      state.sort = { [field]: dir };
      rerun();
    },
  );
}

function openPageSizePrompt(box: any) {
  promptInline("Page size", String(state.pageSize), (value) => {
    box.focus();
    if (value === null) return;

    const size = Number(value.trim());
    if (!Number.isInteger(size) || size <= 0) {
      showToast({
        statusCode: 400,
        message: "Invalid page size — enter a positive integer",
      });
      return;
    }

    state.pageSize = size;
    rerun();
  });
}

export const workspacePanel: any = () => {
  const id = "workspace";
  const box = blessed.box({
    id,
    top: 3,
    left: "25%",
    width: "75%",
    height: "100%-6",
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
    openEditor({}, { isInsert: true });
  });

  box.key(["s"], () => openSortPrompt(box));
  box.key(["S-s"], () => openPageSizePrompt(box));

  return box;
};
