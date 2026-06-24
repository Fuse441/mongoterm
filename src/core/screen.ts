import { keybindings } from "@/core/keybindings";
import { EventMongoTerm } from "@/core/eventBus";
import { logger } from "@/utils/logger/logger.service";
import blessed from "neo-blessed";
import { MognoTermLayout } from "@/layout/main.layout";
import { TLayoutScreen, TResponseLayout } from "@/layout/main.layout.types";
import { MongoTermStyle } from "./ui";
import { initPluginsStyle } from "@/components/plugins/register";
import { initDropdownEvents } from "@/panels/dropdown/dropdown.event";
import { Logger } from "@/utils/logger/logger";
import { IWorkspaceLogger } from "@/utils/logger/logger.interface";
import { TKeybindName } from "@/panels/keybingbar/keybindbar.interface";
import { keybindbarConfig } from "@/panels/keybingbar/keybindbar.config";
import { MongodbBuilder } from "@/services/mongodb/mongodb.builder";
export class MongoTermApp {
  private _screen!: blessed.Widgets.Screen;
  private _ui!: TResponseLayout;
  private _style!: any;
    constructor(private _eventBus:EventMongoTerm, private workspaceLogger: Logger,private mongodbBuilder: MongodbBuilder) {}
  public async init() {
    try {
      logger.info({ message: "Initializing MongoTerm..." });
      await this.mongodbBuilder.initMongoBuilder();
      await this.createScreen();
      await this.createUI();
      await this.createStyle();

      await this.registerAppListeners();
    } catch (error) {
      logger.error({ message: "Error initializing MongoTerm", error });
    }

    //    this.registerAppListeners();
  }

  private async createScreen() {
    this._screen = blessed.screen({
      smartCSR: true,
      title: "MongoTerm",
    });
    

  }
  private async createEventBus() {
    this._eventBus = new EventMongoTerm();
  }
  private async registerAppListeners() {
    logger.info({ message: "Registering application listeners..." });
    keybindings(this.ui);
    logger.info({ message: "Application listeners registered successfully" });
  }
  public renderWorkspacePanel() {
    this._ui.panels.workspace!.render();
  }
  public renderWorkspace(content: IWorkspaceLogger) {
    const response = this.workspaceLogger.log(content);
    this._ui.panels.workspace!.setContent(String(response));
    // this._ui.panels.workspace!.setLabel(` {bold}asdasd{/bold} `);
    this.renderScreen();
  }
  public removeScreenElement(element: any) {
    try {
      this._screen.remove(element);
      this.renderScreen();
    } catch (error) {
      logger.error({ message: "Error removing element from screen", error });
    }
  }
  public renderScreen() {
    this._screen.render();
  }
  public clearScreen(value: any) {
    this._screen.remove(value);
  }
  public clearWorkerScreen() {
    this._ui.panels.workspace!.setContent("");
    this._ui.panels.workspace!.scrollTo(0);
    this._ui.panels.workspace!.children = [];
    this.renderScreen();
  }
  public appendToScreen(element: any) {
    try {
      this._screen.append(element);
      this.renderScreen();
    } catch (error) {
      logger.error({ message: "Error appending element to screen", error });
    }
  }
  private async createStyle() {
    this._style = new MongoTermStyle(this._screen);
    initPluginsStyle(this._style);
  }

  private async createUI() {
    this._ui = await new MognoTermLayout().initLayout();
    this._ui.panels.tree!.focus();
        this.renderScreen();
    logger.debug({ message: "UI initialized", details: this._ui });
  }
  public setKeybindbarContent(id:TKeybindName) {
    let content = ``;
    const config  = keybindbarConfig[id]
    for (const keybind of config) {
      content += `[{bold}${keybind.key}{/bold}] - ${keybind.description}  `;
    }
    this._ui.panels.keybindbar!.setContent(content);
    this.renderScreen();
  }
  get style() {
    return this._style;
  }
  get screen() {
    return this._screen;
  }
  get eventBus() {
    return this._eventBus;
  }
  get ui() {
    return this._ui;
  }
}
