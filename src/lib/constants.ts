export const REPOS = [
  "tanstack/router",
  "tanstack/query",
  "tanstack/table",
  "tanstack/db",
  "tanstack/store",
  "tanstack/form",
  "tanstack/virtual",
  "tanstack/hotkeys",
  "tanstack/pacer",
  "tanstack/ai",
  "tanstack/devtools",
  "tanstack/cli",
  "tanstack/config",
  "tanstack/intent",
  "tanstack/tanstack.com",
];

export const GITHUB_API = "https://api.github.com";

export const ISSUE_LINK_REGEX =
  /(?:fix(?:es|ed)?|close(?:s|d)?|resolve(?:s|d)?)\s+#(\d+)/gi;

export const CACHE_PREFIX = "tanstack_issues_";
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
