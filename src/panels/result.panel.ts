import blessed from "neo-blessed";
import copyPaste from "copy-paste";
import { theme } from "@/config/app.config";
import { showToast } from "./toast.panel.js";
import { openDialogConfirm, openEditor } from "./modal.panel.js";
import { EVENTS } from "../services/enum.js";
import { logger } from "@/utils/logger/logger.service";
import { appInstance } from "@/app.js";
import { state } from "@/shared/state.js";

// Duplicated from workspace.panel.ts's WORKSPACE_NAV_HINT (not imported —
// that file already imports toggleViewMode from this one, and importing
// back would create a cycle). Keep both in sync by hand if this changes.
const WORKSPACE_NAV_HINT = "{grey-fg}[h→tree] [k→query] [l→record]{/grey-fg}";

/*
|--------------------------------------------------------------------------
| FORMAT HELPERS
|--------------------------------------------------------------------------
*/

function formatValue(value: any) {
  // MongoDB ObjectId และ BSON types
  if (value?._bsontype) {
    return colorValue(value.toString());
  }
  // Buffer / Binary
  if (Buffer.isBuffer(value)) {
    return `{grey-fg}Buffer(${value.length}){/grey-fg}`;
  }
  // Date
  if (value instanceof Date) {
    return `{blue-fg}"${value.toISOString()}"{/blue-fg}`;
  }
  return null;
}

