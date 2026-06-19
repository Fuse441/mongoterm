import { appInstance } from "@/app";
import _blessed from "neo-blessed";

const blessed /** @type {typeof import('blessed')} */ =
  /** @type {any} */ _blessed;

const history = [];
let historyIndex = -1;

function inputPanel() {
  const container = blessed.textbox({
    top: "center",
    left: "center",
    width: 60,
    height: 3,
    label: " Enter ",
    border: "line",
    keys: true,
    mouse: true,
    inputOnFocus: true,
    padding: { left: 1, right: 1 },
    style: {
      border: { fg: "cyan" },
      focus: { border: { fg: "green" } },
    },
  });

  appInstance.appendToScreen(container);
  appInstance.renderScreen();

  return container;
}

export function openInputPanel(label = "Input", onSubmit: any) {
  const input = inputPanel();

  input.setLabel(` ${label} `);
  input.focus();

  input.on("submit", (value) => {
    appInstance.clearScreen(value);

    if (onSubmit && value?.trim()) {
      onSubmit(value.trim());
    }

    appInstance.renderScreen();
  });

  input.key("escape", () => {
    appInstance.clearScreen(input);
    appInstance.renderScreen();
  });
}
