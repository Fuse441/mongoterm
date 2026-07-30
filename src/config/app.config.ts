export const theme = {
  border: {
    focus: "#03fc52",
    blur: "gray",
  },
  header: {
    focusBg: "#1e1e1e",
    blurBg: "black",
  },
  // The single selected-row/item style shared by every `blessed.listtable`
  // (`style.cell.selected`) and `blessed.list` (`style.selected`) in the
  // app — kept here instead of a literal in each file so they can't drift
  // apart. Not applied to `connection.panel.ts`/`dropdown/dropdown.panel.ts`
  // — dead code, never appended to the screen by main.layout.ts.
  selection: {
    bg: "green",
    fg: "black",
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
