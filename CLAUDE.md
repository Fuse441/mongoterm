# CLAUDE.md

Guidance for Claude Code (and future contributors) working in this repository.

This is the single source of truth for architecture/conventions regardless
of which AI tool a contributor uses — `AGENTS.md`, `.cursorrules`, and
`.github/copilot-instructions.md` are thin pointers back to this file, not
separate rule sets. If you rename or move this file, update those three
pointers in the same change; otherwise they need no edits of their own.

## Keeping this file in sync

This file is documentation-as-code: treat an out-of-date section here as a
bug, same severity as an out-of-date type. When a change touches one of the
areas below, update the matching section **in the same change**, not later:

| You changed... | Update... |
|---|---|
| A keybind (added/removed/rebound) | `keybindbar.config.ts` only — the bottom bar and `?` popup regenerate from it automatically. If it's genuinely global/not panel-focus-tied, add it to `helpOnlyConfig` instead. No CLAUDE.md edit needed *unless* it's a new category of binding (see next row). |
| Added a new panel file, or a new top-level `src/` module | "Architecture" section's directory listing below |
| Added/renamed an `EVENTS` entry or changed the emit → handle → repository chain | "Event bus pattern" section |
| Hit a new `neo-blessed` behavior that isn't obvious from the library's own code/docs (crashes, silent no-ops, focus quirks) | "Known `neo-blessed` gotchas" — write the *symptom* first, then the cause, then the fix, so a future search for the symptom finds it |
| Built a new reusable input behavior (validation, suggestions, etc.) on top of `cursorInput.service.ts` | "Reusable input building blocks" section — add it as a one-line pointer, don't duplicate the explanation |
| Changed how panel layout/sizing works | "Known gotchas" #3 (percentage math) — keep the fixed-band numbers (header/footer row counts) accurate |
| Verified something by driving the app (tmux) and learned a navigation/timing quirk that would trip up the next agent | "Verifying TUI changes as an agent" |

If you're not sure whether a change is "big enough" to document: if it cost
you more than one failed attempt to figure out, it's worth a line here so
the next pass doesn't pay that cost again.

## What this is

MongoTerm is a terminal UI (TUI) MongoDB client — a `blessed`/`neo-blessed`
curses-style app, in the spirit of MongoDB Compass but for the terminal.
It connects to a MongoDB instance, browses connections/databases/collections
in a tree, runs queries, and lets you view/insert/edit/delete/duplicate
documents, all with vim-ish keybindings.