function formatTree(doc: any, indent = 0) {
  const pad = "  ".repeat(indent);
  const lines: any = [];
  const entries = Object.entries(doc);

  entries.forEach(([key, value], i) => {
    const isLast = i === entries.length - 1;
    const branch = isLast ? "└─" : "├─";
    const childPad = pad + (isLast ? "   " : "│  ");
    const special = formatValue(value);
    if (special !== null) {
      lines.push(
        `${pad}{grey-fg}${branch}{/grey-fg} {cyan-fg}${key}{/cyan-fg}: ${special}`,
      );
      return;
    }
    if (value === null || value === undefined) {
      lines.push(
        `${pad}{grey-fg}${branch}{/grey-fg} {cyan-fg}${key}{/cyan-fg}: {grey-fg}null{/grey-fg}`,
      );
    } else if (typeof value === "object" && !Array.isArray(value)) {
      lines.push(
        `${pad}{grey-fg}${branch}{/grey-fg} {cyan-fg}${key}{/cyan-fg}: {grey-fg}Object{/grey-fg}`,
      );
      lines.push(...formatTree(value, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(
        `${pad}{grey-fg}${branch}{/grey-fg} {cyan-fg}${key}{/cyan-fg}: {grey-fg}Array : [${value.length}]{/grey-fg}`,
      );
      value.forEach((item, idx) => {
        const isLastItem = idx === value.length - 1;
        const arrBranch = isLastItem ? "└─" : "├─";
        if (typeof item === "object" && item !== null) {
          lines.push(
            `${childPad}{grey-fg}${arrBranch}{/grey-fg} {yellow-fg}[${idx}]{/yellow-fg}`,
          );
          lines.push(...formatTree(item, indent + 2));
        } else {
          lines.push(
            `${childPad}{grey-fg}${arrBranch}{/grey-fg} {yellow-fg}[${idx}]{/yellow-fg}: ${colorValue(item)}`,
          );
        }
      });
    } else {
      lines.push(
        `${pad}{grey-fg}${branch}{/grey-fg} {cyan-fg}${key}{/cyan-fg}: ${colorValue(value)}`,
      );
    }
  });

  return lines;
}

function colorValue(value: any) {
  if (typeof value === "string") return `{green-fg}"${value}"{/green-fg}`;
  if (typeof value === "number") return `{yellow-fg}${value}{/yellow-fg}`;
  if (typeof value === "boolean") return `{magenta-fg}${value}{/magenta-fg}`;
  return `${String(value)}`;
}

/*
|--------------------------------------------------------------------------
| RECORD BOX
|--------------------------------------------------------------------------
*/
const RECORD_HEIGHT = 12; // height ของแต่ละ box
const RECORD_GAP = 1; // ช่องว่างระหว่าง box

function createRecordBox(parent: any, doc: any, idx: any) {
  const id = doc._id ?? idx;

  const box = blessed.box({
    id: `record-${id}`,
    top: idx * (RECORD_HEIGHT + RECORD_GAP),
    left: 0,
    width: "100%-10",
    height: RECORD_HEIGHT,
    label: ` Record ${idx + 1}  {grey-fg}_id: ${id}{/grey-fg} `,
    border: "line",
    keys: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    tags: true,
    _isRecord: true,
    scrollbar: {
      ch: "▐",
    },
    style: {
      scrollbar: {
        fg: "blue",
      },
      border: {
        fg: theme.border.blur,
      },
      focus: {
        border: {
          fg: theme.border.focus,
        },
      },
    },
    content: formatTree(doc).join("\n"),
  });

  bindRecordEvents({
    box,
    parent,
    doc,
    id,
    idx,
  });

  return box;
}
function bindRecordEvents({ box, parent, doc, id, idx }: any) {
  // box.on("focus", () => {
  //   logger.debug(`Focused on record ${idx + 1} with id: ${id}`);
  // });

  box.on("focus", () => {
    appInstance.setKeybindbarContent("record");
  });
  box.key("c", () => handleCopy(parent, doc));

  box.key("e", () => handleEdit(parent, doc, idx));

  box.key("d", () => handleDelete(parent, id, idx));

  box.key("y", () => handleDuplicate(parent, id, idx));

  box.key("C-n", () => handleInsert());

  box.key("v", () => toggleViewMode());

  box.key("tab", () => parent.screen.focusNext());

  box.key("S-tab", () => parent.screen.focusPrevious());

  box.on("click", () => {
    if (parent.screen.focused !== box) {
      box.focus();
    }
  });
}

/*
  |--------------------------------------------------------------------------
  | RENDER RESULT
  |--------------------------------------------------------------------------
  */

function handleDelete(parent: any, id: any, idx: any) {
  const query = appInstance.ui.panels.query!.getContent();

  openDialogConfirm(
    `Are you sure you want to delete this record id: ${id}?`,
    () => deleteRecord({ id, query }),
  );

  showToast({
    statusCode: 200,
    message: `Delete record ${idx + 1}`,
  });
}

function handleDuplicate(parent: any, id: any, idx: any) {
  const query = appInstance.ui.panels.query!.getContent();

  openDialogConfirm(
    "Are you sure you want to Duplicate this record id: random ?",
    () =>
      duplicateRecord({
        id: String(id),
        query,
      }),
  );
}
function handleEdit(parent: any, doc: any, idx: any) {
  try {
    const currentFocus = parent.screen.focused;
    openEditor(doc);
  } catch (error) {
    logger.error({ message: "Error opening editor", error });
  }
}
function handleInsert() {
  try {
    openEditor({}, { isInsert: true });
  } catch (error) {
    logger.error({ message: "Error opening insert editor", error });
  }
}
function handleCopy(parent: any, doc: any) {
  try {
    copyPaste.copy(JSON.stringify(doc, null, 2), () => {
      showToast({
        statusCode: 200,
        message: "Copied to clipboard!",
      });
    });
  } catch (error) {
    logger.error({ message: "Error copying to clipboard", error });
  }
}
function duplicateRecord({ id, query }: any) {
  logger.debug({ message: "Emitting RECORD_DUPLICATE event", id, query });
  appInstance.eventBus.emit(EVENTS.RECORD_DUPLICATE, { id, query });
}
function deleteRecord({ id, query }: any) {
  appInstance.eventBus.emit(EVENTS.RECORD_DELETE, { id, query });
}

// Cached so toggleViewMode() can flip state.viewMode and re-render the
// current page without re-querying MongoDB.
let lastPayload: any = { docs: [], pagination: {} };

export function toggleViewMode() {
  state.viewMode = state.viewMode === "tree" ? "table" : "tree";
  renderResult(appInstance.ui.panels.workspace!, lastPayload);
}

/*
|--------------------------------------------------------------------------
| GRID VIEW (flat table, alternative to the tree-formatted record boxes)
|--------------------------------------------------------------------------
| One row per document instead of one box per document — column set is the
| union of top-level field names across the current page (capped so it
| doesn't overflow), always leading with _id. Deliberately plain text (no
| {color-fg} tags / tags:false) rather than reusing formatValue/colorValue:
| tag-colored cell content is exactly what broke selected-row contrast in
| the tree/autocomplete lists (see tree.panel.ts's formatRow) and grid
| values are free-form user data, so tags:false also avoids a document
| field value like "{red-fg}" being parsed as markup.
*/

const GRID_MAX_COLUMNS = 6;
const GRID_CELL_MAX = 30;

function truncateCell(text: string, max = GRID_CELL_MAX): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function stringifyCell(value: any): string {
  if (value === null || value === undefined) return "";
  if (value?._bsontype) return value.toString();
  if (Buffer.isBuffer(value)) return `Buffer(${value.length})`;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "{Object}";
    }
  }
  return String(value);
}

