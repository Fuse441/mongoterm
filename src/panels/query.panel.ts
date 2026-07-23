import _blessed from "neo-blessed";

const blessed /** @type {typeof import('blessed')} */ =
  /** @type {any} */ _blessed;
import { MongoTermApp } from "@/core/screen.js";
import { theme } from "../config/app.config.js";
import { historyPanel } from "./history.panel.js";
import { appInstance } from "@/app.js";
import { EVENTS } from "@/services/enum.js";
import { logger } from "@/utils/logger/logger.service.js";
import { installCursorSupport } from "@/services/cursorInput.service.js";
import { attachQueryAutocomplete } from "@/panels/query/queryAutocomplete.panel.js";

const INVALID_COLOR = "red";

export function isValidQuerySyntax(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

export const queryInput = () => {
  const id = "query";
  const query = blessed.textbox({
    id,
    top: 0,
    left: "25%",
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

  const autocomplete = attachQueryAutocomplete(query);

  function setBorderColor(color: string) {
    query.style.border.fg = color;
    appInstance.renderScreen();
  }

  installCursorSupport(query, {
    onKey: autocomplete.onKey,
    onChange: (value, cursorPos) => {
      autocomplete.onChange(value, cursorPos);
      setBorderColor(isValidQuerySyntax(value) ? theme.border.focus : INVALID_COLOR);
    },
  });

  query.on("submit", () => {
    if (!isValidQuerySyntax(query.getValue())) {
      setBorderColor(INVALID_COLOR);
      appInstance.eventBus.emit(EVENTS.QUERY_ERROR, new Error("Invalid query format"));
      return;
    }
    try {
      appInstance.eventBus.emit(EVENTS.QUERY_SEND, query.getValue());
    } catch (error) {
      appInstance.eventBus.emit(EVENTS.QUERY_ERROR, error);
      logger.error({ message: "Failed to submit query", error });
    }
  });
  query.on("focus", () => {
    appInstance.setKeybindbarContent(id);
    setBorderColor(isValidQuerySyntax(query.getValue()) ? theme.border.focus : INVALID_COLOR);
  });
  query.on("blur", () => {
    autocomplete.destroy();
    setBorderColor(isValidQuerySyntax(query.getValue()) ? theme.border.blur : INVALID_COLOR);
  });
  //open box history
  query.key(["C-o"], () => {
    query.cancel();
    appInstance.renderScreen();
    appInstance.appendToScreen(historyPanel());
  });
  return query;
};
