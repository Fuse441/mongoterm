import _blessed from "neo-blessed";
const blessed = /** @type {typeof import('blessed')} */ (
  /** @type {any} */ (_blessed)
);

export function showToast(screen, toast) {
  const { statusCode, message } = toast;
  const color = statusCode != 200 ? "red" : "green";
  const box = blessed.box({
    bottom: 1,
    right: 2,
    width: message.length + 4,
    height: 3,
    content: ` ${message} `,
    tags: true,
    border: "line",
    style: {
      border: { fg: color },
      fg: color,
    },
  });

  screen.append(box);
  screen.render();

  setTimeout(() => {
    screen.remove(box);
    screen.render();
  }, 3500);
}
