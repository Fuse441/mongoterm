import blessed from "neo-blessed";
import copyPaste from "copy-paste";
import { theme } from "@/config/app.config";
import { showToast } from "./toast.panel.js";
import { openDialogConfirm, openEditor } from "./modal.panel.js";
import { EVENTS } from "../services/enum.js";
import { logger } from "@/utils/logger/logger.service";
import { appInstance } from "@/app.js";
import { state } from "@/shared/state.js";

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
  box.key("c", () => handleCopy(parent, doc));

  box.key("e", () => handleEdit(parent, doc, idx));

  box.key("d", () => handleDelete(parent, id, idx));

  box.key("y", () => handleDuplicate(parent, id, idx));

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
    openEditor(doc);
  } catch (error) {
    logger.error({ message: "Error opening editor", error });
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

export async function renderResult(
  parent: blessed.Widgets.BoxElement,
  payload: any,
) {
  appInstance.ui.panels.workspace?.focus();
  parent.removeListener("scroll", () => { });
  const docs = payload.docs || [];

  await parent.children.slice().forEach((child: any) => {
    if (child._isRecord) {
      parent.remove(child);
    }
  });
  parent.setLabel(` Results (${docs.length * state.totalPages}) `);
  const rowHeight = RECORD_HEIGHT + RECORD_GAP;
  //
  parent.scrollTo(0);
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

  if (docs.length > 0) {
    parent.focus();
  }
  parent.screen.render();
}
