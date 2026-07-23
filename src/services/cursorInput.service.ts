/*
|--------------------------------------------------------------------------
| CURSOR-AWARE SINGLE-LINE INPUT
|--------------------------------------------------------------------------
| neo-blessed's Textbox/Textarea never implemented left/right/home/end
| cursor movement (see node_modules/neo-blessed/lib/widgets/textarea.js,
| `_listener` — the arrow-key branch is a literal empty TODO stub), and
| always inserts/deletes at the end of `value`. This installs a real
| cursor position on a single-line blessed Textbox instance by replacing
| its `_listener`/`_updateCursor` (instance-level, so it doesn't touch
| the shared prototype) with cursor-aware versions before the box starts
| reading input.
|
| `onKey` lets a caller (e.g. autocomplete) intercept a keypress before the
| default cursor/edit handling runs — return true to fully take over that
| keypress (the box's own enter/escape/insert/etc. logic is skipped for it).
| `onChange` fires after any value mutation, for live validation/suggestions.
*/

export interface CursorInputOptions {
  onChange?: (value: string, cursorPos: number) => void;
  onKey?: (ch: any, key: any) => boolean | void;
}

const CONTROL_CHAR = /^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/;

export function installCursorSupport(box: any, options: CursorInputOptions = {}) {
  let cursorPos = (box.value || "").length;

  const clamp = (pos: number) => Math.max(0, Math.min(pos, box.value.length));

  box.on("focus", () => {
    cursorPos = box.value.length;
  });

  box.getCursorPos = () => cursorPos;
  box.setCursorPos = (pos: number) => {
    cursorPos = clamp(pos);
    box._updateCursor();
  };

  // For callers (e.g. autocomplete accept) that need to replace the value
  // and cursor position together, going through the same onChange/render path.
  box.replaceValue = function (newValue: string, newCursorPos: number) {
    this.value = newValue;
    cursorPos = clamp(newCursorPos);
    this.setValue(newValue);
    options.onChange?.(this.value, cursorPos);
    this.screen.render();
  };

  box._updateCursor = function (get?: boolean) {
    if (this.screen.focused !== this) return;

    // _getCoords() can throw if the element (or an ancestor) has been
    // detached mid-render, e.g. right after returning from blessed's
    // external $EDITOR excursion (readEditor). Bail out quietly rather
    // than crashing the whole app over a cursor-position update.
    let lpos;
    try {
      lpos = get ? this.lpos : this._getCoords();
    } catch {
      return;
    }
    if (!lpos) return;

    const program = this.screen.program;
    const cy = lpos.yi + this.itop;
    const cx = lpos.xi + this.ileft + this.strWidth(this.value.slice(0, cursorPos));

    if (cy === program.y && cx === program.x) return;

    if (cy === program.y) {
      if (cx > program.x) program.cuf(cx - program.x);
      else if (cx < program.x) program.cub(program.x - cx);
    } else if (cx === program.x) {
      if (cy > program.y) program.cud(cy - program.y);
      else if (cy < program.y) program.cuu(program.y - cy);
    } else {
      program.cup(cy, cx);
    }
  };

  box._listener = function (ch: any, key: any) {
    if (options.onKey && options.onKey(ch, key)) {
      return;
    }

    const done = this._done;
    const value = this.value;

    if (key.name === "enter" || key.name === "return") {
      done(null, this.value);
      return;
    }

    if (key.name === "escape") {
      done(null, null);
      return;
    }

    switch (key.name) {
      case "left":
        cursorPos = clamp(cursorPos - 1);
        break;
      case "right":
        cursorPos = clamp(cursorPos + 1);
        break;
      case "home":
        cursorPos = 0;
        break;
      case "end":
        cursorPos = value.length;
        break;
      case "tab":
        // No use for literal tabs in a query/value string; autocomplete
        // (via onKey above) is the only thing that should react to tab.
        break;
      case "backspace":
        if (cursorPos > 0) {
          this.value = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          cursorPos -= 1;
        }
        break;
      case "delete":
        if (cursorPos < value.length) {
          this.value = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
        }
        break;
      default:
        if (ch && !key.ctrl && !key.meta && !CONTROL_CHAR.test(ch)) {
          this.value = value.slice(0, cursorPos) + ch + value.slice(cursorPos);
          cursorPos += 1;
        }
        break;
    }

    if (this.value !== value) {
      this.setValue(this.value);
      options.onChange?.(this.value, cursorPos);
      this.screen.render();
    } else {
      this._updateCursor();
      this.screen.render();
    }
  };
}