- Language: TypeScript (strict mode), compiled to CommonJS.
- UI: [`neo-blessed`](https://github.com/lolengine/neo-blessed) (a maintained
  fork of `blessed`). Both `blessed` and `neo-blessed` are dependencies;
  `neo-blessed` is what's actually imported everywhere (`import blessed from
  "neo-blessed"`) — treat `blessed` as effectively unused/legacy.
- DB driver: official `mongodb` npm package.
- Dev loop: `tsx --watch` for hot-reloading TS directly; `tsc` + `tsc-alias`
  for production builds (path aliases like `@/foo` only resolve at runtime
  via `tsc-alias` rewriting them to relative paths, or via `tsx` at dev time).

## Running it

```bash
npm run dev     # tsx --watch src/app.ts — hot reload, no build step
npm run build   # tsc && tsc-alias -> dist/
npm start        # node dist/src/app.js (after build)
```

There's no automated test suite. Verification is manual: run the app against
a real MongoDB (a local `docker run -p 27017:27017 mongo` works fine) and
drive it. Because it's a full-screen TUI, an agent can't just pipe stdin —
see "Driving the app as an agent" below.

Config/state lives outside the repo at `~/.mongoterm/` (`compass.json` for
saved connections, `app.log` for the app's own logger). `src/config/app.paths.ts`
resolves this via `os.homedir()`. **Never write to a real `~/.mongoterm/`
during testing** — it may contain a user's actual saved connections. Override
`HOME` when launching the process for throwaway test runs instead.

## Architecture

```
src/
  app.ts                 entry point: bootstraps app dir/config, builds
                          MongoTermApp, exports the `appInstance` singleton
  core/
    screen.ts             MongoTermApp — owns the blessed Screen, the panel
                           layout, style, and keybindbar content updates
    keybindings.ts         global (screen-level) key -> action bindings,
                           gated by focus-based `condition()` checks
    eventBus.ts             thin EventEmitter wrapper (EventMongoTerm)
    ui.ts                   MongoTermStyle — theme/plugin styling hookup
  layout/
    main.layout.ts          MognoTermLayout — constructs all panels once
                             and appends them to the screen
  panels/                  one file per UI panel/widget (see below)
  services/
    enum.ts                  EVENTS — every event name used on the event bus
    mongodb/                  MongodbBuilder, EventMongoService (event ->
                               Mongo operation glue), MongodbRepository
                               (actual driver calls), types
    helper.ts                 ~/.mongoterm/compass.json read/write, plus
                               exportConnections/importConnections
                               (Compass-JSON or mongosh-URI-list files,
                               triggered by the tree panel's `x`/`i` keys)
    query.service.ts           query history (save/read ~/.mongoterm_history)
                               — NOT query parsing; that's
                               MongodbRepository.parseQuery (JSON.parse with
                               an ObjectId-detecting reviver)
    cursorInput.service.ts     see "blessed gotchas" / "input building blocks" below
    query/queryOperators.ts     QUERY_OPERATORS — Mongo operator name +
                               description list, single source for the
                               query/shell autocomplete dropdown
  shared/
    state.ts                  IState — in-memory app state (selected
                               connection/db/collection indices, mongoClient,
                               pagination, sort). Not a store with
                               subscriptions — just a mutable object several
                               modules import.
  config/                   theme (app.config.ts) and filesystem paths
                            (app.paths.ts, resolves ~/.mongoterm)
  utils/logger/              file logger (writes to ~/.mongoterm/app.log)
```

### Panel structure

Each panel is a factory function (`workspacePanel()`, `queryInput()`, etc.)
that builds and returns a `neo-blessed` widget, wires its own `key()`/`on()`
handlers, and is appended to the screen once by `MognoTermLayout`
(`src/layout/main.layout.ts`). There's no component re-render cycle — panels
mutate their own blessed widget directly (`box.setContent(...)`,
`table.setData(...)`, `list.setItems(...)`) and call
`appInstance.renderScreen()` to flush.

- `tree/tree.panel.ts` — generic collapsible tree widget (connections ->
  databases -> collections). `tree/tree.event.ts` wires it to actual Mongo
  calls and CRUD dialogs.
- `workspace.panel.ts` — the main content pane; hosts the rendered record
  list (`result.panel.ts` builds one `box` per document inside it).
- `query.panel.ts` — the query input textbox.
- `modal.panel.ts` — record editor (table of field/value/type rows, with
  type-cycling via left/right), delete/duplicate confirm dialogs, and
  `promptInline` (exported — reused by `workspace.panel.ts`'s sort/page-size
  prompts, and could be reused by anything else that needs a quick one-line
  text prompt) used by the editor's "add field"/"edit value" actions.
- `query/queryAutocomplete.panel.ts` — `attachQueryAutocomplete(box)`, the
  `$operator` suggestion dropdown. Not tied to the query box specifically —
  it's wired via `cursorInput.service.ts`'s `onKey`/`onChange` hooks, so
  anything using `installCursorSupport` can attach it (used by both
  `query.panel.ts` and `shell.panel.ts`).
- `shell.panel.ts` — the `:` "query shell" modal: a larger, focus-anywhere
  textbox for composing a query filter, with the same autocomplete/
  validation as the query box. Mirrors its value into the query box and
  runs it via `EVENTS.QUERY_SEND` on submit; doesn't execute arbitrary
  JS/shell commands — it's a bigger JSON-filter input, not a real mongosh.
- `keybingbar/` (sic — typo in the directory name, intentionally left as-is
  to match the existing import paths) — the bottom status bar. `keybindbar.config.ts`
  is the **single source of truth** for every context-specific keybind in the
  app (see below), including `helpOnlyConfig` for non-panel-focus keys
  (global keys, the record editor's keys, and the autocomplete controls).
- `help.panel.ts` — the `?` popup; generated from the same config as the
  keybindbar, not hand-maintained separately. Always restores focus to
  whatever was focused before opening (see gotcha #5) — don't remove that.
- `monitor.panel.ts` — a small floating CPU/RAM HUD (dev/debug aid).

### Event bus pattern

Panels don't call Mongo directly for anything beyond simple reads through
`state`. Mutations go through `appInstance.eventBus`:

1. A panel emits an event from `EVENTS` (`src/services/enum.ts`), e.g.
   `eventBus.emit(EVENTS.RECORD_UPDATE, { updated, query })`.
2. `src/services/mongodb/mongodb.events.ts` (`EventMongoService`) has the
   corresponding `eventBus.on(EVENTS.RECORD_UPDATE, async (...) => {...})`
   handler, which calls into `MongodbRepository` for the actual driver call,
   then emits a follow-up event (commonly `QUERY_SEND` to refresh results,
   or `TOAST_SHOW` for user feedback).

When adding a new mutation, follow this pattern rather than calling the
repository directly from a panel: add the event name to `EVENTS`, emit it
from the panel, handle it in `mongodb.events.ts`, implement the Mongo call
in `mongodb.repository.ts`.

**Event handlers in `mongodb.events.ts` are `async` with no surrounding
try/catch, and Node terminates the process on an unhandled rejection.**
`MongodbRepository.fetchQuery` guards against no database/collection being
selected yet (returns empty results instead of calling
`.db(undefined).collection(undefined)`, which threw and crashed the whole
app — a real bug hit while testing the query box before any collection was
selected). Any new repository method reachable before a collection/db is
guaranteed selected needs the same guard; don't assume the UI always
prevents that state.

### Keybindings — two layers, don't confuse them

1. **Global/screen-level** (`src/core/keybindings.ts`): bound once on
   `appInstance.screen`, dispatched based on `condition()` (usually a check
   against `appInstance.screen.focused`). Used for cross-panel navigation
   (e.g. `h`/`left` moves focus from workspace to tree).
2. **Per-widget** (`widget.key([...], handler)` inside a panel factory):
   bound directly on that blessed element, only fires while that exact
   element has focus.

**Exact dispatch order** (`Screen.prototype._listenKeys`,
`node_modules/neo-blessed/lib/widgets/screen.js`): on every raw keypress,
`focused` is captured *once* at the top, then, per event:
1. `screen.emit('keypress', ch, key)` — raw listeners on the screen (rare).
2. `screen.emit('key '+key.full, ch, key)` — this is what
   `appInstance.screen.key([...])` (global bindings in `keybindings.ts`)
   actually listens on. Steps 1–2 are skipped while `screen.grabKeys` is true
   (i.e. while a focused `Textbox`/`Textarea` is mid-`readInput()`).
3. `focused.emit('keypress', ch, key)` — raw `.on('keypress', ...)`
   listeners on the focused element (e.g. `cursorInput.service.ts`'s
   `_listener`, or `List`'s internal up/down/enter handling).
4. `focused.emit('key '+key.full, ch, key)` — `element.key([...])`
   bindings (`Element.prototype.key` delegates to
   `program.key.apply(element, ...)`, which registers on `'key <full>'` —
   **not** `'keypress'`; don't assume `.key()` and `.on('keypress')` share
   a dispatch path). Always fires, using the *same* `focused` captured at
   the top — **even if step 2's global handler just changed
   `screen.focused`**. So a key can legitimately do two unrelated things:
   the global handler acts on the old focus, and the widget's own `.key()`
   binding also fires on that same old-focus widget. This is real,
   observed behavior (e.g. pressing `l` on the tree simultaneously expands
   the selected node *and* moves focus to the workspace) — don't "fix" it
   as a bug unless asked; do account for it when reasoning about a
   keypress's effects.

`key.full` is `(ctrl?'C-':'') + (meta?'M-':'') + (shift&&name?'S-':'') + name`
(`program.js`) — e.g. capital `S` while typing is reported as
`{ name: 's', shift: true, full: 'S-s' }`, so bind it as `.key(["S-s"])`,
not `.key(["S"])`.

Neither dispatch layer can "consume" an event to stop the other from
firing — avoid binding the same key at both layers with conflicting effects
for the same focus state, since both will run.

**`keybindbar.config.ts` is the single source of truth for user-facing
keybind descriptions.** It drives:
- The bottom keybindbar (`appInstance.setKeybindbarContent(id)`, called from
  each panel's `focus` handler).
- The `?` help popup (`help.panel.ts` renders sections from
  `keybindbarConfig` + `helpOnlyConfig`, the latter for bindings not tied to
  a specific panel focus — global keys like `?`/quit, and the record editor's
  keys which apply inside a modal rather than a focus-tracked panel).

When adding or changing a keybind, edit `keybindbar.config.ts` (or
`helpOnlyConfig` in the same file) — do not hand-edit `help.panel.ts`'s
content; it's generated.

## Known `neo-blessed` gotchas (read before touching input widgets)

These bit us once already; the fixes are in place, but the underlying
library limitations are permanent and will resurface if new code re-triggers
them.

1. **`Textbox`/`Textarea` never implemented arrow-key cursor movement.**
   `node_modules/neo-blessed/lib/widgets/textarea.js` `_listener` has a
   literal `// TODO: Handle directional keys.` stub — left/right/up/down are
   no-ops, and the built-in editing always inserts/deletes at the *end* of
   the value, never at a cursor position. `src/services/cursorInput.service.ts`
   (`installCursorSupport(box)`) fixes this by replacing the *instance's*
   `_listener`/`_updateCursor` with cursor-aware versions. Call it right
   after creating a `blessed.textbox(...)`, **before** the box can start
   reading input (before `.focus()` if using `inputOnFocus`, before an
   explicit `.readInput()` otherwise). Any new free-text input box should
   use this helper rather than relying on stock blessed behavior.

2. **Don't combine `inputOnFocus: true` with an explicit `.readInput(callback)`
   call.** `Textarea.prototype.readInput` guards against re-entrancy with
   `if (this._reading) return;`. If `inputOnFocus` is set, focusing the box
   auto-starts a read with no callback; a subsequent manual
   `.readInput(callback)` call is then a silent no-op and **your callback is
   never invoked** — this was a real, previously-shipped bug in the record
   editor's "add field"/"edit value" prompts (Enter appeared to do nothing).
   Pick one: either set `inputOnFocus: true` and pass the callback to the
   `'submit'`/`'action'` event instead, or omit `inputOnFocus` and drive
   `.focus()` + `.readInput(callback)` yourself. This codebase uses the
   latter (see `promptInline` in `modal.panel.ts`).

3. **Percentage-based layout math must account for every fixed-height band.**
   Blessed re-flows `%`/`"N%-M"` dimensions automatically on terminal
   resize (no manual resize handling needed), but percentages don't
   automatically know about sibling panels. If the keybindbar is `height: 3`
   (fixed rows) at the bottom, every panel that fills the rest of the screen
   needs `height: "100%-3"`, not an independently-chosen percentage — two
   panels each picking "roughly the right percentage" will drift and overlap
   as the terminal size changes. Keep a single set of fixed-size bands
   (header row count, footer row count) and derive everything else from
   `"100%-N"` against those, rather than hand-tuning percentages per panel.

4. **`options.parent` auto-appends.** Any blessed widget created with
   `parent: someElement` is automatically appended to `someElement` inside
   the `Node` constructor (`node.js`: `if (this.parent) this.parent.append(this)`).
   You don't need (and shouldn't do) a separate `appInstance.appendToScreen(child)`
   call for such widgets — only append the top-level container.

