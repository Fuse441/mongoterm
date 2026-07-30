import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { EVENTS } from "@/services/enum.js";
import { promptInline } from "@/panels/modal.panel.js";
import { QUERY_OPERATORS } from "@/services/query/queryOperators.js";

/*
|--------------------------------------------------------------------------
| QUERY BUILDER (row style — no raw JSON typing)
|--------------------------------------------------------------------------
| A table of field / operator / value rows, opened via the global "b" key
| (src/core/keybindings.ts). Mirrors the record editor's table pattern
| (modal.panel.ts's openEditor) for interaction conventions (j/k navigate,
| enter edits, left/right cycles, a/d add/remove, C-s applies), and the
| shell modal's submit behavior (shell.panel.ts) for how the compiled
| filter is mirrored into the query box and run via EVENTS.QUERY_SEND.
| Rows are always ANDed together, same as MongoDB's default behavior for
| multiple fields in one filter object.
*/

const BUILDER_OPERATORS = [
  "$eq",
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$nin",
  "$exists",
  "$regex",
  "$size",
  "$all",
];

interface BuilderRow {
  field: string;
  operator: string;
  value: string;
}

function operatorDescription(op: string): string {
  return QUERY_OPERATORS.find((o) => o.op === op)?.description ?? "";
}

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function coerceRowValue(raw: string): any {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function stringifyValue(value: any): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function buildFilter(rows: BuilderRow[]): Record<string, any> {
  const filter: Record<string, any> = {};
  for (const row of rows) {
    if (!row.field.trim()) continue;
    const existing = filter[row.field] ?? {};
    filter[row.field] = {
      ...existing,
      [row.operator]: coerceRowValue(row.value),
    };
  }
  return filter;
}

function parseExistingQuery(): BuilderRow[] {
  const raw = appInstance.ui.panels.query?.getContent() ?? "";
  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    const rows: BuilderRow[] = [];
    for (const [field, val] of Object.entries(parsed)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        for (const [op, opVal] of Object.entries(val as Record<string, any>)) {
          if (!BUILDER_OPERATORS.includes(op)) return [];
          rows.push({ field, operator: op, value: stringifyValue(opVal) });
        }
      } else {
        rows.push({ field, operator: "$eq", value: stringifyValue(val) });
      }
    }
    return rows;
  } catch {
    return [];
  }
}

let builderInstance: { overlay: any; table: any; hint: any } | null = null;

function buildRows(rows: BuilderRow[]): string[][] {
  const header = [["Field", "Operator", "Value"]];
  return header.concat(
    rows.map((r) => [r.field, `◀ ${r.operator} ▶`, truncate(r.value)]),
  );
}

export function toggleQueryBuilder() {
  if (builderInstance) {
    closeQueryBuilder();
    return;
  }

  const rows: BuilderRow[] = parseExistingQuery();

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
    label: " Query Builder ",
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
    " {grey-fg}esc{/grey-fg} cancel   {grey-fg}enter{/grey-fg} edit value   {grey-fg}←/→{/grey-fg} change operator   {grey-fg}a{/grey-fg} add field   {grey-fg}d{/grey-fg} remove field   {grey-fg}C-s{/grey-fg} apply ";

  const hint = blessed.box({
    bottom: 0,
    parent: overlay,
    left: "center",
    width: "70%",
    height: 1,
    tags: true,
    content: DEFAULT_HINT,
  });

  function setHint(message: string) {
    hint.setContent(` ${message} `);
  }

  function resetHint() {
    hint.setContent(DEFAULT_HINT);
  }

  function refresh(selectIndex?: number) {
    table.setData(buildRows(rows));
    if (selectIndex !== undefined) {
      table.select(selectIndex + 1);
    }
    appInstance.renderScreen();
  }

  function selectedIndex(): number {
    return ((table as any).selected ?? 1) - 1;
  }

  function cycleOperator(direction: 1 | -1) {
    const idx = selectedIndex();
    const row = rows[idx];
    if (!row) return;

    const pos = BUILDER_OPERATORS.indexOf(row.operator);
    const nextPos =
      (pos + direction + BUILDER_OPERATORS.length) % BUILDER_OPERATORS.length;
    row.operator = BUILDER_OPERATORS[nextPos];

    setHint(`{yellow-fg}${row.operator}{/yellow-fg} — ${operatorDescription(row.operator)}`);
    refresh(idx);
  }

  function editValue() {
    const idx = selectedIndex();
    const row = rows[idx];
    if (!row) return;

    promptInline(`Edit value: ${row.field} (${row.operator})`, row.value, (value) => {
      if (value !== null) {
        row.value = value;
        resetHint();
      }
      refresh(idx);
      table.focus();
    });
  }

  function addRow() {
    promptInline("Field name", "", (name) => {
      if (!name || !name.trim()) {
        refresh();
        table.focus();
        return;
      }
      rows.push({ field: name.trim(), operator: "$eq", value: "" });
      resetHint();
      refresh(rows.length - 1);
      table.focus();
    });
  }

  function removeRow() {
    const idx = selectedIndex();
    if (!rows[idx]) return;
    rows.splice(idx, 1);
    resetHint();
    refresh(Math.max(0, idx - 1));
  }

  function onApply() {
    const json = JSON.stringify(buildFilter(rows));
    (appInstance.ui.panels.query as any)?.setValue(json);
    appInstance.eventBus.emit(EVENTS.QUERY_SEND, json);
    closeQueryBuilder();
  }

  table.key(["escape"], () => closeQueryBuilder());
  table.key(["j"], () => table.down(1));
  table.key(["k"], () => table.up(1));
  table.key(["left"], () => cycleOperator(-1));
  table.key(["right"], () => cycleOperator(1));
  table.key(["enter"], () => editValue());
  table.key(["a"], () => addRow());
  table.key(["d"], () => removeRow());
  table.key(["C-s"], () => onApply());

  appInstance.appendToScreen(overlay);
  builderInstance = { overlay, table, hint };

  refresh(0);

  table.focus();
  appInstance.renderScreen();
}

export function closeQueryBuilder() {
  if (!builderInstance) return;
  const { overlay, table, hint } = builderInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(table);
  appInstance.removeScreenElement(hint);
  builderInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
