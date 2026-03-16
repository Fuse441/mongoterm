import _blessed from "neo-blessed";
const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);
import { theme } from "../config/app.config.js";
import { screen, ui } from "../core/screen.js";
import { eventBus } from "../core/eventBus.js";
import { EVENTS } from "../services/enum.js";
import { onKeypress } from "../services/onKeypress.service.js";
let editorInstance = null;

const recordEditor = (doc) => {
  // overlay backdrop
  const overlay = blessed.box({
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    style: { bg: "black", transparent: true },
    opacity: 0.5,
  });

  // editor box
  const box = blessed.textarea({
    top: "center",
    left: "center",
    width: "70%",
    height: "60%",
    label: " Edit Record ",
    border: "line",
    inputOnFocus: true,
    vi: false,
    keys: true,
    mouse: true,
    scrollable: true,
    tags: false,
    style: {
      border: { fg: theme.border.focus },
      focus: { border: { fg: "cyan" } },
    },
    content: JSON.stringify(doc, null, 2),
  });

  // hint bar
  const hint = blessed.box({
    bottom: 10,
    left: 138,
    width: "12%",
    height: 1,
    tags: true,
    content: " {grey-fg}esc{/grey-fg} close  {grey-fg}C-s{/grey-fg} save ",
  });

  return { overlay, box, hint };
};

export function openEditor(doc) {
  if (editorInstance) closeEditor();

  let lines = JSON.stringify(doc, null, 2).split("\n");
  const cursor = { row: 0, col: 0 };

  const overlay = blessed.box({
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    style: { bg: "black", transparent: true },
  });

  const box = blessed.box({
    top: "center",
    left: "center",
    width: "70%",
    height: "60%",
    label: " Edit Record ",
    border: "line",
    keys: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: "▐" },
    style: {
      border: { fg: "cyan" },
      scrollbar: { fg: "blue" },
    },
  });

  const hint = blessed.box({
    bottom: 0,
    left: "center",
    width: "70%",
    height: 1,
    tags: true,
    content: " {grey-fg}esc{/grey-fg} close   {grey-fg}C-s{/grey-fg} save ",
  });

  function render() {
    const rendered = lines.map((line, i) => {
      if (i !== cursor.row) return line;
      const left = line.slice(0, cursor.col);
      const cur = line[cursor.col] ?? " ";
      const right = line.slice(cursor.col + 1);
      return `${left}|${cur}${right}`;
    });
    box.tags = true;
    box.setContent(rendered.join("\n"));
    // auto scroll ตาม cursor
    box.scrollTo(cursor.row);
    screen.render();
  }

  // save
  function onSave() {
    try {
      const query = ui.query.getContent();
      eventBus.emit(EVENTS.RECORD_UPDATE, { updated: lines.join("\n"), query });

      closeEditor();
    } catch {
      hint.setContent(" {red-fg}invalid JSON — fix before saving{/red-fg} ");
      screen.render();
    }
  }

  box.key(["C-s"], onSave);

  box.on("focus", () => {
    screen.program.on("keypress", (ch, key) =>
      onKeypress(ch, key, lines, cursor, render),
    );
    render();
  });

  box.on("blur", () => {
    screen.program.off("keypress", onKeypress);
  });

  screen.append(overlay);
  screen.append(hint);
  screen.append(box);

  editorInstance = { overlay, box, hint };

  box.focus();
  screen.render();
}
export function closeEditor() {
  if (!editorInstance) return;
  const { overlay, box, hint } = editorInstance;
  screen.remove(overlay);
  screen.remove(box);
  screen.remove(hint);
  editorInstance = null;
  screen.render();
}
