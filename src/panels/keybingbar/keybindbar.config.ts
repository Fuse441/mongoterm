import { TKeybind } from "./keybindbar.interface";

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
  ],
  query: [
    {
      key: "esc",
      description: "workspace",
    },
  ],
};
