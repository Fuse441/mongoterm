import fs from "fs";

const SECURE_DIR_MODE = 0o700;
const SECURE_FILE_MODE = 0o600;

// `mode` on mkdirSync/writeFileSync/createWriteStream only applies when the
// path is actually created, so re-chmod unconditionally to also tighten
// files/dirs left over from older, unrestricted versions of the app.

export function ensureSecureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true, mode: SECURE_DIR_MODE });
  try {
    fs.chmodSync(dir, SECURE_DIR_MODE);
  } catch {
    // best-effort — some filesystems don't support chmod
  }
}

export function writeFileSecure(filePath: string, data: string): void {
  fs.writeFileSync(filePath, data, {
    encoding: "utf-8",
    mode: SECURE_FILE_MODE,
  });
  try {
    fs.chmodSync(filePath, SECURE_FILE_MODE);
  } catch {
    // best-effort
  }
}

export function createSecureAppendStream(filePath: string): fs.WriteStream {
  const stream = fs.createWriteStream(filePath, {
    flags: "a",
    mode: SECURE_FILE_MODE,
  });
  try {
    fs.chmodSync(filePath, SECURE_FILE_MODE);
  } catch {
    // best-effort
  }
  return stream;
}
