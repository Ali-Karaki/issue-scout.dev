import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS } from "../constants";
import { PROJECTS } from "../projects.config";
import { getIssuesForRepos, type RawIssueWithPrCount } from "../github";
import { normalizeIssue } from "../analysis/normalize";
import type { NormalizedIssue } from "../types";
import { hasKv, kvGet, kvSet } from "../kv";

export interface IssuesResponse {
  issues: NormalizedIssue[];
  summary: {
    total: number;
    likelyUnclaimed: number;
    beginnerFriendly: number;
    stale: number;
    reposCovered: number;
    failedRepos: string[];
  };
  filteredSummary?: {
    total: number;
    likelyUnclaimed: number;
    beginnerFriendly: number;
    stale: number;
    reposCovered: number;
    failedRepos: string[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RefreshResult {
  ok: boolean;
  projects: { id: string; ok: boolean; error?: string }[];
}

async function fetchSingleProjectUncached(
  projectId: string,
  token: string
): Promise<IssuesResponse> {
  const proj = PROJECTS.find((e) => e.id === projectId);
  if (!proj) throw new Error(`Unknown project: ${projectId}`);

  const { raw, failedRepos } = await getIssuesForRepos(
    proj.repos,
    proj.id,
    token
  );
  const issues = raw.map(normalizeIssue);
  const reposCovered = new Set(issues.map((i) => i.repo)).size;

  return {
    issues,
    summary: {
      total: issues.length,
      likelyUnclaimed: issues.filter((i) => i.status === "likely_unclaimed")
        .length,
      beginnerFriendly: issues.filter((i) => i.isBeginnerFriendly).length,
      stale: issues.filter((i) => i.isStale).length,
      reposCovered,
      failedRepos,
    },
  };
}

/**
 * Refresh all projects from GitHub and write to Upstash.
 * Used by the cron/refresh endpoint only.
 */
export async function refreshAllProjects(
  token: string
): Promise<RefreshResult> {
  if (!hasKv()) {
    return {
      ok: false,
      projects: PROJECTS.map((e) => ({
        id: e.id,
        ok: false,
        error: "Redis cache required",
      })),
    };
  }
  const results: { id: string; ok: boolean; error?: string }[] = [];
  const allData: IssuesResponse[] = [];

  for (const proj of PROJECTS) {
    try {
      const data = await fetchSingleProjectUncached(proj.id, token);
      await kvSet(`issues:${proj.id}`, data, CACHE_REVALIDATE_SECONDS);
      results.push({ id: proj.id, ok: true });
      allData.push(data);
    } catch (err) {
      results.push({
        id: proj.id,
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (allData.length > 0) {
    const allIssues = allData.flatMap((d) => d.issues);
    const allFailedRepos = allData.flatMap((d) => d.summary.failedRepos);
    const combined: IssuesResponse = {
      issues: allIssues,
      summary: {
        total: allIssues.length,
        likelyUnclaimed: allIssues.filter(
          (i) => i.status === "likely_unclaimed"
        ).length,
        beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
        stale: allIssues.filter((i) => i.isStale).length,
        reposCovered: new Set(allIssues.map((i) => i.repo)).size,
        failedRepos: allFailedRepos,
      },
    };
    await kvSet("issues:all", combined, CACHE_REVALIDATE_SECONDS);
  }

  return {
    ok: results.every((r) => r.ok),
    projects: results,
  };
}

/**
 * Fetch issues directly from GitHub (no cache).
 * Used as dev fallback when cache is empty or Redis not configured.
 */
export async function fetchIssuesFromGitHub(
  projectId: string | null,
  token: string
): Promise<IssuesResponse> {
  if (projectId) {
    return fetchSingleProjectUncached(projectId, token);
  }
  const allData: IssuesResponse[] = [];
  for (const proj of PROJECTS) {
    const data = await fetchSingleProjectUncached(proj.id, token);
    allData.push(data);
  }
  const allIssues = allData.flatMap((d) => d.issues);
  const allFailedRepos = allData.flatMap((d) => d.summary.failedRepos);
  return {
    issues: allIssues,
    summary: {
      total: allIssues.length,
      likelyUnclaimed: allIssues.filter(
        (i) => i.status === "likely_unclaimed"
      ).length,
      beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
      stale: allIssues.filter((i) => i.isStale).length,
      reposCovered: new Set(allIssues.map((i) => i.repo)).size,
      failedRepos: allFailedRepos,
    },
  };
}

/**
 * Read issues from Upstash cache only. No GitHub API calls.
 * Returns null on cache miss.
 */
export async function getIssuesFromCache(
  projectId: string | null
): Promise<IssuesResponse | null> {
  if (!hasKv()) return null;
  if (projectId) {
    return kvGet<IssuesResponse>(`issues:${projectId}`);
  }
  const combined = await kvGet<IssuesResponse>("issues:all");
  if (combined) return combined;
  const results = await Promise.all(
    PROJECTS.map((proj) => kvGet<IssuesResponse>(`issues:${proj.id}`))
  );
  if (results.some((r) => !r)) return null;
  const allIssues = results.flatMap((r) => r!.issues);
  const allFailedRepos = results.flatMap((r) => r!.summary.failedRepos);
  return {
    issues: allIssues,
    summary: {
      total: allIssues.length,
      likelyUnclaimed: allIssues.filter(
        (i) => i.status === "likely_unclaimed"
      ).length,
      beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
      stale: allIssues.filter((i) => i.isStale).length,
      reposCovered: new Set(allIssues.map((i) => i.repo)).size,
      failedRepos: allFailedRepos,
    },
  };
}

/**
 * Read issues with Next.js Data Cache. Avoids Upstash reads on cache hit.
 * When KV is not configured, falls back to getIssuesFromCache (no caching).
 */
export async function getCachedIssues(
  projectId: string | null
): Promise<IssuesResponse | null> {
  if (!hasKv()) return getIssuesFromCache(projectId);
  const cached = unstable_cache(
    async () => getIssuesFromCache(projectId),
    ["issues", projectId ?? "all"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: ["issues"] }
  );
  return cached();
}
