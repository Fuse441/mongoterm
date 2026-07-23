import blessed from "neo-blessed";
import { ObjectId } from "mongodb";
import { EVENTS } from "../services/enum.js";
import { appInstance } from "@/app.js";
import { logger } from "@/utils/logger/logger.service.js";
import { installCursorSupport } from "@/services/cursorInput.service.js";

/*
|--------------------------------------------------------------------------
| RECORD FIELD EDITOR (table style)
|--------------------------------------------------------------------------
| Replaces the old free-text JSON cursor editor with a table of
| field / value / dataType rows. Left/Right arrows cycle the dataType of
| the selected row, Enter edits the value, "a" adds a field (insert mode
| friendly) and "d" removes a field. C-s saves, esc cancels.
*/

type FieldType =
  | "String"
  | "Number"
  | "Boolean"
  | "Date"
  | "ObjectId"
  | "Null"
  | "Array"
  | "Object";

const TYPE_CYCLE: FieldType[] = [
  "String",
  "Number",
  "Boolean",
  "Date",
  "ObjectId",
  "Null",
  "Array",
  "Object",
];

interface EditableField {
  key: string;
  value: any;
  type: FieldType;
}

function inferType(value: any): FieldType {
  if (value === null || value === undefined) return "Null";
  if (value instanceof ObjectId || value?._bsontype === "ObjectID")
    return "ObjectId";
  if (value instanceof Date) return "Date";
  if (Array.isArray(value)) return "Array";
  if (typeof value === "number") return "Number";
  if (typeof value === "boolean") return "Boolean";
  if (typeof value === "object") return "Object";
  return "String";
}

function displayValue(value: any, type: FieldType): string {
  switch (type) {
    case "Null":
      return "null";
    case "ObjectId":
      return value?.toString?.() ?? "";
    case "Date":
      return value instanceof Date ? value.toISOString() : String(value ?? "");
    case "Array":
    case "Object":
      try {
        return JSON.stringify(value ?? (type === "Array" ? [] : {}));
      } catch {
        return type === "Array" ? "[]" : "{}";
      }
    case "Boolean":
      return String(Boolean(value));
    case "Number":
      return String(Number.isFinite(value) ? value : (value ?? 0));
    default:
      return value === undefined ? "" : String(value);
  }
}

