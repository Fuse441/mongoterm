import { EventEmitter } from "events";
import { screen, ui } from "./screen.js";
import { dialogConnect } from "../utils/logger.js";
import { state } from "./state.js";
import { EVENTS } from "../services/enum.js";
import { renderResult } from "../panels/result.panel.js";
import { showToast } from "../panels/toast.panel.js";

export const eventBus = new EventEmitter();

export function registerEventBus() {
  function renderWorkspace(content) {
    ui.workspace.setContent(content);
    screen.render();
  }

  eventBus.on(EVENTS.QUERY_RESULT, (result) => {
    renderResult(ui.workspace, result);
  });

  eventBus.on(EVENTS.TOAST_SHOW, (rest) => {
    showToast(screen, rest);
  });
  eventBus.on("db:collectionsLoaded", () => {
    renderWorkspace(dialogConnect());
  });

  eventBus.on(EVENTS.DB_DATABASES_LOADED, (res) => {
    const { statusCode, developerMessage } = res;
    if (statusCode !== 200) {
      // return showToast(screen, {
      //   statusCode,
      //   message: "Failed to load databases",
      // });
    } else {
      ui.childConnection.databaseDD.header.focus();
    }
    renderWorkspace(dialogConnect(res));
  });
}
