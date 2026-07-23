import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { theme } from "@/config/app.config.js";
import { EVENTS } from "@/services/enum.js";
import { installCursorSupport } from "@/services/cursorInput.service.js";
import { attachQueryAutocomplete } from "@/panels/query/queryAutocomplete.panel.js";
import { isValidQuerySyntax } from "@/panels/query.panel.js";

/*
|--------------------------------------------------------------------------
| QUERY SHELL MODAL
|--------------------------------------------------------------------------
| A larger, focus-anywhere entry point for composing a query filter — same
| operator autocomplete and invalid-JSON highlighting as the query box (see
| queryAutocomplete.panel.ts / cursorInput.service.ts), opened via the `:`
| hotkey (src/core/keybindings.ts) so it isn't tied to any one panel's
| focus. Runs the query the same way the query box does (EVENTS.QUERY_SEND)
| and mirrors the entered text back into the query box for consistency.
*/

const INVALID_COLOR = "red";

let shellInstance: { overlay: any; input: any; destroyAutocomplete: () => void } | null = null;

export function toggleShell() {
  if (shellInstance) {
    closeShell();
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

  const input: any = blessed.textbox({
    parent: overlay,
    top: "center",
    left: "center",
    width: "70%",
    height: 5,
    label: " Shell — query filter, Enter to run, Esc to close ",
    border: "line",
    tags: true,
    inputOnFocus: true,
    keys: true,
    mouse: true,
    value: appInstance.ui.panels.query?.getContent() ?? "",
    style: { border: { fg: theme.border.blur } },
  });

  const autocomplete = attachQueryAutocomplete(input);

  function setBorderColor(color: string) {
    input.style.border.fg = color;
    appInstance.renderScreen();
  }

  installCursorSupport(input, {
    onKey: autocomplete.onKey,
    onChange: (value: string) => {
      autocomplete.onChange(value, input.getCursorPos());
      setBorderColor(isValidQuerySyntax(value) ? theme.border.focus : INVALID_COLOR);
    },
  });

  input.key(["escape"], () => closeShell());

  input.on("submit", (value: string) => {
    if (!isValidQuerySyntax(value)) {
      setBorderColor(INVALID_COLOR);
      return;
    }
    (appInstance.ui.panels.query as any)?.setValue(value);
    appInstance.eventBus.emit(EVENTS.QUERY_SEND, value);
    closeShell();
  });

  appInstance.appendToScreen(overlay);
  input.focus();
  appInstance.renderScreen();

  shellInstance = { overlay, input, destroyAutocomplete: autocomplete.destroy };
}

function closeShell() {
  if (!shellInstance) return;
  shellInstance.destroyAutocomplete();
  appInstance.removeScreenElement(shellInstance.input);
  appInstance.removeScreenElement(shellInstance.overlay);
  shellInstance = null;
  appInstance.ui.panels.workspace?.focus();
  appInstance.renderScreen();
}
