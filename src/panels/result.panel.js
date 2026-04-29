import _blessed from "neo-blessed";
const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);
import copyPaste from "copy-paste";
import { theme } from "../config/app.config.js";
import { workspacePanel } from "./workspace.panel.js";
import { screen, ui } from "../core/screen.js";
import { showToast } from "./toast.panel.js";
import { openDialogConfirm, openEditor } from "./modal.panel.js";
import { eventBus } from "../core/eventBus.js";
import { EVENTS } from "../services/enum.js";

/*
|--------------------------------------------------------------------------
| FORMAT HELPERS
|--------------------------------------------------------------------------
*/

function formatValue(value) {
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

function formatTree(doc, indent = 0) {
  const pad = "  ".repeat(indent);
  const lines = [];
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

function colorValue(value) {
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

function createRecordBox(parent, doc, idx) {
  const topOffset = idx * (RECORD_HEIGHT + RECORD_GAP);
  const id = doc._id ?? idx;
  const lines = formatTree(doc);

  const box = blessed.box({
    top: topOffset,
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
    scrollbar: { ch: "▐" },
    style: {
      border: { fg: theme.border.blur },
      scrollbar: { fg: "blue" },
      // highlight เมื่อ focus
      focus: {
        border: { fg: theme.border.focus ?? "cyan" },
      },
    },
    content: lines.join("\n"),
  });

  // ── Events ──────────────────────────────────────────
  box.on("focus", () => {
    box.style.border.fg = theme.border.focus ?? "cyan";
    parent.screen.render();
  });

  box.on("blur", () => {
    box.style.border.fg = theme.border.blur;
    parent.screen.render();
  });

  // Copy: กด 'c'
  box.key(["c"], () => {
    const json = JSON.stringify(doc, null, 2);
    try {
      copyPaste.copy(json, () => {
        showToast(parent.screen, {
          statusCode: 200,
          message: "Copied to clipboard!",
        });
      });
    } catch (error) {
      screen.debug(error);
    }
  });

  // Edit: กด 'e'
  box.key(["e"], () => {
    try {
      openEditor(doc);
      showToast(parent.screen, {
        statusCode: 200,
        message: `Edit record ${idx + 1}`,
      });
    } catch (error) {
      screen.debug(error);
    }
  });

  // Delete: กด 'd'
  box.key(["d"], () => {
    const query = ui.query.getContent();

    openDialogConfirm(
      `Are you sure you want to delete this record id: ${id}?`,
      () => {
        deleteRecord({ id, query });
      },
    );
    showToast(parent.screen, {
      statusCode: 200,
      message: `Delete record ${idx + 1}`,
    });
  });
  box.key(["y"], () => {
    const query = ui.query.getContent();
    const strId = String(id);
    openDialogConfirm(
      `Are you sure you want to Duplicate this record id: random ?`,
      () => {
        duplicateRecord({ id: strId, query });
      },
    );
    showToast(parent.screen, {
      statusCode: 200,
      message: `Duplicate record ${idx + 1}`,
    });
  });
  // Tab / Shift+Tab → เลื่อนไป box ถัดไป/ก่อนหน้า
  box.key(["tab"], () => parent.screen.focusNext());
  box.key(["S-tab"], () => parent.screen.focusPrevious());

  // Mouse click → focus box นั้น
  box.on("click", () => box.focus());

  return box;
}

/*
|--------------------------------------------------------------------------
| RENDER RESULT
|--------------------------------------------------------------------------
*/
function duplicateRecord({ id, query }) {
  eventBus.emit(EVENTS.RECORD_DUPLICATE, { id, query });
}
function deleteRecord({ id, query }) {
  eventBus.emit(EVENTS.RECORD_DELETE, { id, query });
}
export function renderResult(parent, docs) {
  // เคลียร์ของเก่าก่อน
  parent.children.slice().forEach((child) => {
    if (child._isRecord) {
      parent.remove(child);
    }
  });
  parent.setLabel(` Results (${docs.length}) `);
  // container scroll ได้ ครอบทุก record box
  const totalHeight = docs.length * (RECORD_HEIGHT + RECORD_GAP);

  const container = blessed.box({
    top: 0,
    left: 2,
    width: "75%",
    height: "90%",
    label: ` Results (${docs.length}) `,
    border: "line",
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
    tags: true,
    scrollbar: { ch: "▐" },
    style: {
      border: { fg: theme.border.blur },
      scrollbar: { fg: "blue" },
    },
  });

  // สร้าง record box ทีละอัน
  screen.debug(`Rendering ${docs.slice(0, 10).length} records...`);
  docs.slice(0, 10).forEach((doc, idx) => {
    const box = createRecordBox(container, doc, idx);
    box._isRecord = true;
    parent.append(box);
  });

  //  parent.append(container);

  // focus record แรก
  if (docs.length > 0) {
    parent.focus();
    // parent.children[0]?.focus();
  }
  //parensetLabel("test");
  parent.screen.render();
}

/*
|--------------------------------------------------------------------------
| TOAST HELPER
|--------------------------------------------------------------------------
*/