5. **A `Textbox`/`Textarea` with `keys: true` but *no* `inputOnFocus` and no
   immediate `.readInput()` call will hijack the `e` key to spawn an
   external `$EDITOR` subprocess.** `textarea.js`'s constructor installs
   this as a fallback: `if (!options.inputOnFocus && options.keys) { this.on('keypress', (ch,key) => { if (self._reading) return; if (key.name==='e') return self.readEditor(); }) }`.
   If you build a text input and forget `inputOnFocus: true` (or an
   immediate `.readInput()`, like `promptInline` does), typing any word
   containing "e" silently drops you into vim/nano mid-app — and returning
   from it can crash the process (`_getCoords()` throwing on a
   mid-transition element; see the next point). Every free-text input in
   this codebase sets `inputOnFocus: true` (query box, shell modal) or
   calls `.readInput()` itself right after creation (`promptInline`) —
   follow one of those two patterns, never neither.

6. **`_getCoords()` (used by `_updateCursor`) can throw, not just return
   null**, if the element or an ancestor is mid-detach (e.g. right after
   `screen.readEditor()` returns and hands control back). `cursorInput.service.ts`'s
   `_updateCursor` wraps the `_getCoords()` call in try/catch for this
   reason — don't remove that guard, and add the same guard if you write
   another custom `_updateCursor`.

