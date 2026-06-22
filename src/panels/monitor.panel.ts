import os from "os";
import blessed from "neo-blessed";
import { appInstance } from "@/app";

export function monitorPanel() {
  const box = blessed.box({
    bottom: 1,
    left: 1,
    width: 30,
    height: 10,

    label: " Monitor ",
    border: "line",
    tags: true,

    zIndex: 999, // สูงไว้ก่อน
    style: {
      bg: "black",
      border: {
        fg: "green",
      },
    },
  });

  return box;
}

export function startMonitor(screen: any, box: any) {
  let last = process.cpuUsage();
  let lastTime = process.hrtime();

  setInterval(() => {
    const mem = process.memoryUsage();

    const diff = process.cpuUsage(last);
    last = process.cpuUsage();

    const hr = process.hrtime(lastTime);
    lastTime = process.hrtime();

    const elapsedMs = hr[0] * 1000 + hr[1] / 1e6;

    const cpuPercent = ((diff.user + diff.system) / 1000 / elapsedMs) * 100;

    box.setContent(`
CPU: ${cpuPercent.toFixed(2)}%
RSS: ${(mem.rss / 1024 / 1024).toFixed(1)} MB
Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB
EventLoop: ${elapsedMs.toFixed(1)}ms
Load: ${os.loadavg()[0].toFixed(2)}
`);
    appInstance.renderScreen();
  }, 500);
}
