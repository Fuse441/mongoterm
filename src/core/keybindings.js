import { toggleHelp } from "../panels/help.panel.js";
import { screen } from "./screen.js";
import { state } from "./state.js";
let currentRecord = 0;
// ── config: key → action ──────────────────────────────
const getBindings = (ui) => [
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
    condition: () => screen.focused === ui.childConnection.connectionDD.header,
    action: () => ui.workspace.focus(),
  },

  // ── workspace ─────────────────────────────────────
  {
    keys: ["h", "left"],
    condition: () => screen.focused === ui.workspace,
    action: () => ui.childConnection.connectionDD.header.focus(),
  },
  {
    keys: ["k", "up"],
    condition: () => screen.focused === ui.workspace,
    action: () => ui.query.focus(),
  },
  {
    keys: ["l", "right"],
    condition: () => screen.focused === ui.workspace,
    action: () => {
      const records = ui.workspace.children.filter((c) => c._isRecord);
      if (!records.length) return;
      currentRecord = 0;
      records[0].focus();
      screen.render();
    },
  },

  // ── query ─────────────────────────────────────────
  {
    keys: ["j", "down", "escape"],
    condition: () => screen.focused === ui.query,
    action: () => ui.workspace.focus(),
  },
  {
    keys: ["h", "left"],
    condition: () => screen.focused === ui.query,
    action: () => ui.childConnection.connectionDD.header.focus(),
  },

  // ── record ────────────────────────────────────────
  {
    keys: ["j", "down"],
    condition: () => screen.focused?._isRecord,
    action: () => {
      const records = ui.workspace.children.filter((c) => c._isRecord);
      if (!records.length) return;
      currentRecord = Math.min(currentRecord + 1, records.length - 1);
      records[currentRecord].focus();
      screen.render();
    },
  },
  {
    keys: ["k", "up"],
    condition: () => screen.focused?._isRecord,
    action: () => {
      const records = ui.workspace.children.filter((c) => c._isRecord);
      if (!records.length) return;
      currentRecord = Math.max(currentRecord - 1, 0);
      records[currentRecord].focus();
      screen.render();
    },
  },
  {
    keys: ["h", "escape"],
    condition: () => screen.focused?._isRecord,
    action: () => {
      ui.workspace.focus();
      screen.render();
    },
  },

  // ── global ────────────────────────────────────────
  {
    keys: ["?"],
    action: () => {
      toggleHelp();
    },
  },
];

export const keybindings = (ui) => {
  // group keys เดียวกันไว้ด้วยกัน → register ครั้งเดียว
  const keyMap = new Map();

  getBindings(ui).forEach(({ keys, condition, action }) => {
    const keyStr = keys.join(",");
    if (!keyMap.has(keyStr)) keyMap.set(keyStr, []);
    keyMap.get(keyStr).push({ condition, action });
  });

  keyMap.forEach((handlers, keyStr) => {
    const keys = keyStr.split(",");
    screen.key(keys, () => {
      for (const { condition, action } of handlers) {
        if (condition && !condition()) continue;
        action();
        return; // ← ทำแค่ตัวแรกที่ condition pass
      }
    });
  });
};
