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
| the tagged tree rather than a changelog. Network call is cached to at
| most once per CHECK_INTERVAL_MS so normal launches don't hit the API,
| and every failure (offline, rate-limited, malformed response) is
| swallowed — this must never block or crash startup.
*/

const TAGS_API = "https://api.github.com/repos/Fuse441/mongoterm/tags";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
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
  const cache = readCache();
  const isCacheFresh =
    cache && Date.now() - cache.lastCheckedAt < CHECK_INTERVAL_MS;

  let latestVersion = cache?.latestVersion;
  let releaseUrl = cache?.releaseUrl;

  if (!isCacheFresh) {
    const tag = await fetchLatestTag();
    if (tag) {
      latestVersion = tag.version;
      releaseUrl = tag.url;
      writeCache({
        lastCheckedAt: Date.now(),
        latestVersion: tag.version,
        releaseUrl: tag.url,
      });
    } else if (cache) {
      // Fetch failed but we have a stale cache — use it rather than
      // re-hitting the API on every launch until it succeeds again.
      latestVersion = cache.latestVersion;
      releaseUrl = cache.releaseUrl;
    }
  }

  if (!latestVersion || !isNewerVersion(latestVersion, APP_VERSION)) {
    return { hasUpdate: false };
  }

  return { hasUpdate: true, latestVersion, releaseUrl };
}
