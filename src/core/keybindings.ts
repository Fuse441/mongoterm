import { toggleHelp } from "@/panels/help.panel";
import { toggleShell } from "@/panels/shell.panel";
import { toggleQueryBuilder } from "@/panels/queryBuilder.panel";
import { logger } from "@/utils/logger/logger.service";
import { state } from "@/shared/state";
import { appInstance } from "@/app.js";
import { TResponseLayout } from "@/layout/main.layout.types";
let currentRecord = 0;
import blessed from "neo-blessed";
import { EVENTS } from "@/services/enum";
let previousFocusedPanel: blessed.Widgets.BlessedElement | null = null;

const KEYBINDBAR_BASE_LABEL = " keybindbar ";

// Maps a focused widget back to the short name shown in the keybindbar's
// own "[k→...]" hint — covers the named ui.panels plus the two dynamic,
// flagged workspace children (tree-view record boxes, grid-view table;
// see result.panel.ts) that aren't in ui.panels themselves.
function panelDisplayName(ui: TResponseLayout, panel: any): string {
  if (panel === ui.panels.tree) return "connection";
  if (panel === ui.panels.workspace) return "workspace";
  if (panel === ui.panels.query) return "query";
  if (panel?._isRecord) return "record";
  if (panel?._isGridTable) return "table";
  return "previous panel";
}

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
  {
    keys: ["S-k"],
    condition: () => true,
    action: () => {
      previousFocusedPanel = appInstance.screen.focused;
      logger.debug({
        message:
          "previousFocusedPanel ==>" + previousFocusedPanel.options?.label,
      });
      appInstance.ui.panels.keybindbar!.setLabel(
        ` keybindbar  {grey-fg}[k→${panelDisplayName(ui, previousFocusedPanel)}]{/grey-fg} `,
      );
      appInstance.ui.panels.keybindbar!.focus();
      appInstance.screen.render();
      logger.debug({ message: "Focusing keybindbar" });
    },
  },
  {
    keys: ["k", "top"],
    condition: () => appInstance.screen.focused === ui.panels.keybindbar,
    action: () => {
      if (previousFocusedPanel) {
        previousFocusedPanel.focus();
        previousFocusedPanel = null;
        appInstance.ui.panels.keybindbar!.setLabel(KEYBINDBAR_BASE_LABEL);
      }

      appInstance.screen.render();
      logger.debug({ message: "Focusing keybindbar" });
    },
  },
  {
    keys: ["h", "left"],
    condition: () => appInstance.screen.focused === ui.panels.keybindbar,
    action: () => appInstance.scrollKeybindbar(-1),
  },
  {
    keys: ["l", "right"],
    condition: () => appInstance.screen.focused === ui.panels.keybindbar,
    action: () => appInstance.scrollKeybindbar(1),
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
      // Table (grid) view is a single focusable widget with its own
      // internal row navigation — focus it directly rather than the
      // per-record-box _isRecord flow below, which only applies to the
      // tree view.
      const grid: any = ui.panels.workspace!.children.find(
        (c: any) => c._isGridTable,
      );
      if (grid) {
        grid.focus();
        appInstance.screen.render();
        return;
      }

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
  {
    keys: ["b"],
    action: () => {
      toggleQueryBuilder();
    },
  },
];

export const keybindings = (ui: any) => {
  // Grouped by each individual key (not by the joined `keys` array) because
  // `screen.key(keys, cb)` treats every entry in `keys` as an independent
  // trigger. Grouping by the joined string let two unrelated bindings that
  // happen to share one literal key (e.g. ["k","top"] and ["k","up"]) end up
  // as two separate `screen.key` registrations both listening on the same
  // raw "key k" event — pressing "k" fired both in the same tick, and the
  // second handler's condition re-read `screen.focused` *after* the first
  // had already changed it, causing an unintended cascade (e.g. keybindbar
  // -> workspace -> query on a single "k" press). Keying by the individual
  // key name gives one ordered handler list per physical key, so only the
  // first matching condition's action runs.
  const keyMap = new Map<
    string,
    { condition?: () => boolean | undefined; action: () => void }[]
  >();
  getBindings(ui).forEach(({ keys, condition, action }) => {
    keys.forEach((key) => {
      if (!keyMap.has(key)) keyMap.set(key, []);
      keyMap.get(key)!.push({ condition, action });
    });
  });
  keyMap.forEach((handlers, key) => {
    appInstance.screen.key([key], () => {
      for (const { condition, action } of handlers) {
        if (condition && !condition()) continue;
        action();
        return;
      }
    });
  });
};
