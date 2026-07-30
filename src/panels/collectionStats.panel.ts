import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { EVENTS } from "@/services/enum.js";

/*
|--------------------------------------------------------------------------
| COLLECTION STATS
|--------------------------------------------------------------------------
| Read-only overlay showing storage size, document count, avg document
| size, and index size for the current collection ($collStats aggregation,
| not the deprecated collStats command). Opened via the workspace panel's
| "S-i" key (src/panels/workspace.panel.ts). Simpler than indexes.panel.ts's
| listtable since there's nothing to select/edit here — just a static box,
| closed with esc, matching modal.panel.ts's openDialogConfirm box styling.
*/

interface CollectionStorageStats {
  count?: number;
  size?: number;
  avgObjSize?: number;
  storageSize?: number;
  nindexes?: number;
  totalIndexSize?: number;
  totalSize?: number;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "n/a";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function buildContent(stats: CollectionStorageStats | null): string {
  if (!stats) {
    return " {red-fg}Could not load collection stats{/red-fg} ";
  }

  const rows: [string, string][] = [
    ["Document count", String(stats.count ?? 0)],
    ["Avg document size", formatBytes(stats.avgObjSize)],
    ["Data size", formatBytes(stats.size)],
    ["Storage size", formatBytes(stats.storageSize)],
    ["Index count", String(stats.nindexes ?? 0)],
    ["Total index size", formatBytes(stats.totalIndexSize)],
    ["Total size", formatBytes(stats.totalSize)],
  ];

  const label = Math.max(...rows.map(([k]) => k.length));
  return rows
    .map(([k, v]) => ` {bold}${k.padEnd(label)}{/bold}  ${v}`)
    .join("\n");
}

let statsInstance: { overlay: any; box: any } | null = null;

export function toggleCollectionStatsPanel() {
  if (statsInstance) {
    closeCollectionStatsPanel();
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
    width: 50,
    height: 12,
    label: " Collection Stats ",
    border: "line",
    tags: true,
    keys: true,
    content: " Loading…",
    style: {
      border: { fg: "cyan" },
    },
  });

  box.key(["escape"], () => closeCollectionStatsPanel());

  statsInstance = { overlay, box };

  appInstance.appendToScreen(overlay);
  appInstance.eventBus.emit(EVENTS.COLLECTION_STATS_FETCH);

  box.focus();
  appInstance.renderScreen();
}

export function renderCollectionStats(stats: CollectionStorageStats | null) {
  if (!statsInstance) return;

  statsInstance.box.setContent(buildContent(stats));
  appInstance.renderScreen();
}

export function closeCollectionStatsPanel() {
  if (!statsInstance) return;
  const { overlay, box } = statsInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(box);
  statsInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