function gridColumns(docs: any[]): string[] {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    for (const key of Object.keys(doc)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
    if (columns.length >= GRID_MAX_COLUMNS) break;
  }
  const withoutId = columns
    .filter((c) => c !== "_id")
    .slice(0, GRID_MAX_COLUMNS - 1);
  return columns.includes("_id") ? ["_id", ...withoutId] : withoutId;
}

function renderGridView(parent: blessed.Widgets.BoxElement, docs: any[]) {
  const columns = gridColumns(docs);
  const rows = [columns].concat(
    docs.map((doc) =>
      columns.map((col) => truncateCell(stringifyCell(doc[col]))),
    ),
  );

  const table: any = blessed.listtable({
    parent,
    top: 0,
    left: 0,
    width: "100%-2",
    height: "100%-2",
    border: "line",
    align: "left",
    keys: true,
    mouse: true,
    tags: false,
    interactive: true,
    data: rows,
    style: {
      border: { fg: theme.border.blur },
      focus: { border: { fg: theme.border.focus } },
      header: { bold: true, fg: "yellow" },
      cell: {
        selected: { bg: theme.listtable.selectedBg, fg: theme.listtable.selectedFg },
      },
    },
  });
  table._isGridTable = true;

  table.on("focus", () => appInstance.setKeybindbarContent("grid"));

  function selectedDoc(): any {
    const idx = ((table.selected ?? 1) - 1) as number;
    return docs[idx];
  }

  function query(): string {
    return appInstance.ui.panels.query!.getContent();
  }

  // Row navigation must render immediately — nothing else in the app does
  // a periodic auto-render except monitor.panel.ts's 500ms CPU/RAM tick, so
  // without an explicit renderScreen() here the highlight only catches up
  // whenever that tick happens to fire next, which reads as laggy/stepped
  // input on rapid j/k presses.
  table.key(["j"], () => {
    table.down(1);
    appInstance.renderScreen();
  });
  table.key(["k"], () => {
    table.up(1);
    appInstance.renderScreen();
  });
  table.key(["g"], () => {
    table.select(0);
    appInstance.renderScreen();
  });
  table.key(["S-g"], () => {
    table.select(rows.length - 1);
    appInstance.renderScreen();
  });
  table.key(["h", "escape"], () => {
    appInstance.ui.panels.workspace!.focus();
    appInstance.renderScreen();
  });
  table.key(["enter", "e"], () => {
    const doc = selectedDoc();
    if (doc) handleEdit(parent, doc, 0);
  });
  table.key(["c"], () => {
    const doc = selectedDoc();
    if (doc) handleCopy(parent, doc);
  });
  table.key(["d"], () => {
    const doc = selectedDoc();
    if (!doc) return;
    openDialogConfirm(
      `Are you sure you want to delete this record id: ${doc._id}?`,
      () => deleteRecord({ id: doc._id, query: query() }),
    );
  });
  table.key(["y"], () => {
    const doc = selectedDoc();
    if (!doc) return;
    openDialogConfirm(
      "Are you sure you want to Duplicate this record id: random ?",
      () => duplicateRecord({ id: String(doc._id), query: query() }),
    );
  });
  table.key(["C-n"], () => handleInsert());
  table.key(["v"], () => toggleViewMode());

  parent.append(table);
  table.focus();
  parent.screen.render();
}

