import blessed from "neo-blessed";
import { appInstance } from "@/app.js";
import { findQueryOperators, IQueryOperator } from "@/services/query/queryOperators.js";

/*
|--------------------------------------------------------------------------
| QUERY OPERATOR AUTOCOMPLETE
|--------------------------------------------------------------------------
| Attaches a `$operator` suggestion dropdown to a cursor-aware textbox (see
| cursorInput.service.ts). Wire the returned `onChange`/`onKey` into
| installCursorSupport's options. Reused by both the query box and the
| shell modal so they behave identically.
*/

function wordAtCursor(value: string, cursorPos: number): { word: string; start: number } {
  let start = cursorPos;
  while (start > 0 && /[$a-zA-Z]/.test(value[start - 1])) start--;
  return { word: value.slice(start, cursorPos), start };
}

const MAX_VISIBLE = 8;

export function attachQueryAutocomplete(box: any /* cursor-aware blessed.Textbox, see cursorInput.service.ts */) {
  let suggestBox: any = null;
  let matches: IQueryOperator[] = [];
  let selected = 0;
  let wordStart = 0;

  function hide() {
    if (!suggestBox) return;
    appInstance.removeScreenElement(suggestBox);
    suggestBox = null;
    appInstance.renderScreen();
  }

  function render() {
    const items = matches.map(
      (m) => `{bold}${m.op}{/bold} {grey-fg}${m.description}{/grey-fg}`,
    );

    if (!suggestBox) {
      // Use the box's rendered absolute coordinates rather than its raw
      // top/left options — those can be non-numeric ("center", "25%"),
      // which breaks positioning for anything but the plain query box.
      const coords = box._getCoords?.();
      const top = coords ? coords.yl : (box.top as number) || 0;
      const left = coords ? coords.xi : box.left;

      suggestBox = blessed.list({
        top,
        left,
        width: 64,
        height: Math.min(matches.length, MAX_VISIBLE) + 2,
        border: "line",
        label: " operators ",
        tags: true,
        style: {
          border: { fg: "yellow" },
          selected: { bg: "yellow", fg: "black" },
        },
      });
      appInstance.appendToScreen(suggestBox);
    }

    suggestBox.height = Math.min(matches.length, MAX_VISIBLE) + 2;
    suggestBox.setItems(items);
    suggestBox.select(selected);
    appInstance.renderScreen();
  }

  function refresh(value: string, cursorPos: number) {
    const { word, start } = wordAtCursor(value, cursorPos);
    wordStart = start;

    if (!word.startsWith("$") || word.length < 1) {
      matches = [];
      hide();
      return;
    }

    matches = findQueryOperators(word);
    selected = 0;

    if (matches.length) render();
    else hide();
  }

  function accept() {
    if (!matches.length) return;
    const op = matches[selected].op;
    const cursorPos: number = box.getCursorPos();
    const value: string = box.value;
    const newValue = value.slice(0, wordStart) + op + value.slice(cursorPos);
    hide();
    box.replaceValue(newValue, wordStart + op.length);
  }

  function onKey(_ch: any, key: any): boolean | void {
    if (!suggestBox) return;

    switch (key.name) {
      case "down":
        selected = Math.min(selected + 1, matches.length - 1);
        render();
        return true;
      case "up":
        selected = Math.max(selected - 1, 0);
        render();
        return true;
      case "tab":
      case "enter":
      case "return":
        accept();
        return true;
      case "escape":
        hide();
        return true;
      default:
        return false;
    }
  }

  box.on("blur", hide);

  return {
    onChange: (value: string, cursorPos: number) => refresh(value, cursorPos),
    onKey,
    destroy: hide,
  };
}
