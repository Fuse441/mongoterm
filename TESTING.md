# Testing Guide: Connection Color-Coding & Color Picker

## Feature Overview

This document describes how to test the new connection color-coding feature with the color picker modal.

### What Was Implemented

1. **Connection Color Persistence** — Save/load color with each connection
2. **Color Picker Modal** — Grid-based visual selector (4 columns)
3. **Dynamic Keybindbar** — Shows context-aware controls during color picking
4. **Connection Grouping** — Sort connections by group tag

---

## Setup for Testing

### 1. Start the App

```bash
cd /Users/thanos/Projects/mongoterm
npm run dev
```

### 2. Add a Test Connection

Press `Ctrl+E` to create a new connection:
- Name: `test-connection-1`
- URI: `mongodb://localhost:27017`
- Group: (leave empty for now)

Press `Enter` to submit.

### 3. Verify Connection Appears in Tree

You should see `test-connection-1` in the left panel (connection tree).

---

## Test Case 1: Open Color Picker Modal

### Steps:

1. Navigate to the connection node in the tree (use `j/k` to navigate)
2. Highlight the connection you created: `test-connection-1`
3. Press **Shift+C** (uppercase C)

### Expected Result:

- A color picker modal should appear in the center of the screen
- Modal title: `Select Color`
- Grid layout showing 7 colors: white, cyan, green, yellow, magenta, red, blue
- Each color button shows the color name
- Border of keybindbar should update to show color picker controls:
  - `[↑/k] - up  [↓/j] - down  [←/h] - left  [→/l] - right  [enter] - select  [esc] - cancel`

### If It Fails:

**Error:** `TypeError: appInstance.setCustomKeybindbar is not a function`
- Solution: Restart the app (`Ctrl+C`, then `npm run dev` again)
- The screen.ts file must be recompiled

**Error:** Modal doesn't appear
- Check browser/terminal console for errors
- Verify `/Users/thanos/Projects/mongoterm/src/panels/color-picker.panel.ts` exists
- Verify tree.event.ts has `import { openColorPicker }` at the top

---

## Test Case 2: Navigate Color Grid with Keyboard

### Steps:

1. With color picker open, press **j** (or down arrow)
   - Selection should move down one row (4 colors)

2. Press **k** (or up arrow)
   - Selection should move up one row

3. Press **l** (or right arrow)
   - Selection should move right one column

4. Press **h** (or left arrow)
   - Selection should move left one column

5. Try pressing **j** many times to see bounds checking
   - Selection should not go past the last color

### Expected Behavior:

- Selected color has a **green border**
- Unselected colors have a **gray border**
- Cannot navigate past grid boundaries
- Selection wraps correctly (edge cases handled)

---

## Test Case 3: Select a Color

### Steps:

1. Navigate to the **green** color in the grid
2. Press **Enter**

### Expected Result:

- Color picker modal **closes immediately**
- Connection node in tree should now show in **green color** instead of white
- Keybindbar **restores** to tree controls:
  - `[l] - workspace  [ctrl+e] - new connection/database/collection  [e] - edit connection  [Shift+c] - pick connection color  [d] - delete/drop selected  [x] - export connection(s)  [i] - import connections  [j k] - navigate  [enter] - expand/collapse`

### If Color Doesn't Update:

1. Check logs: `tail -f ~/.mongoterm/app.log`
2. Look for `CONNECTION_UPDATE` event
3. Verify the connection was actually saved:
   - Check `~/.mongoterm/compass.json` file
   - The connection object should have `"color": "green"` in the `favorite` object

---

## Test Case 4: Cancel Color Picker

### Steps:

1. Open color picker again with **Shift+C**
2. Press **Escape** key
3. Do NOT select any color

### Expected Result:

