export const GITHUB_API = "https://api.github.com";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.issue-scout.dev";

export const STALE_THRESHOLD_DAYS = 90;
export const RECENTLY_ACTIVE_DAYS = 30;
export const RECENT_DAYS = 30;
export const CACHE_REVALIDATE_SECONDS = 3600;

export const STALE_THRESHOLD_MS =
  STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
export const RECENTLY_ACTIVE_MS =
  RECENTLY_ACTIVE_DAYS * 24 * 60 * 60 * 1000;
export const RECENT_MS = RECENT_DAYS * 24 * 60 * 60 * 1000;
