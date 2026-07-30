export const theme = {
  border: {
    focus: "#03fc52",
    blur: "gray",
  },
  header: {
    focusBg: "#1e1e1e",
    blurBg: "black",
  },
  // Every `blessed.listtable` overlay (record editor, query builder,
  // indexes, schema analysis, grid view) shares this same selected-row
  // style — kept here instead of a literal in each file so they can't
  // drift apart. Only for `blessed.listtable`'s `cell.selected`; plain
  // `blessed.list` widgets (tree, history, command palette, autocomplete)
  // aren't included in this convention.
  listtable: {
    selectedBg: "green",
    selectedFg: "black",
  },
};
export const connectionColors = [
  "white",
  "cyan",
  "green",
  "yellow",
  "magenta",
  "red",
  "blue",
];
export const defaultConfig = {
  type: "Compass Connections",
  version: {
    $numberInt: "1",
  },
  connections: [],
};
