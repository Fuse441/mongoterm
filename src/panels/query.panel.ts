import _blessed from "neo-blessed";

const blessed /** @type {typeof import('blessed')} */ =
  /** @type {any} */ _blessed;
import { MongoTermApp } from "@/core/screen.js";
import { theme } from "../config/app.config.js";
import { historyPanel } from "./history.panel.js";
import { appInstance } from "@/app.js";
import { eventBus } from "@/core/eventBus.js";
import { EVENTS } from "@/services/enum.js";

export const queryInput = () => {
  const query = blessed.textbox({
    top: 0,
    left: 47,
    width: "75%",
    height: 3,
    label: " Query ",
    border: "line",
    inputOnFocus: true,
    vi: false,
    keys: true,
    mouse: true,
    style: {
      border: { fg: theme.border.blur },
      focus: { border: {} },
    },
  });

  query.on("submit", () => {
    eventBus.emit(EVENTS.QUERY_SEND, query.getValue() || {});
  });

  //open box history
  query.key(["C-o"], () => {
    query.cancel();
    appInstance.renderScreen();
    appInstance.appendToScreen(historyPanel());
  });
  return query;
};