- Modal closes
- Connection color **remains unchanged** (doesn't update)
- Keybindbar restores to tree controls
- No error in console

---

## Test Case 5: Edit Connection with Existing Color

### Steps:

1. Select the colored connection (`test-connection-1`)
2. Press **e** (edit connection)
3. Form should open with three fields:
   - connectionName: `test-connection-1`
   - connectionString: `mongodb://localhost:27017`
   - group: (empty)
4. Press **Escape** to cancel

### Expected Result:

- Connection form opens correctly
- Form can be closed with Escape
- Connection color is **preserved** (not lost when editing)

---

## Test Case 6: Export/Import Connection with Color

### Steps:

1. Select the colored connection
2. Press **x** (export)
3. Enter path: `/tmp/test-connection.json`
4. Check the exported file

### Expected Result:

```bash
cat /tmp/test-connection.json
```

Should show:
```json
{
  "connections": [
    {
      "id": "...",
      "favorite": {
        "name": "test-connection-1",
        "color": "green",
        "group": null
      },
      "connectionOptions": {
        "connectionString": "mongodb://localhost:27017"
      },
      "savedConnectionType": "recent"
    }
  ]
}
```

Color field should be present and set to the selected color.

---

## Test Case 7: Connection Grouping

### Steps:

1. Create a second connection:
   - Press **Ctrl+E**
   - Name: `test-connection-2`
   - URI: `mongodb://localhost:27017`
   - Group: `production`

2. Create a third connection:
   - Name: `test-connection-3`
   - URI: `mongodb://localhost:27017`
   - Group: `development`

### Expected Result:

Connections should be sorted in tree by group:
```
(ungrouped connections appear first)
test-connection-1

(then grouped connections alphabetically)
development
  test-connection-3
production
  test-connection-2
```

Actually, grouping is stored but tree rendering doesn't show hierarchy yet.
Check `~/.mongoterm/compass.json` to verify `group` field is saved.

---

## Test Case 8: Mouse Support (Optional)

### Steps:

1. Open color picker modal with **Shift+C**
2. Click on the **cyan** color button with mouse
3. Try scrolling keybindbar with mouse wheel

### Expected Result:

- Clicking color should select it and close modal
- Mouse wheel should scroll keybindbar if content is too long

---

## Debugging Commands

### View Connection Configuration

```bash
cat ~/.mongoterm/compass.json | jq '.connections[0].favorite'
```

Should output color field if color was saved.

### Check App Logs

```bash
tail -f ~/.mongoterm/app.log
```

Look for:
- `"message": "Opening color picker"`
- `"message": "Color selected"`
- `"message": "CONNECTION_UPDATE"`

### Verify Files Exist

```bash
ls -l /Users/thanos/Projects/mongoterm/src/panels/color-picker.panel.ts
ls -l /Users/thanos/Projects/mongoterm/src/core/screen.ts
```

Both files must exist.

### Check TypeScript Compilation

If running `npm run dev` doesn't show changes:

```bash
npm run build
```

Then restart the app.

---

## Known Issues & Limitations

1. **Grouping UI** — Groups are saved but not rendered hierarchically in tree yet
2. **Color sync** — If connection color is updated while modal is open, it won't reflect until tree re-renders
3. **Mobile/Small terminals** — Color picker grid may not fit if terminal is < 50 chars wide

---

## Rollback Testing

If something goes wrong, revert to previous commit:

```bash
git checkout HEAD~1
npm run dev
```

The feature branch before color picker fix:
```bash
git checkout 6a42ba1  # Original feature commit
npm run dev
```

---

## Success Criteria

All tests should pass:

- [ ] Color picker opens with Shift+C
- [ ] Grid shows all 7 colors
- [ ] Keyboard navigation works (j/k/h/l)
- [ ] Selection indicates with green border
- [ ] Pressing Enter selects color and closes
- [ ] Pressing Escape cancels without changing
- [ ] Color persists in config file
- [ ] Color appears in tree view
- [ ] Export/import preserves color field
- [ ] Connection form doesn't break color
- [ ] Keybindbar updates dynamically
- [ ] No TypeError errors in console

