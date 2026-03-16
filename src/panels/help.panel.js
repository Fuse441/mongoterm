import _blessed from "neo-blessed";
const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);

import { screen } from "../core/screen.js";

const HELP_CONTENT = [
  " {bold}Navigation{/bold}",
  " {cyan-fg}l / →{/cyan-fg}    move right",
  " {cyan-fg}h / ←{/cyan-fg}    move left",
  " {cyan-fg}k / ↑{/cyan-fg}    move up",
  " {cyan-fg}j / ↓{/cyan-fg}    move down",
  "",
  " {bold}Record{/bold}",
  " {cyan-fg}e{/cyan-fg}        edit record",
  " {cyan-fg}c{/cyan-fg}        copy record",
  " {cyan-fg}d{/cyan-fg}        delete record",
  "",
  " {bold}Global{/bold}",
  " {cyan-fg}?{/cyan-fg}        toggle help",
  " {cyan-fg}q / C-c{/cyan-fg}  quit",
].join("\n");

let helpBox = null;

export function toggleHelp() {
  if (helpBox) {
    screen.remove(helpBox);
    helpBox = null;
    screen.render();
    return;
  }

  helpBox = blessed.box({
    top: "center",
    left: "center",
    width: 40,
    height: 20,
    label: " Keybindings ",
    border: "line",
    tags: true,
    keys: true,
    style: { border: { fg: "cyan" } },
    content: HELP_CONTENT,
  });

  screen.append(helpBox);
  helpBox.focus();
  screen.render();
}