7. **Removing an overlay only removes the elements you explicitly pass to
   `removeScreenElement`.** Removing just the top-level overlay box can
   leave a stale "ghost" render of its children on screen (a smartCSR
   diffing artifact) even though they're logically gone and focus has
   moved on — this was a real bug in `shell.panel.ts`'s close path.
   `modal.panel.ts`'s `closeEditor()`/`closeDialogConfirm()` and
   `shell.panel.ts`'s `closeShell()` both explicitly remove every
   direct child in addition to the overlay; do the same in any new modal.

## Reusable input building blocks

`cursorInput.service.ts`'s `installCursorSupport(box, options)` is meant to
be composed, not just a one-off cursor fix:
- `options.onChange?(value, cursorPos)` fires after every value mutation —
  use it for live validation (see `query.panel.ts`'s red-border-on-invalid-
  JSON) or to drive suggestions.
- `options.onKey?(ch, key) => boolean` runs *before* default key handling;
  return `true` to fully take over that keypress (skip cursor movement,
  insertion, enter/escape — everything). Compose multiple concerns by
  building one combined `onKey` that tries each concern in order and
  returns as soon as one claims the key (see `query.panel.ts`/`shell.panel.ts`
  passing `autocomplete.onKey` straight through, since it already returns
  `undefined` when it has nothing to do).
