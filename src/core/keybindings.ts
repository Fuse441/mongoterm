import { toggleHelp } from "@/panels/help.panel";
import { toggleShell } from "@/panels/shell.panel";
import { logger } from "@/utils/logger/logger.service";
import { state } from "@/shared/state";
import { appInstance } from "@/app.js";
import { TResponseLayout } from "@/layout/main.layout.types";
let currentRecord = 0;
import blessed from "neo-blessed";
import { EVENTS } from "@/services/enum";

// ── config: key → action ──────────────────────────────
const getBindings = (ui: TResponseLayout) => [
  {
    keys: ["q", "C-c"],
    action: async () => {
      if (state.mongoClient) await state.mongoClient.close();
      process.exit(0);
    },
  },

  // ── connection ────────────────────────────────────
  {
    keys: ["l", "right"],
    condition: () => appInstance.screen.focused === ui.panels.tree,
    action: () => {
      ui.panels.workspace!.focus();
      appInstance.renderWorkspacePanel();
    },
  },

  // ── workspace ─────────────────────────────────────
  {
    keys: ["h", "left"],
    condition: () => appInstance.screen.focused === ui.panels.workspace,
    action: () => ui.panels.tree.focus(),
  },
  {
    keys: ["k", "up"],
    condition: () => appInstance.screen.focused === ui.panels.workspace,
    action: () => ui.panels.query!.focus(),
  },
  {
    keys: ["l", "right"],
    condition: () => appInstance.screen.focused === ui.panels.workspace,
    action: () => {
      const records: blessed.Widgets.BoxOptions[] =
        ui.panels.workspace!.children.filter((c: any) => c._isRecord);
      if (!records.length) return;
      currentRecord = 0;
      records[0].focus();
      appInstance.screen.render();
    },
  },
  {
    keys: ["S-l"],
    condition: () => appInstance.screen.focused === ui.panels.workspace,
    action: () => {
      logger.debug({
        message: "logs keybindings ==> " + state.page,
        total: state.totalPages,
      });
      // state.page/totalPages are both 1-indexed, so the last page is
      // reachable exactly when page === totalPages — this used to compare
      // against `totalPages - 1`, which blocked ever reaching a final
      // (possibly partial/remainder) page.
      if (state.page >= state.totalPages) {
        appInstance.renderScreen();
        return;
      }
      state.page += 1;
      appInstance.eventBus.emit(EVENTS.QUERY_SEND);
      appInstance.renderScreen();

      logger.debug({ message: "Shift+L pressed, focusing last record" });
    },
  },
  {
    keys: ["S-h"],
    condition: () => appInstance.screen.focused === ui.panels.workspace,
    action: () => {
      if (state.page <= 1) {
        appInstance.renderScreen();
        return;
      }
      logger.debug({
        message: "logs keybindings ==> " + state.page,
        total: state.totalPages,
      });
      state.page -= 1;
      appInstance.eventBus.emit(EVENTS.QUERY_SEND);
      appInstance.renderScreen();

      logger.debug({ message: "Shift+H pressed, focusing last record" });
    },
  },

  // ── query ─────────────────────────────────────────
  {
    keys: ["j", "down", "escape"],
    condition: () => appInstance.screen.focused === ui.panels.query,
    action: () => ui.panels.workspace!.focus(),
  },
  {
    keys: ["h", "left"],
    condition: () => appInstance.screen.focused === ui.panels.query,
    action: () => ui.panels.tree!.focus(),
  },

  // ── record ────────────────────────────────────────
  {
    keys: ["j", "down"],
    condition: () => appInstance.screen.focused?._isRecord,
    action: () => {
      const records: blessed.Widgets.BoxOptions[] =
        ui.panels.workspace!.children.filter((c: any) => c._isRecord);
      logger.debug({
        message: `records length: ${records.length}, currentRecord: ${currentRecord}`,
      });

      if (!records.length) return;
      currentRecord = Math.min(currentRecord + 1, records.length - 1);
      if (appInstance.screen.focused !== records[currentRecord].focus()) {
        logger.debug({
          message: `Focusing record ${currentRecord}`,
        });
        records[currentRecord].focus();
      }
    },
  },
  {
    keys: ["k", "up"],
    condition: () => appInstance.screen.focused?._isRecord,
    action: () => {
      const records = ui.panels.workspace!.children.filter(
        (c: any) => c._isRecord,
      ) as blessed.Widgets.BoxElement[];
      if (!records.length) return;
      currentRecord = Math.max(currentRecord - 1, 0);
      const record: blessed.Widgets.BoxElement = records[currentRecord];
      if (appInstance.screen.focused !== record) {
        records[currentRecord].focus();
      }
    },
  },
  {
    keys: ["h", "escape"],
    condition: () => appInstance.screen.focused?._isRecord,
    action: () => {
      ui.panels.workspace!.focus();
      appInstance.screen.render();
    },
  },
  // vim-style jump to first/last record — the only reliable way back to a
  // known scroll position, since nothing else auto-scrolls the workspace
  // into view as focus moves between record boxes (see CLAUDE.md's
  // "Known neo-blessed gotchas").
  {
    keys: ["g"],
    condition: () =>
      appInstance.screen.focused === ui.panels.workspace ||
      appInstance.screen.focused?._isRecord,
    action: () => {
      const workspace = ui.panels.workspace!;
      const records = workspace.children.filter(
        (c: any) => c._isRecord,
      ) as blessed.Widgets.BoxElement[];
      workspace.scrollTo(0);
      if (records.length) {
        currentRecord = 0;
        records[0].focus();
      } else {
        workspace.focus();
      }
      appInstance.screen.render();
    },
  },
  {
    keys: ["S-g"],
    condition: () =>
      appInstance.screen.focused === ui.panels.workspace ||
      appInstance.screen.focused?._isRecord,
    action: () => {
      const workspace = ui.panels.workspace!;
      const records = workspace.children.filter(
        (c: any) => c._isRecord,
      ) as blessed.Widgets.BoxElement[];
      workspace.scrollTo(workspace.getScrollHeight());
      if (records.length) {
        currentRecord = records.length - 1;
        records[currentRecord].focus();
      } else {
        workspace.focus();
      }
      appInstance.screen.render();
    },
  },

  // ── global ────────────────────────────────────────
  {
    keys: ["?"],
    action: () => {
      toggleHelp();
    },
  },
  {
    keys: [":"],
    action: () => {
      toggleShell();
    },
  },
];

export const keybindings = (ui: any) => {
  const keyMap = new Map();
  getBindings(ui).forEach(({ keys, condition, action }) => {
    const keyStr = keys.join(",");
    if (!keyMap.has(keyStr)) keyMap.set(keyStr, []);
    keyMap.get(keyStr).push({ condition, action });
  });
  keyMap.forEach((handlers, keyStr) => {
    const keys = keyStr.split(",");
    appInstance.screen.key(keys, () => {
      for (const { condition, action } of handlers) {
        if (condition && !condition()) continue;
        action();
        return;
      }
    });
  });
};
