import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { state } from "@/shared/state.js";
import { installCursorSupport } from "@/services/cursorInput.service.js";
import { openEditor } from "@/panels/modal.panel.js";
import { toggleIndexesPanel } from "@/panels/indexes.panel.js";
import { toggleCollectionStatsPanel } from "@/panels/collectionStats.panel.js";
import { toggleSchemaAnalysisPanel } from "@/panels/schemaAnalysis.panel.js";
import { toggleViewMode } from "@/panels/result.panel.js";
import { toggleQueryBuilder } from "@/panels/queryBuilder.panel.js";
import { toggleShell } from "@/panels/shell.panel.js";
import { toggleHelp } from "@/panels/help.panel.js";
import {
  openSortPrompt,
  openPageSizePrompt,
  handleBulkDelete,
} from "@/panels/workspace.panel.js";
import {
  jumpToConnection,
  jumpToDatabase,
  jumpToCollection,
} from "@/panels/tree/tree.event.js";

/*
|--------------------------------------------------------------------------
| COMMAND PALETTE
|--------------------------------------------------------------------------
| Global "C-p" fuzzy-searchable quick-jump — every static action plus a
| "jump to" entry for each saved connection, and (only while something's
| already loaded) each database/collection of the currently active
| connection. Deliberately doesn't offer databases/collections of a
| connection you haven't connected to yet — there's no way to know a
| connection's database/collection names without connecting to it first,
| so the palette only surfaces what's already known (state.databases /
| state.collections, single-connection-scoped globals — see
| tree.event.ts's onExpand).
|
| Structurally mirrors history.panel.ts's search-box-over-list layout, but
| composes navigation into the *typing* box itself (installCursorSupport's
| onKey, same technique as query/queryAutocomplete.panel.ts) rather than
| switching focus to the list — so you can keep typing to refine the
| filter while arrow keys move the selection, closer to a real command
| palette than history's box.
|
| Both the input and the results list are plain text (no `tags`) even
| though a category label would look nicer in color: the list renders
| real database/collection names, which are technically arbitrary
| user-controlled strings that could contain a literal "{" blessed would
| try to parse as markup — same reasoning as result.panel.ts's grid view.
*/

interface Command {
  category: string;
  label: string;
  run: () => unknown;
}

function fuzzyScore(query: string, text: string): number | null {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let lastMatch = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastMatch === ti - 1 ? 2 : 1;
      lastMatch = ti;
      qi++;
    }
  }
  return qi === q.length ? score : null;
}

async function quitApp() {
  if (state.mongoClient) await state.mongoClient.close();
  process.exit(0);
}

function buildCommands(): Command[] {
  const workspace = () => appInstance.ui.panels.workspace!;
  const commands: Command[] = [
    { category: "Action", label: "Insert record", run: () => openEditor({}, { isInsert: true }) },
    { category: "Action", label: "Sort", run: () => openSortPrompt(workspace()) },
    { category: "Action", label: "Page size", run: () => openPageSizePrompt(workspace()) },
    { category: "Action", label: "Bulk delete (matches filter)", run: () => handleBulkDelete() },
    { category: "Action", label: "Toggle tree/table view", run: () => toggleViewMode() },
    { category: "Action", label: "Indexes", run: () => toggleIndexesPanel() },
    { category: "Action", label: "Collection stats", run: () => toggleCollectionStatsPanel() },
    { category: "Action", label: "Schema analysis", run: () => toggleSchemaAnalysisPanel() },
    { category: "Action", label: "Query builder", run: () => toggleQueryBuilder() },
    { category: "Action", label: "Query shell", run: () => toggleShell() },
    { category: "Action", label: "Help", run: () => toggleHelp() },
    { category: "Action", label: "Quit", run: () => quitApp() },
  ];

  state.connections.forEach((conn: any, index: number) => {
    commands.push({
      category: "Connection",
      label: conn.favorite?.name ?? "(unnamed)",
      run: () => jumpToConnection(index),
    });
  });

  state.databases.forEach((dbName) => {
    commands.push({
      category: "Database",
      label: dbName,
      run: () => jumpToDatabase(dbName),
    });
  });

  state.collections.forEach((colName) => {
    commands.push({
      category: "Collection",
      label: colName,
      run: () => jumpToCollection(colName),
    });
  });

  return commands;
}

let paletteInstance: { overlay: any; box: any; input: any; list: any } | null = null;
let allCommands: Command[] = [];
let filtered: Command[] = [];

function renderList() {
  if (!paletteInstance) return;
  paletteInstance.list.setItems(
    filtered.length
      ? filtered.map((c) => `[${c.category}] ${c.label}`)
      : ["No matching commands"],
  );
  paletteInstance.list.select(0);
  appInstance.renderScreen();
}

function applyFilter(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    filtered = allCommands;
  } else {
    filtered = allCommands
      .map((c) => ({ c, score: fuzzyScore(trimmed, `${c.category} ${c.label}`) }))
      .filter((x): x is { c: Command; score: number } => x.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }
  renderList();
}

function runSelected() {
  if (!paletteInstance || !filtered.length) return;
  const idx = (paletteInstance.list.selected ?? 0) as number;
  const command = filtered[idx];
  closeCommandPalette();
  command?.run();
}

export function toggleCommandPalette() {
  if (paletteInstance) {
    closeCommandPalette();
    return;
  }

  const overlay = blessed.box({
    top: 0,
    parent: appInstance.screen,
    left: 0,
    width: "100%",
    height: "100%",
    style: { bg: "black", transparent: true },
  });

  const box = blessed.box({
    top: "center",
    parent: overlay,
    left: "center",
    width: 70,
    height: 20,
    label: " Command Palette ",
    border: "line",
    style: { border: { fg: "cyan" } },
  });

  const input: any = blessed.textbox({
    parent: box,
    top: 0,
    left: 1,
    width: "100%-4",
    height: 1,
    inputOnFocus: true,
    style: { fg: "white" },
  });

  const list: any = blessed.list({
    parent: box,
    top: 2,
    left: 1,
    width: "100%-4",
    height: "100%-4",
    style: {
      selected: { bg: "blue", fg: "white" },
    },
  });

  installCursorSupport(input, {
    onChange: (value) => applyFilter(value),
    onKey: (_ch, key) => {
      if (key.name === "down") {
        list.down(1);
        appInstance.renderScreen();
        return true;
      }
      if (key.name === "up") {
        list.up(1);
        appInstance.renderScreen();
        return true;
      }
      if (key.name === "enter" || key.name === "return") {
        runSelected();
        return true;
      }
      if (key.name === "escape") {
        closeCommandPalette();
        return true;
      }
      return undefined;
    },
  });

  paletteInstance = { overlay, box, input, list };
  allCommands = buildCommands();

  appInstance.appendToScreen(overlay);
  applyFilter("");

  input.focus();
  appInstance.renderScreen();
}

export function closeCommandPalette() {
  if (!paletteInstance) return;
  const { overlay, box, input, list } = paletteInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(box);
  appInstance.removeScreenElement(input);
  appInstance.removeScreenElement(list);
  paletteInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
