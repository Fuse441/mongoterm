import { screen } from "../core/screen.js";

import { closeEditor } from "../panels/modal.panel.js";

export function onKeypress(ch, key, lines, cursor, render) {
  if (!key) return;
  const line = lines[cursor.row] ?? "";

  switch (key.name) {
    case "left":
      if (cursor.col > 0) cursor.col--;
      else if (cursor.row > 0) {
        cursor.row--;
        cursor.col = lines[cursor.row].length;
      }
      break;
    case "right":
      if (cursor.col < line.length) cursor.col++;
      else if (cursor.row < lines.length - 1) {
        cursor.row++;
        cursor.col = 0;
      }
      break;
    case "up":
      if (cursor.row > 0) {
        cursor.row--;
        cursor.col = Math.min(cursor.col, lines[cursor.row].length);
      }
      break;
    case "down":
      if (cursor.row < lines.length - 1) {
        cursor.row++;
        cursor.col = Math.min(cursor.col, lines[cursor.row].length);
      }
      break;
    case "home":
      cursor.col = 0;
      break;
    case "end":
      cursor.col = line.length;
      break;
    case "backspace":
      if (cursor.col > 0) {
        lines[cursor.row] =
          line.slice(0, cursor.col - 1) + line.slice(cursor.col);
        cursor.col--;
      } else if (cursor.row > 0) {
        const prev = lines[cursor.row - 1];
        lines.splice(cursor.row, 1);
        cursor.row--;
        cursor.col = lines[cursor.row].length;
        lines[cursor.row] = prev + line;
      }
      break;
    case "delete":
      if (cursor.col < line.length) {
        lines[cursor.row] =
          line.slice(0, cursor.col) + line.slice(cursor.col + 1);
      } else if (cursor.row < lines.length - 1) {
        lines[cursor.row] = line + lines[cursor.row + 1];
        lines.splice(cursor.row + 1, 1);
      }
      break;
    case "return":
    case "enter": {
      const before = line.slice(0, cursor.col);
      const after = line.slice(cursor.col);
      lines[cursor.row] = before;
      lines.splice(cursor.row + 1, 0, after);
      cursor.row++;
      cursor.col = 0;
      break;
    }
    case "escape":
      closeEditor();
      return;
    default:
      if (ch && !key.ctrl && !key.meta) {
        lines[cursor.row] =
          line.slice(0, cursor.col) + ch + line.slice(cursor.col);
        cursor.col++;
      }
      break;
  }
  render();
}
