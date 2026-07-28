import { appInstance } from "@/app";
import { theme } from "@/config/app.config";
import blessed from "neo-blessed";
export function keybindbarPanel() {
  const box = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 3,
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