function convertValue(raw: string, type: FieldType): any {
  switch (type) {
    case "Null":
      return null;
    case "ObjectId":
      return ObjectId.isValid(raw) ? new ObjectId(raw) : new ObjectId();
    case "Date": {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    case "Number": {
      const n = Number(raw);
      return Number.isNaN(n) ? 0 : n;
    }
    case "Boolean":
      return raw === "true" || raw === "1";
    case "Array":
      try {
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    case "Object":
      try {
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    default:
      return raw;
  }
}

function coerceValue(field: EditableField, nextType: FieldType) {
  const raw = displayValue(field.value, field.type);
  field.value = convertValue(raw, nextType);
  field.type = nextType;
}

let editorInstance: any = null;

function truncate(text: string, max = 46): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
function buildRows(fields: EditableField[]): string[][] {
  const rows = [["Field", "Value", "Type"]];
  fields.forEach((f) => {
    rows.push([
      f.key,
      truncate(displayValue(f.value, f.type)),
      `◀ ${f.type} ▶`,
    ]);
  });
  logger.debug({ message: "Built rows for editor table", rows });
  return rows;
}

export function promptInline(
  label: string,
  initialValue: string,
  onSubmit: (value: string | null) => void,
) {
  const promptBox = blessed.box({
    top: "center",
    left: "center",
    width: 60,
    height: 4,
    label: ` ${label} `,
    border: "line",
    tags: true,
    style: { border: { fg: "yellow" } },
  });

  const input = blessed.textbox({
    parent: promptBox,
    top: 1,
    left: 1,
    width: "100%-4",
    height: 1,
    value: initialValue,
    style: { fg: "white" },
  });

  installCursorSupport(input);

  appInstance.appendToScreen(promptBox);
  input.focus();
  appInstance.renderScreen();

  input.key(["escape"], () => {
    appInstance.removeScreenElement(promptBox);
    appInstance.renderScreen();
    onSubmit(null);
  });

  input.readInput((err: any, value: any) => {
    appInstance.removeScreenElement(promptBox);
    appInstance.renderScreen();
    onSubmit(err ? null : (value ?? ""));
  });
}

export function openEditor(doc: any, options: { isInsert?: boolean } = {}) {
  if (editorInstance) closeEditor();

  const isInsert = Boolean(options.isInsert);

  const fields: EditableField[] = Object.entries(doc ?? {}).map(
    ([key, value]) => ({ key, value, type: inferType(value) }),
  );

  if (isInsert && !fields.some((f) => f.key === "_id")) {
    fields.unshift({ key: "_id", value: new ObjectId(), type: "ObjectId" });
  }

  const overlay = blessed.box({
    top: 0,
    parent: appInstance.screen,
    left: 0,
    width: "100%",
    height: "100%",
    style: { bg: "black", transparent: true },
  });

  const table = blessed.listtable({
    top: "center",
    parent: overlay,
    left: "center",
    width: "70%",
    height: "60%",
    label: isInsert ? " Insert Record " : " Edit Record ",
    border: "line",
    align: "left",
    keys: true,
    mouse: true,
    tags: true,
    interactive: true,
    style: {
      border: { fg: "cyan" },
      header: { bold: true, fg: "yellow" },
      cell: {
        selected: { bg: "blue", fg: "white" },
      },
    },
  });

  const DEFAULT_HINT =
    " {grey-fg}esc{/grey-fg} cancel   {grey-fg}enter{/grey-fg} edit value   {grey-fg}←/→{/grey-fg} change type   {grey-fg}a{/grey-fg} add field   {grey-fg}d{/grey-fg} remove field   {grey-fg}C-s{/grey-fg} save ";

  const hint = blessed.box({
    bottom: 0,
    parent: overlay,
    left: "center",
    width: "70%",
    height: 1,
    tags: true,
    content: DEFAULT_HINT,
  });

  function setError(message: string) {
    hint.setContent(` {red-fg}${message}{/red-fg} `);
    appInstance.renderScreen();
  }

  function resetHint() {
    hint.setContent(DEFAULT_HINT);
  }

  function refresh(selectIndex?: number) {
    const rows = buildRows(fields);
    logger.debug({ message: "Refreshing editor table", rows });
    table.setData(rows);
    if (selectIndex !== undefined) {
      table.select(selectIndex + 1);
    }
    appInstance.renderScreen();
  }
  function selectedFieldIndex(): number {
    return ((table as any).selected ?? 1) - 1;
  }

  function cycleType(direction: 1 | -1) {
    const idx = selectedFieldIndex();
    const field = fields[idx];
    if (!field) return;

    const pos = TYPE_CYCLE.indexOf(field.type);
    const nextPos = (pos + direction + TYPE_CYCLE.length) % TYPE_CYCLE.length;

    coerceValue(field, TYPE_CYCLE[nextPos]);
    resetHint();
    refresh(idx);
  }

  function editValue() {
    const idx = selectedFieldIndex();
    const field = fields[idx];
    if (!field) return;

    promptInline(
      `Edit value: ${field.key} (${field.type})`,
      displayValue(field.value, field.type),
      (value) => {
        if (value === null) {
          refresh(idx);
          return;
        }
        try {
          field.value = convertValue(value, field.type);
          resetHint();
        } catch (error: any) {
          setError(`Invalid value: ${error.message}`);
        }
        refresh(idx);
        table.focus();
      },
    );
  }

  function addField() {
    promptInline("New field name", "", (name) => {
      if (!name || !name.trim()) {
        refresh();
        table.focus();
        return;
      }
      if (fields.some((f) => f.key === name)) {
        setError(`Field "${name}" already exists`);
        refresh();
        table.focus();
        return;
      }
      fields.push({ key: name.trim(), value: "", type: "String" });
      resetHint();
      refresh(fields.length - 1);
      table.focus();
    });
  }

  function removeField() {
    const idx = selectedFieldIndex();
    const field = fields[idx];
    if (!field) return;

    if (field.key === "_id") {
      setError("Cannot remove the _id field");
      return;
    }

    fields.splice(idx, 1);
    resetHint();
    refresh(Math.max(0, idx - 1));
  }

  function onSave() {
    const document: Record<string, any> = {};
    for (const field of fields) {
      document[field.key] = field.value;
    }

    const query = appInstance.ui.panels.query!.getContent();

    if (isInsert) {
      appInstance.eventBus.emit(EVENTS.RECORD_INSERT, {
        doc: document,
        query,
      });
    } else {
      appInstance.eventBus.emit(EVENTS.RECORD_UPDATE, {
        updated: document,
        query,
      });
    }

    closeEditor();
  }

  table.key(["escape"], () => closeEditor());
  table.key(["j"], () => table.down(1));
  table.key(["k"], () => table.up(1));
  table.key(["left"], () => cycleType(-1));
  table.key(["right"], () => cycleType(1));
  table.key(["enter"], () => editValue());
  table.key(["a"], () => addField());
  table.key(["d"], () => removeField());
  table.key(["C-s"], () => onSave());

  // ✅ ย้ายไป append ก่อน refresh
  appInstance.appendToScreen(overlay);
  // appInstance.appendToScreen(hint);
  // appInstance.appendToScreen(table);

  editorInstance = { overlay, box: table, hint };

  // ✅ เรียก refresh หลังจาก table ถูก append เสร็จแล้ว
  refresh(0);

  table.focus();
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
  appInstance.ui.panels.workspace?.focus();
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
