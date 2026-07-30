import { appInstance } from "@/app";
import { theme } from "@/config/app.config";
import blessed from "neo-blessed";
export function keybindbarPanel() {
  const box = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 3,
    // Must match core/keybindings.ts's KEYBINDBAR_BASE_LABEL — that file
    // overwrites this label with a "[k→<panel>]" hint on Shift+K and
    // resets it back to this exact string when k returns focus.
    label: " keybindbar ",
    tags: true,
    wrap: false,
    border: "line",
    style: {
      border: { fg: theme.border.blur },
      bg: "black",
      label: {},
    },
  });
  box.on("focus", () => {
    box.style.border.fg = theme.border.focus;
    box.screen.render();
  });

  box.on("blur", () => {
    box.style.border.fg = theme.border.blur;
    box.style.bg = theme.header.blurBg;

    box.screen.render();
  });

  return box;
}
