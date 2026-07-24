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
      key: "d",
      description: "delete/drop selected",
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
      key: "g",
      description: "first record",
    },
    {
      key: "Shift+g",
      description: "last record",
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
  ],
  query: [
    {
      key: "esc",
      description: "workspace",
    },
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
  editor: [
    { key: "enter", description: "edit field value" },
    { key: "←/→", description: "change field dataType" },
    { key: "a", description: "add field" },
    { key: "d", description: "remove field" },
    { key: "C-s", description: "save" },
    { key: "esc", description: "cancel" },
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
    { key: "q / C-c", description: "quit" },
  ],
};
