export type PluginContext = {
  screen: any;
  registerWidgetEnhancer: (fn: (widget: any) => void) => void;
};

export type Plugin = {
  name: string;
  init: (ctx: PluginContext) => void;
};
