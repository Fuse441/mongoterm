import blessed from "neo-blessed";
import { logger } from "@/utils/logger/logger.service";
import { appInstance } from "@/app";
export function showToast(toast: Record<string, any>) {
  const { statusCode, message } = toast;
  const color = statusCode != 200 ? "red" : "green";
  const box = blessed.box({
    bottom: 1,
    right: 2,
    width: message.length + 4,
    height: 3,
    //    label: ` Enter any key to continue `,
    content: ` ${message} `,
    tags: true,
    border: "line",
    style: {
      border: { fg: color },
      fg: color,
    },
  });
  box.focus();

  // if (statusCode != 200) {
  //   box.on("keypress", () => {
  //     appInstance.removeScreenElement(box);
  //     appInstance.renderScreen();
  //   });
  // } else {
  //   setTimeout(() => {
  //     appInstance.removeScreenElement(box);
  //     appInstance.renderScreen();
  //   }, 1500);
  // }
  setTimeout(() => {
    appInstance.removeScreenElement(box);
    appInstance.renderScreen();
  }, 2500);

  appInstance.appendToScreen(box);
  appInstance.renderScreen();
}
