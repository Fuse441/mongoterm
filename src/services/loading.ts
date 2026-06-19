import { appInstance } from "@/app";

const frames = [
  "Connecting   ",
  "Connecting.  ",
  "Connecting.. ",
  "Connecting...",
];

let i = 0;
let loadingTimer: any = null;

export function startLoading() {
  if (loadingTimer) return;

  loadingTimer = setInterval(() => {
    appInstance.ui.panels.workspace!.setContent(frames[i]);

    i = (i + 1) % frames.length;
    appInstance.renderScreen();
  }, 300);
}

export function clearLoading() {
  if (!loadingTimer) return;

  clearInterval(loadingTimer);
  loadingTimer = null;
}
