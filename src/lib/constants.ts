import siteConfig from "../../config/site.json";

export const GITHUB_API = "https://api.github.com";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

export const GITHUB_REPO =
  (siteConfig as { githubRepo?: string }).githubRepo ?? "";

/** URL to create a new "request project" issue. Uses title+body params for reliable pre-fill. */
export const SUGGEST_ISSUE_URL = (() => {
  if (!GITHUB_REPO) return "";
  const base = `https://github.com/${GITHUB_REPO}/issues/new`;
  const title = encodeURIComponent("[Request] ");
  const body = encodeURIComponent(
    `## Repo to add

Format: \`owner/repo\` (e.g. \`vercel/swr\`)


---

**Tip:** Search [existing issues](https://github.com/${GITHUB_REPO}/issues?q=is%3Aissue+Request) before submitting to avoid duplicates. You can upvote with a thumbs-up reaction.`
  );
  return `${base}?title=${title}&body=${body}&labels=enhancement`;
})();

export const STALE_THRESHOLD_DAYS = 90;
export const RECENTLY_ACTIVE_DAYS = 30;
export const RECENT_DAYS = 30;
// 7 days = 7 * 24 * 60 * 60
export const CACHE_REVALIDATE_SECONDS = 604800;
// 1 day - CDN TTL to align with daily cron refresh
export const CDN_CACHE_SECONDS = 86400;

export const STALE_THRESHOLD_MS =
  STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
export const RECENTLY_ACTIVE_MS =
  RECENTLY_ACTIVE_DAYS * 24 * 60 * 60 * 1000;
export const RECENT_MS = RECENT_DAYS * 24 * 60 * 60 * 1000;
