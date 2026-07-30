import { existsSync, readFileSync } from "fs";
import { APP_VERSION, UPDATE_CHECK_PATH, APP_ROOT } from "@/config/app.paths";
import { ensureSecureDir, writeFileSecure } from "@/utils/secureFs";
import { logger } from "@/utils/logger/logger.service";

/*
|--------------------------------------------------------------------------
| UPDATE CHECK
|--------------------------------------------------------------------------
| Checks GitHub git tags (not Releases, not npm) for a newer published
| version. tag-release.yml pushes a `vX.Y.Z` tag matching package.json on
| every release, but never creates an actual GitHub Release object, so
| `/releases/latest` 404s — the tags API is what's actually populated.
| Trade-off: tags don't carry release notes, so the toast just links to
| the tagged tree rather than a changelog. Runs on every launch (an
| unauthenticated GitHub API call, well under its 60/hour rate limit for
| a single-user CLI) rather than being cached/throttled, so a fresh
| install always sees the current state immediately. The on-disk cache is
| kept only as an offline fallback — used solely when the live fetch
| fails, not to skip the fetch. Every failure (offline, rate-limited,
| malformed response) is swallowed — this must never block or crash
| startup.
*/

const TAGS_API = "https://api.github.com/repos/Fuse441/mongoterm/tags";
const FETCH_TIMEOUT_MS = 5000;

interface UpdateCheckCache {
  lastCheckedAt: number;
  latestVersion: string;
  releaseUrl: string;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  releaseUrl?: string;
}

function readCache(): UpdateCheckCache | null {
  if (!existsSync(UPDATE_CHECK_PATH)) return null;
  try {
    return JSON.parse(readFileSync(UPDATE_CHECK_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCheckCache): void {
  try {
    ensureSecureDir(APP_ROOT);
    writeFileSecure(UPDATE_CHECK_PATH, JSON.stringify(cache, null, 2));
  } catch (error) {
    logger.debug({ message: "Failed to write update-check cache", error });
  }
}

/**
 * Naive numeric major.minor.patch compare — good enough for this app's own
 * `vX.Y.Z` release tags, not a general semver implementation (no
 * prerelease/build-metadata handling; a non-numeric segment just stops the
 * comparison at that point).
 */
function isNewerVersion(latest: string, current: string): boolean {
  const a = latest.replace(/^v/, "").split(".").map(Number);
  const b = current.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return false;
    if (x !== y) return x > y;
  }
  return false;
}

async function fetchLatestTag(): Promise<{ version: string; url: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(TAGS_API, {
      headers: {
        "User-Agent": "mongoterm-update-check",
        Accept: "application/vnd.github+json",
      },
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data: any = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    // The API doesn't guarantee tags are sorted by version, so pick the
    // highest one ourselves rather than trusting data[0].
    let latest: { name: string } | null = null;
    for (const tag of data) {
      if (typeof tag?.name !== "string") continue;
      if (!latest || isNewerVersion(tag.name, latest.name)) {
        latest = tag;
      }
    }
    if (!latest) return null;

    return {
      version: latest.name,
      url: `https://github.com/Fuse441/mongoterm/tree/${latest.name}`,
    };
  } catch (error) {
    logger.debug({ message: "Update check request failed", error });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  const tag = await fetchLatestTag();

  let latestVersion: string | undefined;
  let releaseUrl: string | undefined;

  if (tag) {
    latestVersion = tag.version;
    releaseUrl = tag.url;
    writeCache({
      lastCheckedAt: Date.now(),
      latestVersion: tag.version,
      releaseUrl: tag.url,
    });
  } else {
    // Live fetch failed (offline, rate-limited, etc.) — fall back to
    // whatever we last saw rather than reporting "no update" outright.
    const cache = readCache();
    latestVersion = cache?.latestVersion;
    releaseUrl = cache?.releaseUrl;
  }

  if (!latestVersion || !isNewerVersion(latestVersion, APP_VERSION)) {
    return { hasUpdate: false };
  }

  return { hasUpdate: true, latestVersion, releaseUrl };
}
