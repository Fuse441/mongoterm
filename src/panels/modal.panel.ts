import blessed from "neo-blessed";
import { EVENTS } from "../services/enum.js";
import { onKeypress } from "../services/onKeypress.service.js";
import { appInstance } from "@/app.js";
import { logger } from "@/utils/logger/logger.service.js";
let editorInstance: any = null;
const VIEW_HEIGHT = 30;
let scrollTop = 0;
export function openEditor(doc: any) {
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

  const DEFAULT_HINT =
    " {grey-fg}esc{/grey-fg} close   {grey-fg}C-s{/grey-fg} save ";

  const hint = blessed.box({
    bottom: 0,
    left: "center",
    width: "70%",
    height: 1,
    tags: true,
    content: DEFAULT_HINT,
  });

  function render() {
    if (cursor.row < scrollTop) scrollTop = cursor.row;

    if (cursor.row >= scrollTop + VIEW_HEIGHT)
      scrollTop = cursor.row - VIEW_HEIGHT + 1;

    const visible = lines
      .slice(scrollTop, scrollTop + VIEW_HEIGHT)
      .map((line, i) => {
        const realRow = i + scrollTop;

        if (realRow !== cursor.row) return line;

        const left = line.slice(0, cursor.col);
        const cur = line[cursor.col] ?? " ";
        const right = line.slice(cursor.col + 1);

        return `${left}|${cur}${right}`;
      });

    box.setContent(visible.join("\n"));
    appInstance.renderScreen();
  }

  // save
  function onSave() {
    const content = lines.join("\n");

    try {
      JSON.parse(content);
    } catch (error: any) {
      hasError = true;
      hint.setContent(
        ` {red-fg}invalid JSON — fix before saving: ${error.message}{/red-fg} `,
      );
      appInstance.renderScreen();
      return;
    }

    const query = appInstance.ui.panels.query!.getContent();
    appInstance.eventBus.emit(EVENTS.RECORD_UPDATE, {
      updated: content,
      query,
    });

    closeEditor();
  }

  box.key(["C-s"], onSave);
  let pending = false;
  let hasError = false;

  function scheduleRender() {
    if (hasError) {
      hasError = false;
      hint.setContent(DEFAULT_HINT);
    }

    if (pending) return;

    pending = true;

    setImmediate(() => {
      pending = false;
      render();
    });
  }
  render();
  const handler = (ch: any, key: any) =>
    onKeypress(ch, key, lines, cursor, scheduleRender);

  box.on("focus", () => {
    appInstance.screen.on("keypress", handler);
  });

  box.on("blur", () => {
    appInstance.screen.off("keypress", handler);
  });
  appInstance.appendToScreen(overlay);
  appInstance.appendToScreen(hint);
  appInstance.appendToScreen(box);

  editorInstance = { overlay, box, hint };

  box.focus();
  appInstance.renderScreen();
}
export function closeEditor() {
  logger.debug({ message: "Closing editor" });
  if (!editorInstance) return;
  logger.debug({ message: "No editor instance to close" });
  const { overlay, box, hint } = editorInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(box);
  appInstance.removeScreenElement(hint);
  editorInstance = null;
  appInstance.renderScreen();
}
let confirmInstance: any = null;
export function openDialogConfirm(message: any, onConfirm: any) {
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
    width: 50,
    height: 10,
    label: " Confirm ",
    border: "line",
    keys: true,
    mouse: true,
    style: {
      border: { fg: "cyan" },
    },
  });

  const msgText = blessed.text({
    parent: box,
    top: 1,
    left: "center",
    content: message,
    style: { fg: "white" },
  });

  const btnConfirm = blessed.button({
    parent: box,
    bottom: 1,
    left: "25%-4",
    width: 12,
    height: 3,
    content: "  Yes  ",
    border: "line",
    mouse: true,
    keys: true,
    style: {
      border: { fg: "green" },
      focus: { border: { fg: "white" }, bg: "green" },
      hover: { bg: "green" },
    },
  });
  btnConfirm.focus();
  const btnCancel = blessed.button({
    parent: box,
    bottom: 1,
    left: "65%-4",
    width: 12,
    height: 3,
    content: "  No  ",
    border: "line",
    mouse: true,
    keys: true,
    style: {
      border: { fg: "green" },
      focus: { border: { fg: "white" }, bg: "green" },
      hover: { bg: "green" },
    },
  });
  // keyboard tab เพื่อสลับปุ่ม
  btnConfirm.key(["tab"], () => btnCancel.focus());
  btnCancel.key(["tab"], () => btnConfirm.focus());

  btnConfirm.key(["enter"], () => {
    closeDialogConfirm();
    onConfirm?.();
  });
  btnCancel.key(["enter"], () => closeDialogConfirm());

  // btnConfirm.on("press", () => {
  //   closeDialogConfirm();
  //   onConfirm?.();
  // });
  btnCancel.on("press", () => closeDialogConfirm());

  box.key(["escape"], () => closeDialogConfirm());
  appInstance.appendToScreen(overlay);
  appInstance.appendToScreen(box);
  confirmInstance = { overlay, box };

  btnConfirm.focus();
  appInstance.renderScreen();
}

export function closeDialogConfirm() {
  if (!confirmInstance) return;
  const { overlay, box } = confirmInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(box);
  confirmInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
