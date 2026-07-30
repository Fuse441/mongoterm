import os from "os";
import path from "path";
import { existsSync, readFileSync } from "fs";

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
export const UPDATE_CHECK_PATH = path.join(APP_ROOT, "update-check.json");

/**
 * package.json sits at the repo root either way, but its distance from this
 * compiled file differs between `tsx` (runs `src/config/app.paths.ts`
 * directly, 2 levels up) and the published build (`dist/src/config/
 * app.paths.js`, 3 levels up) — try both rather than hardcoding one.
 */
function resolveAppVersion(): string {
  const candidates = [
    path.join(__dirname, "../../package.json"),
    path.join(__dirname, "../../../package.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(readFileSync(candidate, "utf-8")).version ?? "0.0.0";
    } catch {
      continue;
    }
  }
  return "0.0.0";
}

export const APP_VERSION = resolveAppVersion();
