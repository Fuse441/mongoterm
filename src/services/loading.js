import { ui, screen } from "../core/screen.js";

const frames = [
  "Connecting   ",
  "Connecting.  ",
  "Connecting.. ",
  "Connecting...",
];

let i = 0;
let loadingTimer = null;

export function startLoading() {
  if (loadingTimer) return;

  loadingTimer = setInterval(() => {
    ui.workspace.setContent(frames[i]);

    i = (i + 1) % frames.length;

    screen.render();
  }, 300);
}

export function clearLoading() {
  if (!loadingTimer) return;

  clearInterval(loadingTimer);
  loadingTimer = null;
}