- `box.getCursorPos()` / `box.setCursorPos(n)` / `box.replaceValue(newValue, newCursorPos)`
  are added to the box instance for external code (like autocomplete) to
  read/mutate state consistently through the same `onChange`/render path
  instead of poking `box.value` directly.

`query/queryAutocomplete.panel.ts`'s `attachQueryAutocomplete(box)` is the
reference example: it returns `{ onChange, onKey, destroy }` meant to be
wired straight into `installCursorSupport`'s options (composing its `onKey`
with any of the box's own key handling), and is reused as-is by both the
query box and the shell modal — do this rather than duplicating dropdown
logic if a third place ever needs operator suggestions.

## Verifying TUI changes as an agent

There's no test suite, so "does it actually work" means driving the running
app. `tmux` + `capture-pane` is the way to do this headlessly:

```bash
tmux new-session -d -s mterm -x 160 -y 45 "npm run dev"
tmux send-keys -t mterm 'l'          # simulate a keypress
tmux capture-pane -t mterm -p        # read the rendered screen as text
tmux kill-session -t mterm
```

- Use a scratch `HOME` (`env HOME=/some/scratch/dir npm run dev`) so the app
  reads/writes a throwaway `~/.mongoterm/` instead of the real user config.
- Arrow/ctrl keys: `tmux send-keys -t mterm 'Left'`, `'C-s'`, `'Enter'`, etc.
- Give async operations (Mongo connects, tree expansion, query fetches) real
  time to complete before capturing — a fixed `sleep` of a few hundred ms to
  ~1s is usually enough; poll `capture-pane` in a loop if timing is unclear.
- Remember the dual-dispatch behavior from the keybindings section above:
  a key can trigger both a global handler (which may move focus) and the
  previously-focused widget's own handler in the same keypress, in that
  order — don't assume `send-keys` output is where you'd expect if you
  changed focus mid-sequence. Concretely: pressing `l`/`right` while the
  tree is focused *both* expands/toggles the selected tree node *and*
  moves focus to the workspace, in one keypress.
- Submitting or cancelling a `Textbox` with `inputOnFocus: true` calls
  blessed's `rewindFocus()`, which pops back to whatever was focused right
  before `.focus()` was called on it — but only if `saveFocus()` actually
  ran, which it skips if the box was already `screen.focused` at the start
  of `readInput()` (true if you call `.focus()` yourself right before
  `inputOnFocus` triggers the read). Don't rely on it silently doing the
  right thing; panels in this codebase that need reliable focus-on-close
  set it explicitly (e.g. `closeShell()`, `closeEditor()`).
- `tsx --watch` restarts the whole process (and re-seeds tree state) on
  every source file save — if you're mid manual-verification and edit a
  file again, re-navigate from scratch rather than assuming prior
  navigation/selection state survived.
- For a throwaway Mongo to test against, `docker run -p 27017:27017 mongo`
  (or reuse a running one via `docker exec <container> mongosh ...`) is
  enough; seed one `insertOne` so there's a document to open the editor on.
  `tmux` isn't preinstalled in every environment — `brew install tmux` if
  `tmux: command not found`.
- When a UI change doesn't seem to work, capture the **full** pane
  (`tmux capture-pane -t mterm -p` with no `sed`/`head` truncation) before
  concluding something is broken — modals are `top: "center"`, so they
  render well below the first few rows and a truncated capture makes a
  perfectly-working popup look like a no-op.

## Conventions observed in the codebase

- `theme` (`src/config/app.config.ts`) centralizes border/label colors;
  panels reference `theme.border.focus` / `theme.border.blur` in their
  `focus`/`blur` handlers rather than hardcoding colors.
- `logger` (`src/utils/logger/logger.service.ts`) writes structured
  `{ message, ...context }` objects to `~/.mongoterm/app.log` — prefer this
  over `console.log` for anything beyond a quick local debug print (and
  remove debug `console.log`/scratch scripts before committing).
- Widgets are typed loosely (`any` shows up a lot for blessed elements,
  since `@types/blessed` doesn't fully match `neo-blessed`'s API surface).
  Match the existing style rather than fighting the types — `noImplicitAny`
  is on, but blessed interop leans on explicit `any`.
- Path imports use the `@/` alias (`@/app.js`, `@/services/enum.js`, etc.)
  mapped to `src/*` — note the `.js` extension on the *source* `.ts` imports;
  this is required for `tsx`'s ESM-ish resolution even though the files are
  `.ts`. Keep using `.js` suffixes on new `@/`-prefixed imports for
  consistency with existing code.