export async function renderResult(
  parent: blessed.Widgets.BoxElement,
  payload: any,
) {
  appInstance.ui.panels.workspace?.focus();
  parent.removeListener("scroll", () => { });
  lastPayload = payload;
  const docs = payload.docs || [];
  const total = payload.pagination?.total ?? docs.length;
  state.totalMatching = total;

  await parent.children.slice().forEach((child: any) => {
    if (child._isRecord || child._isEmptyState || child._isGridTable) {
      parent.remove(child);
    }
  });
  const sortLabel = state.sort
    ? `  sort:${Object.entries(state.sort)
      .map(([f, d]) => `${f}:${d}`)
      .join(",")}`
    : "";
  const viewLabel = state.viewMode === "table" ? "  view:table" : "";
  parent.setLabel(
    ` Results (${total}) page ${state.page} of ${state.totalPages || 1}  size:${state.pageSize}${sortLabel}${viewLabel}  ${WORKSPACE_NAV_HINT} `,
  );
  const rowHeight = RECORD_HEIGHT + RECORD_GAP;
  //
  parent.scrollTo(0);

  if (docs.length === 0) {
    const emptyBox = blessed.box({
      top: 1,
      left: "center",
      width: "80%",
      height: 3,
      align: "center",
      tags: true,
      content:
        "{grey-fg}No records match this query.{/grey-fg}\n{grey-fg}Adjust the query, or press {/grey-fg}{cyan-fg}C-n{/cyan-fg}{grey-fg} to insert one.{/grey-fg}",
    });
    emptyBox._isEmptyState = true;
    parent.append(emptyBox);
    parent.focus();
    parent.screen.render();
    return;
  }

  if (state.viewMode === "table") {
    renderGridView(parent, docs);
    return;
  }

  const visibleRows = Math.ceil(Number(parent.height) / rowHeight) + 5;
  let renderedCount = Math.min(docs.length, visibleRows);

  parent.on("scroll", () => {
    const scrollTop = parent.getScroll();
    const endIndex =
      Math.floor(scrollTop / rowHeight) +
      Math.ceil(Number(parent.height) / rowHeight);

    // เหลืออีก 2 แถวจะโหลดเพิ่ม
    if (endIndex >= renderedCount - 2 && renderedCount < docs.length) {
      const next = Math.min(renderedCount + visibleRows, docs.length);

      for (let i = renderedCount; i < next; i++) {
        const box = createRecordBox(parent, docs[i], i);
        box._isRecord = true;
        parent.append(box);
      }

      renderedCount = next;
      parent.screen.render();
    }
  });
  logger.debug({
    message: `visible rows: ${visibleRows}, total docs: ${docs.length}  match: ${Math.min(docs.length, visibleRows)}`,
  });
  for (let i = 0; i < Math.min(docs.length, visibleRows); i++) {
    const box: blessed.Widgets.BoxElement = createRecordBox(parent, docs[i], i);
    box._isRecord = true;
    parent.append(box);
  }

  parent.focus();
  parent.screen.render();
}
