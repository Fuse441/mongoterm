import blessed from "neo-blessed";
import { appInstance } from "@/app";
import { connectionColors } from "@/config/app.config";
import { logger } from "@/utils/logger/logger.service";

export function openColorPicker(
  onSelect: (color: string) => void,
  currentColor?: string,
) {
  try {
    logger.debug({ message: "Opening color picker", currentColor });

    const previousFocus = appInstance.screen.focused;

    const colors = connectionColors;
    const colsPerRow = 4;
    const rows = Math.ceil(colors.length / colsPerRow);
    const buttonWidth = 10;
    const buttonHeight = 3;
    const width = colsPerRow * (buttonWidth + 1) + 4;
    const height = rows * (buttonHeight + 1) + 4;

    // Dark overlay
    const overlay = blessed.box({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black", transparent: true },
    });

    // Color picker box
    const box = blessed.box({
      top: "center",
      left: "center",
      width,
      height,
      border: "line",
      label: " Select Color ",
      tags: true,
      keys: true,
      mouse: true,
      style: {
        border: { fg: "cyan" },
      },
    });

    let selectedIndex = currentColor ? colors.indexOf(currentColor) : 0;
    if (selectedIndex === -1) selectedIndex = 0;

    const colorButtons: blessed.Widgets.ButtonElement[] = [];

    logger.debug({ message: "Creating color buttons", total: colors.length });

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const row = Math.floor(i / colsPerRow);
      const col = i % colsPerRow;
      const left = col * (buttonWidth + 1) + 1;
      const top = row * (buttonHeight + 1) + 1;

      const isSelected = i === selectedIndex;

      const btn = blessed.button({
        parent: box,
        left,
        top,
        width: buttonWidth,
        height: buttonHeight,
        content: `{center}${color}{/center}`,
        tags: true,
        border: "line",
        mouse: true,
        keys: true,
        style: {
          bg: color === "black" ? "#222222" : color,
          fg: ["white", "yellow"].includes(color) ? "black" : "white",
          border: { fg: isSelected ? "green" : "gray" },
        },
      });

      btn.on("press", () => {
        logger.debug({ message: "Color selected", color });
        onSelect(color);
        cleanup();
      });

      colorButtons.push(btn);
    }

    function updateSelection(index: number) {
      selectedIndex = Math.max(0, Math.min(index, colors.length - 1));

      colorButtons.forEach((btn, i) => {
        if (i === selectedIndex) {
          btn.style.border!.fg = "green";
        } else {
          btn.style.border!.fg = "gray";
        }
      });

      colorButtons[selectedIndex].focus();

      logger.debug({ message: "Color selection updated", selectedIndex });
      appInstance.renderScreen();
    }

    function cleanup() {
      logger.debug({ message: "Closing color picker" });
      try {
        appInstance.removeScreenElement(overlay);
        appInstance.removeScreenElement(box);
        if (previousFocus) {
          previousFocus.focus();
        }
        appInstance.renderScreen();
      } catch (err) {
        logger.error({ message: "Error cleaning up color picker", error: err });
      }
    }

    // Keyboard navigation — bound on every button since focus lives on the
    // individual button widgets (blessed's Button consumes 'keypress' for
    // enter/space itself), not on the outer `box`, so `box.key()` bindings
    // would never fire (screen dispatches `element.key()` handlers only to
    // whichever element is actually focused).
    colorButtons.forEach((btn) => {
      btn.key(["escape"], () => {
        logger.debug({ message: "Color picker cancelled" });
        cleanup();
      });

      btn.key(["j", "down"], () => {
        updateSelection(selectedIndex + colsPerRow);
      });

      btn.key(["k", "up"], () => {
        updateSelection(selectedIndex - colsPerRow);
      });

      btn.key(["l", "right"], () => {
        updateSelection(selectedIndex + 1);
      });

      btn.key(["h", "left"], () => {
        updateSelection(selectedIndex - 1);
      });
    });

    // Append to screen in correct order
    appInstance.appendToScreen(overlay);
    appInstance.appendToScreen(box);

    // Focus and render
    if (colorButtons[selectedIndex]) {
      colorButtons[selectedIndex].focus();
    }
    appInstance.renderScreen();

    logger.debug({ message: "Color picker opened successfully" });
  } catch (err) {
    logger.error({ message: "Error opening color picker", error: err });
  }
}
