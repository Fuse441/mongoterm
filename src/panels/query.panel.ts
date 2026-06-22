import _blessed from "neo-blessed";

const blessed /** @type {typeof import('blessed')} */ =
  /** @type {any} */ _blessed;
import { MongoTermApp } from "@/core/screen.js";
import { theme } from "../config/app.config.js";
import { historyPanel } from "./history.panel.js";
import { appInstance } from "@/app.js";
import { EVENTS } from "@/services/enum.js";
import { logger } from "@/utils/logger/logger.service.js";

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
    try {
      appInstance.eventBus.emit(EVENTS.QUERY_SEND, query.getValue());
    } catch (error) {
      appInstance.eventBus.emit(EVENTS.QUERY_ERROR, error);
      logger.error({ message: "Failed to submit query", error });
    }
  });

  //open box history
  query.key(["C-o"], () => {
    query.cancel();
    appInstance.renderScreen();
    appInstance.appendToScreen(historyPanel());
  });
  return query;
};
