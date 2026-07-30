import { THelpSections, TKeybind } from "./keybindbar.interface";

export const keybindbarConfig: TKeybind = {
  tree: [
    {
      key: "l",
      description: "workspace",
    },
    {
      key: "ctrl+e",
      description: "new connection/database/collection",
    },
    {
      key: "e",
      description: "edit connection",
    },
    {
      key: "Shift+c",
      description: "pick connection color",
    },
    {
      key: "d",
      description: "delete/drop selected",
    },
    {
      key: "c",
      description: "cycle connection color",
    },
    {
      key: "x",
      description: "export connection(s)",
    },
    {
      key: "i",
      description: "import connections",
    },
    {
      key: "j k",
      description: "navigate",
    },
    {
      key: "enter",
      description: "expand/collapse",
    },
  ],
  workspace: [
    {
      key: "h",
      description: "tree",
    },
    {
      key: "k",
      description: "query",
    },
    {
      key: "l",
      description: "record",
    },
    {
      key: "Shift+l",
      description: "next page",
    },

    {
      key: "Shift+h",

      description: "previous page",
    },
    {
      key: "ctrl+n",
      description: "insert record",
    },
    {
      key: "s",
      description: "sort",
    },
    {
      key: "Shift+s",
      description: "page size",
    },
    {
      key: "Shift+d",
      description: "bulk delete (matches filter)",
    },
    {
      key: "g",
      description: "first record",
    },
    {
      key: "Shift+g",
      description: "last record",
    },
    {
      key: "i",
      description: "indexes",
    },
    {
      key: "Shift+i",
      description: "collection stats",
    },
    {
      key: "v",
      description: "toggle tree/table view",
    },
    {
      key: "a",
      description: "schema analysis",
    },
  ],
  record: [
    {
      key: "h",
      description: "workspace",
    },
    {
      key: "j k",
      description: "navigate",
    },
    {
      key: "g",
      description: "first record",
    },
    {
      key: "Shift+g",
      description: "last record",
    },
    {
      key: "e",
      description: "edit",
    },
    {
      key: "d",
      description: "delete",
    },
    {
      key: "y",
      description: "duplicate",
    },
    {
      key: "c",
      description: "copy",
    },
    {
      key: "ctrl+n",
      description: "insert record",
    },
    {
      key: "v",
      description: "toggle tree/table view",
    },
  ],
  query: [
    {
      key: "esc",
      description: "workspace",
    },
  ],
  grid: [
    { key: "j/k", description: "navigate rows" },
    { key: "g / Shift+g", description: "first/last row" },
    { key: "enter / e", description: "edit row" },
    { key: "d", description: "delete row" },
    { key: "y", description: "duplicate row" },
    { key: "c", description: "copy row" },
    { key: "ctrl+n", description: "insert record" },
    { key: "v", description: "toggle tree/table view" },
    { key: "h / esc", description: "workspace" },
  ],
};

/*
|--------------------------------------------------------------------------
| HELP-ONLY SECTIONS
|--------------------------------------------------------------------------
| Not tied to a specific panel focus, so they don't belong in the bottom
| keybindbar, but they do belong in the full "?" help popup. Keeping them
| here means keybindbar.config.ts stays the single source of truth for
| every keybind shown anywhere in the app — see help.panel.ts.
*/
export const helpOnlyConfig: THelpSections = {
  colorPicker: [
    { key: "↑/k", description: "up" },
    { key: "↓/j", description: "down" },
    { key: "←/h", description: "left" },
    { key: "→/l", description: "right" },
    { key: "enter", description: "select" },
    { key: "esc", description: "cancel" },
  ],
  editor: [
    { key: "enter", description: "edit field value" },
    { key: "←/→", description: "change field dataType" },
    { key: "a", description: "add field" },
    { key: "d", description: "remove field" },
    { key: "C-s", description: "save" },
    { key: "esc", description: "cancel" },
  ],
  indexes: [
    { key: "j/k", description: "navigate" },
    { key: "c", description: "create index" },
    { key: "d", description: "drop index" },
    { key: "esc", description: "close" },
  ],
  collectionStats: [
    { key: "esc", description: "close" },
  ],
  schemaAnalysis: [
    { key: "j/k", description: "navigate" },
    { key: "r", description: "resample" },
    { key: "c", description: "change sample size" },
    { key: "esc", description: "close" },
  ],
  autocomplete: [
    { key: "$...", description: "typing $ starts operator suggestions (query/shell boxes)" },
    { key: "up/down", description: "navigate suggestions" },
    { key: "tab / enter", description: "accept suggestion" },
    { key: "esc", description: "dismiss suggestions" },
  ],
  global: [
    { key: "?", description: "toggle help" },
    { key: ":", description: "open query shell" },
    { key: "b", description: "open query builder" },
    { key: "q / C-c", description: "quit" },
    { key: "Shift+k", description: "focus keybindbar" },
    { key: "k (while keybindbar focused)", description: "return to previous panel" },
    { key: "h / l (while keybindbar focused)", description: "scroll keybindbar left/right" },
  ],
};
