import { screen } from "../core/screen.js";
import { state } from "../core/state.js";
import util from "util";
let currentConn = null;
export function dialogConnect(conn) {
  if (conn) currentConn ??= conn;
  const color = currentConn.statusCode != 200 ? "#FF0000-fg" : "#00ff00-fg";

  return `
{${color}}● ${currentConn.developerMessage} {/}
{bold}Database{/}   : ${state.databases ?? "-"}
{bold}Collection{/} : ${state.collections ?? "-"}
`;
}
