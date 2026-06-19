import { toggleHelp } from "@/panels/help.panel";
import { logger } from "@/utils/logger/logger.service";
import { state } from "@/shared/state";
import { appInstance } from "@/app.js";
import { TResponseLayout } from "@/layout/main.layout.types";
let currentRecord = 0;
import blessed from "neo-blessed";
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
    condition: () =>
      appInstance.screen.focused === ui.dropdowns.connectionDD!.header,
    action: () => {
      logger.debug({ message: "Focusing workspace from connection header" });
      ui.panels.workspace!.focus();
      appInstance.renderWorkspacePanel();
    },
  },

  // ── workspace ─────────────────────────────────────
  {
    keys: ["h", "left"],
    condition: () => appInstance.screen.focused === ui.panels.workspace,
    action: () => ui.dropdowns.connectionDD!.header.focus(),
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

  // ── query ─────────────────────────────────────────
  {
    keys: ["j", "down", "escape"],
    condition: () => appInstance.screen.focused === ui.panels.query,
    action: () => ui.panels.workspace!.focus(),
  },
  {
    keys: ["h", "left"],
    condition: () => appInstance.screen.focused === ui.panels.query,
    action: () => ui.dropdowns.connectionDD!.header.focus(),
  },

  // ── record ────────────────────────────────────────
  {
    keys: ["j", "down"],
    condition: () => appInstance.screen.focused?._isRecord,
    action: () => {
      const records: blessed.Widgets.BoxOptions[] =
        ui.panels.workspace!.children.filter((c: any) => c._isRecord);
      if (!records.length) return;
      currentRecord = Math.min(currentRecord + 1, records.length - 1);
      records[currentRecord].focus();
      appInstance.screen.render();
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

  // ── global ────────────────────────────────────────
  {
    keys: ["?"],
    action: () => {
      toggleHelp();
    },
  },
  {
    keys: ["j", "k,", "h", "l"],
    action: () => {
      // logger.debug(
      //   `Key pressed: ${screen._lastKey}, focused element: ${screen.focused?.type}`,
      // );
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
        return; // ← ทำแค่ตัวแรกที่ condition pass
      }
    });
  });
};
