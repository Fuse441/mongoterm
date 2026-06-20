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
export class MongoTermApp {
  private _screen!: blessed.Widgets.Screen;
  private _ui!: TResponseLayout;
  private _style!: any;
  private _eventBus!: EventMongoTerm;
  constructor(private workspaceLogger: Logger) { }
  public async init() {
    try {
      logger.info({ message: "Initializing MongoTerm..." });
      await this.createScreen();
      await this.createUI();
      await this.createEventBus();
      await this.createStyle();

      await this.registerAppListeners();
      // this._screen.on("keypress", (_, key) => {
      // logger.debug({message: "log keypress " + JSON.stringify(key)})
      // });
      //      this.ui.childConnection.connectionDD.header.focus();
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
    initDropdownEvents();
    this.renderScreen();
    logger.debug({ message: "UI initialized", details: this._ui });
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
