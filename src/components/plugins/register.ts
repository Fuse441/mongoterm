import { appInstance } from "@/app";

export function initPluginsStyle(ui: any) {
  ui.registerPlugin({
    name: "focus-style",
    init(ctx: any) {
      ctx.registerWidgetEnhancer((widget: any) => {
        widget.on("focus", () => {
          widget.style.border.fg = "green";
          widget.style.bg = "black";
          ctx.screen.render();
        });

        widget.on("blur", () => {
          widget.style.border.fg = "gray";
          widget.style.bg = "default";
          ctx.screen.render();
        });
      });
    },
  });
  ui.registerPlugin({
    name: "dropdown",
    init(ctx: any) {
      ctx.registerWidgetEnhancer((widget: any) => {
        if (!widget.isDropdown) return;

        widget.open = () => {
          const items = widget.items || [];
          if (!items.length) return;

          widget.list.setItems(items);
          widget.list.show();
          widget.list.focus();
          ctx.screen.render();
        };

        widget.close = () => {
          widget.list.hide();
          widget.header.focus();
          ctx.screen.render();
        };
      });
    },
  });
}

function openDropdown(dd: any, items: any) {
  if (!Array.isArray(items) || items.length === 0) return;

  dd.list.setItems(items);
  dd.list.show();
  dd.list.focus();
  appInstance.renderScreen();
}

function closeDropdown(dd: any) {
  dd.list.hide();
  dd.header.focus();
  appInstance.renderScreen();
}
