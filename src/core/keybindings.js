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

  {
    keys: ["l", "right"],
    condition: () => screen.focused === ui.childConnection.connectionDD.header,
    action: () => ui.workspace.focus(),
  },

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

  {
    keys: ["j", "down"],
    condition: () => screen.focused?._isRecord,
    action: () => {
      const records = ui.workspace.children.filter((c) => c._isRecord);
      if (!records.length) return;
      currentRecord = Math.min(currentRecord + 1, records.length - 1);
      records[currentRecord].focus();
      screen.debug(`record: ${currentRecord + 1}/${records.length}`);
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
      screen.debug(`record: ${currentRecord + 1}/${records.length}`);
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
];
export const keybindings = (ui) => {
  getBindings(ui).forEach(({ keys, condition, action }) => {
    screen.key(keys, () => {
      if (condition && !condition()) return;
      action();
    });
  });
};
