import { state } from "@/shared/state";
import util from "util";
import { getTimestamp } from "@/services/helper";
import path from "path";
import fs from "fs";
import os from "os";
import { ILevelLogger, TLogLevel } from "@/utils/logger/logger.interface";
import { getCaller } from "../stack/stack.service";
let currentConn: any = null;

const streamLog = fs.createWriteStream(
  path.join(os.homedir(), "mongoterm", "app.log"),
);
function formatLog(level: TLogLevel, args: Record<string, any>[]) {
  const timestamp = getTimestamp();
  const message = util.format(...args);
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}
export const logger = {
  debug: (...args: Record<string, any>[]) => {
    streamLog.write(formatLog("debug", args));
  },
  info: (...args: Record<string, any>[]) => {
    streamLog.write(formatLog("info", args));
  },
  warn: (...args: Record<string, any>[]) => {
    streamLog.write(formatLog("warn", args));
  },
  error: (...args: Record<string, any>[]) => {
    streamLog.write(formatLog("error", args));
  },
};
