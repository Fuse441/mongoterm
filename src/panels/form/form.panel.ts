import { appInstance } from "@/app";
import blessed from "neo-blessed";
export function openForm(options: IFormOptions) {
  const form = blessed.form({
    top: "center",
    left: "center",
    width: 60,
    height: options.fields.length * 3 + 4,
    border: "line",
    label: ` ${options.title ?? "Form"} `,
    keys: true,
    mouse: true,
    style: {
      border: { fg: "cyan" },
      focus: { border: { fg: "green" } },
    },
  });
  const inputs: blessed.Widgets.TextboxElement[] = [];

  options.fields.forEach((field, index) => {
    const input = blessed.textbox({
      parent: form,
      name: field.name,
      label: ` ${field.label} `,
      top: index * 3,
      left: 1,
      width: "95%",
      height: 3,
      border: "line",
      keys: true,
      mouse: true,
      inputOnFocus: false,
      value: field.value ?? "",
      padding: {
        left: 1,
      },
      style: {
        border: { fg: "cyan" },
        focus: { border: { fg: "green" } },
      },
    });

    inputs.push(input);
  });
  const btnSubmit = blessed.button({
    parent: form,
    content: " Submit ",
    top: options.fields.length * 3 + 1,
    left: 2,
    shrink: true,
    padding: {
      left: 1,
      right: 1,
    },
    style: {
      fg: "white",
      bg: "#0984e3", // Blue
      bold: true,

      focus: {
        fg: "#000",
        bg: "#74b9ff", // Lighter Blue
      },

      hover: {
        fg: "white",
        bg: "#74b9ff",
      },
    },
  });

  const btnCancel = blessed.button({
    parent: form,
    content: " Cancel ",
    top: options.fields.length * 3 + 1,
    left: 15,
    shrink: true,
    padding: {
      left: 1,
      right: 1,
    },
    style: {
      fg: "white",
      bg: "#636e72", // Gray
      bold: true,

      focus: {
        fg: "#000",
        bg: "#b2bec3", // Light Gray
      },

      hover: {
        fg: "#000",
        bg: "#b2bec3",
      },
    },
  });

  appInstance.appendToScreen(form);
  form.focus();
  //  inputs[0]?.focus();

  btnSubmit.on("press", () => {
    const data: Record<string, string> = {};

    inputs.forEach((input) => {
      data[input.options.name as string] = input.getValue();
    });

    options.onSubmit(data);
    form.destroy();
    appInstance.ui.panels.tree?.focus();
  });

  function formDestory() {
    form.destroy();
    appInstance.ui.panels.tree?.focus();

    appInstance.renderScreen();
  }
  btnCancel.on("press", () => {
    formDestory();
  });
  form.key("escape", () => {
    formDestory();
  });
}
