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
    border: "line",
    style: {
      border: { fg: theme.border.blur },
      label: {},
    },
  });

  return box;
}
