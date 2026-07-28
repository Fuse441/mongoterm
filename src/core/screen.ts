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
import { IKeybind, TKeybindName } from "@/panels/keybingbar/keybindbar.interface";
import { keybindbarConfig } from "@/panels/keybingbar/keybindbar.config";
import { renderKeybindWindow } from "@/panels/keybingbar/keybindbarScroll";
import { MongodbBuilder } from "@/services/mongodb/mongodb.builder";

const KEYBINDBAR_SCROLL_STEP = 20;
const KEYBINDBAR_SCROLL_FRAMES = 6;
const KEYBINDBAR_SCROLL_FRAME_MS = 18;

export class MongoTermApp {
  private _screen!: blessed.Widgets.Screen;
  private _ui!: TResponseLayout;
  private _style!: any;
  private _keybindbarEntries: IKeybind[] = [];
  private _keybindbarOffset = 0;
  private _keybindbarScrollTimer: ReturnType<typeof setInterval> | null = null;
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
  public setKeybindbarContent(id: TKeybindName) {
    this._setKeybindbarEntries(keybindbarConfig[id]);
  }

  public setCustomKeybindbar(keybinds: IKeybind[]) {
    this._setKeybindbarEntries(keybinds);
  }

  public appendKeybindToBar(key: string, description: string) {
    this._setKeybindbarEntries([...this._keybindbarEntries, { key, description }]);
  }

  private _setKeybindbarEntries(entries: IKeybind[]) {
    this._keybindbarEntries = entries;
    this._keybindbarOffset = 0;
    if (this._keybindbarScrollTimer) {
      clearInterval(this._keybindbarScrollTimer);
      this._keybindbarScrollTimer = null;
    }
    this._renderKeybindbarWindow();
  }

  private _keybindbarWidth(): number {
    const box: any = this._ui.panels.keybindbar!;
    return Math.max(0, Number(box.width) - Number(box.iwidth));
  }

  private _renderKeybindbarWindow() {
    const box = this._ui.panels.keybindbar!;
    const width = this._keybindbarWidth();
    const { content } = renderKeybindWindow(this._keybindbarEntries, this._keybindbarOffset, width);
    box.setContent(content);
    this.renderScreen();
  }

  public scrollKeybindbar(direction: 1 | -1) {
    const width = this._keybindbarWidth();
    const { maxOffset } = renderKeybindWindow(this._keybindbarEntries, this._keybindbarOffset, width);
    const target = Math.min(Math.max(0, this._keybindbarOffset + direction * KEYBINDBAR_SCROLL_STEP), maxOffset);
    if (target === this._keybindbarOffset) return;

    if (this._keybindbarScrollTimer) clearInterval(this._keybindbarScrollTimer);

    const start = this._keybindbarOffset;
    const distance = target - start;
    let step = 0;
    this._keybindbarScrollTimer = setInterval(() => {
      step += 1;
      this._keybindbarOffset = Math.round(start + (distance * step) / KEYBINDBAR_SCROLL_FRAMES);
      this._renderKeybindbarWindow();
      if (step >= KEYBINDBAR_SCROLL_FRAMES) {
        clearInterval(this._keybindbarScrollTimer!);
        this._keybindbarScrollTimer = null;
      }
    }, KEYBINDBAR_SCROLL_FRAME_MS);
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
