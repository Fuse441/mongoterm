import blessed from "blessed";
import { Plugin, PluginContext } from "@/types/plugin";
import { MongoTermApp } from "./screen";
export class MongoTermStyle {
  private widgetListeners: ((w: any) => void)[] = [];
  private enhancers: ((w: any) => void)[] = [];
  constructor(public screen: any) { }
  registerPlugin(plugin: Plugin) {
    plugin.init({
      screen: this.screen,
      registerWidgetEnhancer: (fn: any) => this.enhancers.push(fn),
    });
  }

  attachWidget(widget: any) {
    this.enhancers.forEach((fn) => fn(widget));
  }
  onWidget(fn: (widget: any) => void) {
    this.widgetListeners.push(fn);
  }
}
