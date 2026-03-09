import blessed from "neo-blessed";
import { theme } from "../config/app.config.js";

export const workspacePanel = () => {
  const box = blessed.box({
    top: 3,
    left: "25%",
    width: "75%",
    height: "95%",
    label: " Workspace ",
    border: "line",
    tags: true,
    style: {
      border: { fg: theme.border.blur },
      label: {},
    },
  });
  return box;
};
