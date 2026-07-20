import os from "os";
import path from "path";

/**
 * Centralized, cross-platform application paths.
 *
 * Using `os.homedir()` + `path.join` ensures these resolve correctly on
 * macOS, Linux, and Windows (including any drive letter), instead of
 * hardcoding path separators or assuming a specific home directory layout.
 */
export const APP_ROOT = path.join(os.homedir(), ".mongoterm");
export const CONFIG_DIR = APP_ROOT;
export const CONFIG_PATH = path.join(CONFIG_DIR, "compass.json");
export const LOG_PATH = path.join(APP_ROOT, "app.log");
