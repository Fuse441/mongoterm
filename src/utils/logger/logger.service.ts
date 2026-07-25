import { state } from "@/shared/state";
import util from "util";
import { getTimestamp } from "@/services/helper";
import { ILevelLogger, TLogLevel } from "@/utils/logger/logger.interface";
import { getCaller } from "../stack/stack.service";
import { APP_ROOT, LOG_PATH } from "@/config/app.paths";
import { ensureSecureDir, createSecureAppendStream } from "@/utils/secureFs";
let currentConn: any = null;

// Use the same ".mongoterm" app directory as the rest of the app (helper.ts, app.ts)
// so logging works consistently across macOS, Linux, and Windows (any drive/home path).
// Restricted to the owner since app.log can contain connection details.
ensureSecureDir(APP_ROOT);

const streamLog = createSecureAppendStream(LOG_PATH);
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
