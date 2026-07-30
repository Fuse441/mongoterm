import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { EVENTS } from "@/services/enum.js";
import { promptInline } from "@/panels/modal.panel.js";
import { showToast } from "@/panels/toast.panel.js";
import { theme } from "@/config/app.config.js";

/*
|--------------------------------------------------------------------------
| SCHEMA ANALYSIS
|--------------------------------------------------------------------------
| Samples documents from the current collection ($sample aggregation, not
| a full collection scan — cheap even on large collections) and reports,
| per top-level field: how often it appears across the sample, and the
| mix of BSON types seen for it (schemas drift in MongoDB; a field isn't
| guaranteed one type). Opened via the workspace panel's "a" key. Mirrors
| indexes.panel.ts's toggle/overlay/listtable structure; "r" resamples,
| "c" changes the sample size (promptInline, same pattern as
| workspace.panel.ts's sort/page-size prompts).
*/

const DEFAULT_SAMPLE_SIZE = 100;

interface FieldStat {
  field: string;
  count: number;
  types: Map<string, number>;
}

function fieldType(value: any): string {
  if (value === null || value === undefined) return "Null";
  if (value?._bsontype) return "ObjectId";
  if (value instanceof Date) return "Date";
  if (Array.isArray(value)) return "Array";
  if (typeof value === "number") return "Number";
  if (typeof value === "boolean") return "Boolean";
  if (typeof value === "object") return "Object";
  return "String";
}

function analyzeSchema(docs: any[]): FieldStat[] {
  const fields = new Map<string, FieldStat>();

  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc)) {
      let stat = fields.get(key);
      if (!stat) {
        stat = { field: key, count: 0, types: new Map() };
        fields.set(key, stat);
      }
      stat.count++;
      const type = fieldType(value);
      stat.types.set(type, (stat.types.get(type) ?? 0) + 1);
    }
  }

  return Array.from(fields.values()).sort((a, b) => b.count - a.count);
}

function formatTypes(stat: FieldStat): string {
  return Array.from(stat.types.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type} ${Math.round((count / stat.count) * 100)}%`)
    .join(", ");
}

function buildRows(stats: FieldStat[], sampleCount: number): string[][] {
  const header = [["Field", "Types", "Frequency"]];
  if (!sampleCount) return header;

  return header.concat(
    stats.map((stat) => [
      stat.field,
      formatTypes(stat),
      `${Math.round((stat.count / sampleCount) * 100)}% (${stat.count}/${sampleCount})`,
    ]),
  );
}

let schemaInstance: {
  overlay: any;
  table: any;
  hint: any;
  sampleSize: number;
} | null = null;

function requestAnalysis() {
  if (!schemaInstance) return;
  appInstance.eventBus.emit(EVENTS.SCHEMA_ANALYSIS_FETCH, schemaInstance.sampleSize);
}

function changeSampleSize() {
  if (!schemaInstance) return;
  promptInline("Sample size", String(schemaInstance.sampleSize), (value) => {
    schemaInstance?.table.focus();
    if (value === null) return;

    const size = Number(value.trim());
    if (!Number.isInteger(size) || size <= 0) {
      showToast({
        statusCode: 400,
        message: "Invalid sample size — enter a positive integer",
      });
      return;
    }

    schemaInstance!.sampleSize = size;
    requestAnalysis();
  });
}

export function toggleSchemaAnalysisPanel() {
  if (schemaInstance) {
    closeSchemaAnalysisPanel();
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

  const table: any = blessed.listtable({
    top: "center",
    parent: overlay,
    left: "center",
    width: "70%",
    height: "60%",
    label: " Schema Analysis ",
    border: "line",
    align: "left",
    keys: true,
    mouse: true,
    tags: true,
    interactive: true,
    data: [["Field", "Types", "Frequency"]],
    style: {
      border: { fg: "cyan" },
      header: { bold: true, fg: "yellow" },
      cell: {
        selected: { bg: theme.listtable.selectedBg, fg: theme.listtable.selectedFg },
      },
    },
  });

  const DEFAULT_HINT =
    " {grey-fg}esc{/grey-fg} close   {grey-fg}r{/grey-fg} resample   {grey-fg}c{/grey-fg} change sample size   {grey-fg}j/k{/grey-fg} navigate ";

  const hint = blessed.box({
    bottom: 0,
    parent: overlay,
    left: "center",
    width: "70%",
    height: 1,
    tags: true,
    content: DEFAULT_HINT,
  });

  schemaInstance = { overlay, table, hint, sampleSize: DEFAULT_SAMPLE_SIZE };

  table.key(["escape"], () => closeSchemaAnalysisPanel());
  table.key(["j"], () => {
    table.down(1);
    appInstance.renderScreen();
  });
  table.key(["k"], () => {
    table.up(1);
    appInstance.renderScreen();
  });
  table.key(["r"], () => requestAnalysis());
  table.key(["c"], () => changeSampleSize());

  appInstance.appendToScreen(overlay);
  appInstance.appendToScreen(hint);
  requestAnalysis();

  table.focus();
  appInstance.renderScreen();
}

export function renderSchemaAnalysis({ docs }: { docs: any[] }) {
  if (!schemaInstance) return;

  const stats = analyzeSchema(docs);
  schemaInstance.table.setLabel(
    docs.length
      ? ` Schema Analysis (sample: ${docs.length} docs) `
      : " Schema Analysis (collection is empty) ",
  );
  schemaInstance.table.setData(buildRows(stats, docs.length));
  appInstance.renderScreen();
}

export function closeSchemaAnalysisPanel() {
  if (!schemaInstance) return;
  const { overlay, table, hint } = schemaInstance;
  appInstance.removeScreenElement(overlay);
  appInstance.removeScreenElement(table);
  appInstance.removeScreenElement(hint);
  schemaInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
