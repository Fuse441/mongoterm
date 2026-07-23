import { appInstance } from "@/app";
import _blessed from "neo-blessed";
const blessed /** @type {typeof import('blessed')} */ =
  /** @type {any} */ _blessed;

import { keybindbarConfig, helpOnlyConfig } from "./keybingbar/keybindbar.config.js";
import { IKeybind } from "./keybingbar/keybindbar.interface.js";

/*
|--------------------------------------------------------------------------
| HELP POPUP
|--------------------------------------------------------------------------
| The keybind list here is generated from keybindbarConfig/helpOnlyConfig
| (also the source for the bottom keybindbar) instead of a hardcoded copy,
| so editing a keybind in one place updates both.
*/

const SECTION_TITLES: Record<string, string> = {
  tree: "Connection Tree",
  workspace: "Workspace",
  record: "Record",
  query: "Query",
  editor: "Record Editor",
  autocomplete: "Query Autocomplete",
  global: "Global",
};

const SECTION_ORDER = [
  "tree",
  "workspace",
  "record",
  "query",
  "editor",
  "autocomplete",
  "global",
] as const;

function renderSection(title: string, binds: IKeybind[]): string[] {
  const lines = [` {bold}${title}{/bold}`];
  for (const bind of binds) {
    lines.push(` {cyan-fg}${bind.key}{/cyan-fg}    ${bind.description}`);
  }
  return lines;
}

function buildHelpContent(): string {
  const sections: Record<string, IKeybind[]> = {
    ...keybindbarConfig,
    ...helpOnlyConfig,
  };

  const lines: string[] = [];
  for (const name of SECTION_ORDER) {
    const binds = sections[name];
    if (!binds || !binds.length) continue;
    if (lines.length) lines.push("");
    lines.push(...renderSection(SECTION_TITLES[name] ?? name, binds));
  }
  return lines.join("\n");
}

let helpBox: any = null;
let previouslyFocused: any = null;

export function toggleHelp() {
  if (helpBox) {
    appInstance.removeScreenElement(helpBox);
    helpBox = null;
    previouslyFocused?.focus();
    previouslyFocused = null;
    appInstance.renderScreen();
    return;
  }

  previouslyFocused = appInstance.screen.focused;

  helpBox = blessed.box({
    top: "center",
    left: "center",
    width: 48,
    height: "80%",
    label: " Keybindings ",
    border: "line",
    tags: true,
    keys: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: " ", style: { bg: "blue" } },
    style: { border: { fg: "cyan" } },
    content: buildHelpContent(),
  });

  appInstance.appendToScreen(helpBox);
  helpBox.focus();
  appInstance.renderScreen();
}
