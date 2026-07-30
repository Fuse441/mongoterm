import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { APP_VERSION } from "@/config/app.paths.js";
import { EVENTS } from "@/services/enum.js";
import { state } from "@/shared/state.js";

/*
|--------------------------------------------------------------------------
| TITLE BAR
|--------------------------------------------------------------------------
| A single-row, borderless header — app name/version always visible,
| connection status refreshed off EVENTS.DB_DATABASES_LOADED (fired after
| every connect attempt, success or fail — see mongodb.events.ts's
| registerConnectionEvents), and an update badge set by app.ts's
| fire-and-forget checkForUpdate() call. The badge is persistent (unlike
| toast.panel.ts's auto-dismissing toast) since an 8s toast is easy to miss
| during startup's connection screen.
|
| Reserves row 0 of the screen — every other top-anchored panel was shifted
| down by 1 and had its height band reduced by 1 to make room (see
| CLAUDE.md's "percentage math" gotcha): tree.event.ts's registerDirectoryTree
| (top 0->1, height 100%-3 -> 100%-4), query.panel.ts (top 0->1),
| workspace.panel.ts (top 3->4, height 100%-6 -> 100%-7).
*/

let box: any = null;
let updateBadge: string | null = null;

function connectionStatus(): string {
  const host = state.mongoClient?.options?.hosts?.[0]?.host;
  return host
    ? `{green-fg}●{/green-fg} ${host}`
    : `{grey-fg}○ not connected{/grey-fg}`;
}

function buildContent(): string {
  const parts = [
    `{bold}MongoTerm{/bold} {grey-fg}v${APP_VERSION}{/grey-fg}`,
    connectionStatus(),
  ];
  if (updateBadge) {
    parts.push(`{yellow-fg}⬆ ${updateBadge} available — npm i -g mongoterm@latest{/yellow-fg}`);
  }
  return ` ${parts.join("  {grey-fg}│{/grey-fg}  ")}`;
}

function refresh() {
  if (!box) return;
  box.setContent(buildContent());
  appInstance.renderScreen();
}

export function titlebarPanel() {
  box = blessed.box({
    id: "titlebar",
    top: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    content: buildContent(),
    style: {
      fg: "white",
    },
  });

  appInstance.eventBus.on(EVENTS.DB_DATABASES_LOADED, () => refresh());

  return box;
}

export function setUpdateBadge(latestVersion: string | null) {
  updateBadge = latestVersion;
  refresh();
}
