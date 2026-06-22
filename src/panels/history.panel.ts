import blessed from "neo-blessed";

import { theme } from "../config/app.config.js";
import { QueryService } from "@/services/query.service";
import { appInstance } from "@/app.js";
// const queryService = new QueryService();
// queryService.clearHistory();
// console.log(queryService.viewHistory());

export const historyPanel = () => {
  const queryService = new QueryService();
  const history = queryService.getHistory();

  const container = blessed.box({
    top: "center",
    left: "center",
    width: 50,
    height: 22,
    label: " History Queries ",
    border: "line",
    keys: true,
    mouse: true,
    style: { border: { fg: "cyan" } },
  });

  const search = blessed.textbox({
    parent: container,
    top: 0,
    left: 0,
    width: "100%-2",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true,
    style: {
      border: { fg: "gray" },
      focus: { border: { fg: "cyan" } },
    },
  });
  // list ข้างล่าง
  const list = blessed.list({
    parent: container,
    top: 3,
    left: 0,
    width: "100%-2",
    height: "100%-5",
    keys: true,
    mouse: true,
    vi: true,
    items: history.map((q) => `${q.query}`),
    style: {
      selected: { bg: "blue", fg: "white" },
      item: { fg: "white" },
    },
  });

  // พิมพ์ใน search แล้ว filter list
  search.on("keypress", (ch, key) => {
    if (!ch) return;
    const searchTerm = search.getValue();
    const filtered = history.filter((q) =>
      q.query.toLowerCase().includes(searchTerm),
    );
    const result = (filtered.length != 0 &&
      filtered.map((q) => `${q.query}`)) || ["No results"];
    list.setItems(result);
    appInstance.renderScreen();
  });
  //
  // // Tab สลับไป list
  search.key(["enter"], () => {
    list.focus();
    appInstance.renderScreen();
  });
  //
  // // Tab สลับกลับ search
  list.key(["tab"], () => {
    search.focus();
    appInstance.renderScreen();
  });

  list.on("select", (item, index) => {
    // appInstance.ui.panels.query!.setValue(history[index]?.query || JSON.stringify({}));
    //   //   screen.debug(`Selected query: ${(item.getText(), index)}`);
    //   screen.render();
  });
  //
  // // ESC ปิด
  container.key(["escape"], () => {
    container.destroy();
    appInstance.renderScreen();
    appInstance.ui.panels.query!.focus();
  });
  search.key(["escape"], () => {
    container.destroy();
    appInstance.ui.panels.query!.focus();
    appInstance.renderScreen();
  });
  list.key(["escape"], () => {
    container.destroy();
    appInstance.ui.panels.query!.focus();

    appInstance.renderScreen();
  });
  //
  appInstance.appendToScreen(container);
  search.focus();
  appInstance.renderScreen();
  return container;
};
