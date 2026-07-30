import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { EVENTS } from "@/services/enum.js";
import { openDialogConfirm, promptInline } from "@/panels/modal.panel.js";
import { showToast } from "@/panels/toast.panel.js";
import { theme } from "@/config/app.config.js";

/*
|--------------------------------------------------------------------------
| INDEXES (table style)
|--------------------------------------------------------------------------
| Lists indexes for the current collection plus $indexStats usage, opened
| via the workspace panel's "i" key (src/panels/workspace.panel.ts).
| Mirrors queryBuilder.panel.ts's toggle/overlay/table structure and
| modal.panel.ts's promptInline/openDialogConfirm for the create/drop
| flows.
*/

interface IndexRow {
  name: string;
  key: Record<string, number>;
  unique?: boolean;
  expireAfterSeconds?: number;
}

interface IndexStat {
  name: string;
  accesses?: { ops: number; since: Date };
}

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatTtl(seconds?: number): string {
  if (seconds === undefined || seconds === null) return "";

  const units: [number, string][] = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];

  for (const [unitSeconds, label] of units) {
    if (seconds % unitSeconds === 0) {
      return `${seconds}s (${seconds / unitSeconds}${label})`;
    }
  }

  return `${seconds}s`;
}

function formatUsage(name: string, stats: IndexStat[]): string {
  const stat = stats.find((s) => s.name === name);
  if (!stat?.accesses) return "n/a";

  const since = stat.accesses.since ? new Date(stat.accesses.since) : null;
  return `${stat.accesses.ops} ops${since ? ` since ${since.toISOString().slice(0, 10)}` : ""}`;
}

function buildRows(indexes: IndexRow[], stats: IndexStat[]): string[][] {
  const header = [["Name", "Keys", "Unique", "TTL", "Usage"]];
  return header.concat(
    indexes.map((idx) => [
      idx.name,
      truncate(JSON.stringify(idx.key)),
      idx.unique ? "yes" : "",
      formatTtl(idx.expireAfterSeconds),
      formatUsage(idx.name, stats),
    ]),
  );
}

function parseIndexKeys(raw: string): Record<string, 1 | -1> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const keys: Record<string, 1 | -1> = {};
  for (const part of trimmed.split(",")) {
    const [field, dirRaw] = part.split(":").map((s) => s.trim());
    const dir = dirRaw === "-1" ? -1 : dirRaw === "1" ? 1 : null;
    if (!field || dir === null) return null;
    keys[field] = dir;
  }

  return Object.keys(keys).length ? keys : null;
}

function parseIndexOptions(raw: string): Record<string, any> {
  const options: Record<string, any> = {};
  for (const token of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (token === "unique") {
      options.unique = true;
    } else if (token === "sparse") {
      options.sparse = true;
    } else if (token.startsWith("ttl=")) {
      const seconds = Number(token.slice(4));
      if (Number.isFinite(seconds)) options.expireAfterSeconds = seconds;
    }
  }
  return options;
}

let indexesInstance: {
  overlay: any;
  table: any;
  hint: any;
  indexes: IndexRow[];
  stats: IndexStat[];
} | null = null;

export function toggleIndexesPanel() {
  if (indexesInstance) {
    closeIndexesPanel();
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

  const table = blessed.listtable({
    top: "center",
    parent: overlay,
    left: "center",
    width: "70%",
    height: "60%",
    label: " Indexes ",
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
        selected: { bg: theme.selection.bg, fg: theme.selection.fg },
      },
    },
  });

  const DEFAULT_HINT =
    " {grey-fg}esc{/grey-fg} close   {grey-fg}c{/grey-fg} create index   {grey-fg}d{/grey-fg} drop index   {grey-fg}j/k{/grey-fg} navigate ";

  const hint = blessed.box({
    bottom: 0,
    parent: overlay,
    left: "center",
    width: "70%",
    height: 1,
    tags: true,
    content: DEFAULT_HINT,
  });

  indexesInstance = { overlay, table, hint, indexes: [], stats: [] };

  table.key(["escape"], () => closeIndexesPanel());
  // Explicit render: nothing auto-repaints the screen after a keypress
  // (the only periodic render in the app is monitor.panel.ts's 500ms
  // tick), so without this the selection highlight lags behind rapid j/k.
  table.key(["j"], () => {
    table.down(1);
    appInstance.renderScreen();
  });
  table.key(["k"], () => {
    table.up(1);
    appInstance.renderScreen();
  });
  table.key(["c"], () => createIndexFlow());
  table.key(["d"], () => dropSelectedIndex());

  appInstance.appendToScreen(overlay);
  appInstance.eventBus.emit(EVENTS.INDEX_LIST_FETCH);

  table.focus();
  appInstance.renderScreen();
}

export function renderIndexesTable({
  indexes,
  stats,
}: {
  indexes: IndexRow[];
  stats: IndexStat[];
}) {
  if (!indexesInstance) return;

  indexesInstance.indexes = indexes;
  indexesInstance.stats = stats;
  indexesInstance.table.setData(buildRows(indexes, stats));
  appInstance.renderScreen();
}

function selectedIndexRow(): IndexRow | undefined {
  if (!indexesInstance) return undefined;
  const selected = (indexesInstance.table as any).selected ?? 1;
  return indexesInstance.indexes[selected - 1];
}

function createIndexFlow() {
  promptInline("Index keys — field:1,field:-1", "", (raw) => {
    indexesInstance?.table.focus();
    if (raw === null) return;

    const keys = parseIndexKeys(raw);
    if (!keys) {
      showToast({
        statusCode: 400,
        message: 'Invalid index keys — use "field:1" or "field:-1", comma separated',
      });
      return;
    }

    promptInline(
      "Options — unique, sparse, ttl=<seconds> (optional)",
      "",
      (optionsRaw) => {
        indexesInstance?.table.focus();
        if (optionsRaw === null) return;

        const options = parseIndexOptions(optionsRaw);
        appInstance.eventBus.emit(EVENTS.INDEX_CREATE, { keys, options });
      },
    );
  });
}

function dropSelectedIndex() {
  const row = selectedIndexRow();
  if (!row) return;

  if (row.name === "_id_") {
    showToast({ statusCode: 400, message: "Cannot drop the _id index" });
    return;
  }

  openDialogConfirm(
    `Drop index "${row.name}"? This cannot be undone.`,
    () => {
      appInstance.eventBus.emit(EVENTS.INDEX_DROP, row.name);
      // openDialogConfirm's close always refocuses the workspace panel;
      // reclaim focus for the still-open indexes overlay.
      indexesInstance?.table.focus();
    },
  );
}

export function closeIndexesPanel() {
  if (!indexesInstance) return;
  const { overlay, table, hint } = indexesInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(table);
  appInstance.removeScreenElement(hint);
  indexesInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
