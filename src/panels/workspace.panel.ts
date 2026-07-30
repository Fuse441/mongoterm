import blessed from "neo-blessed";

import { theme } from "../config/app.config.js";
import { openDialogConfirm, openEditor, promptInline } from "./modal.panel.js";
import { toggleIndexesPanel } from "./indexes.panel.js";
import { toggleCollectionStatsPanel } from "./collectionStats.panel.js";
import { toggleSchemaAnalysisPanel } from "./schemaAnalysis.panel.js";
import { toggleViewMode } from "./result.panel.js";
import { keybindbarConfig } from "./keybingbar/keybindbar.config.js";
import { appInstance } from "@/app.js";
import { state } from "@/shared/state.js";
import { EVENTS } from "@/services/enum.js";
import { showToast } from "./toast.panel.js";

// Duplicated (not imported) in result.panel.ts, which overwrites this box's
// label entirely on every render (results/pagination summary) and needs
// the same hint to survive past the box's initial, pre-query construction
// label. Not shared via import because result.panel.ts already imports
// from this file (toggleViewMode -> workspace.panel.ts's "v" key), and
// this file importing back from result.panel.ts would create a cycle —
// keep both copies in sync by hand if this ever changes.
const WORKSPACE_NAV_HINT = "{grey-fg}[h→tree] [k→query] [l→record]{/grey-fg}";

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

function handleBulkDelete() {
  const query = currentQuery();
  const count = state.totalMatching;

  if (count === 0) {
    showToast({ statusCode: 400, message: "No records match this filter" });
    return;
  }

  openDialogConfirm(
    `Delete ALL ${count} record(s) matching this filter? This cannot be undone.`,
    () => appInstance.eventBus.emit(EVENTS.RECORD_DELETE_MANY, { query }),
  );
}

export const workspacePanel: any = () => {
  const id = "workspace";
  const box = blessed.box({
    id,
    top: 4,
    left: "25%",
    width: "75%",
    height: "100%-7",
    label: ` Workspace  ${WORKSPACE_NAV_HINT} `,
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
  box.key(["S-d"], () => handleBulkDelete());
  box.key(["i"], () => toggleIndexesPanel());
  box.key(["S-i"], () => toggleCollectionStatsPanel());
  box.key(["v"], () => toggleViewMode());
  box.key(["a"], () => toggleSchemaAnalysisPanel());

  return box;
};
