import blessed from "blessed";
import { connectionPanel } from "../panels/connection.panel.js";
import { monitorPanel, startMonitor } from "../panels/monitor.panel.js";
import { queryInput } from "../panels/query.panel.js";
import { workspacePanel } from "../panels/workspace.panel.js";
import { appInstance } from "@/app.js";
import { logger } from "@/utils/logger/logger.service.js";
import { IMainLayout } from "./main.layout.types.js";
import { createTree } from "@/panels/tree/tree.panel.js";
import { registerDirectoryTree } from "@/panels/tree/tree.event.js";
import { keybindbarPanel } from "@/panels/keybingbar/keybindbar.panel.js";
export class MognoTermLayout {
  private _panels!: IMainLayout["panels"];
  private _dropdowns!: IMainLayout["dropdowns"];
  private _tree!: IMainLayout["panels"]["tree"];
  constructor() { }
  public async initLayout() {
    await this.initPanels();
    await this.initMonitor();

    await this.appentPanelsToScreen();
    return { panels: this._panels, dropdowns: this._dropdowns };
  }
  private async appentPanelsToScreen() {
    try {

    for (const panel of Object.values(this._panels)) {
      appInstance.appendToScreen(panel);
    }
    }
    catch (error) {
      logger.error({ message: `Error appending panels to screen: ${error}` });
    }
  }
  private async appentDropdownToScreen() {
    for (const dropdown of Object.values(this._dropdowns)) {
      this._panels.connection!.append(dropdown.header);
      this._panels.connection!.append(dropdown.list);
    }
    appInstance.renderScreen();
  }

  private async initPanels() {
    this._panels = {
      tree: registerDirectoryTree(appInstance.screen, {})!.el,
      workspace: workspacePanel(),
      query: queryInput(),
      monitor: monitorPanel(),
      keybindbar: keybindbarPanel(), 
    };
  }
    private async initMonitor() {
    startMonitor(appInstance.screen, this._panels.monitor);
  }
  get panels() {
    return this._panels;
  }
}
