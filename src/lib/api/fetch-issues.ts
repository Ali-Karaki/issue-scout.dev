import { CACHE_REVALIDATE_SECONDS } from "../constants";
import { ECOSYSTEMS } from "../ecosystems.config";
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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RefreshResult {
  ok: boolean;
  ecosystems: { id: string; ok: boolean; error?: string }[];
}

async function fetchSingleEcosystemUncached(
  ecosystemId: string,
  token: string
): Promise<IssuesResponse> {
  const eco = ECOSYSTEMS.find((e) => e.id === ecosystemId);
  if (!eco) throw new Error(`Unknown ecosystem: ${ecosystemId}`);

  const { raw, failedRepos } = await getIssuesForRepos(
    eco.repos,
    eco.id,
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
 * Refresh all ecosystems from GitHub and write to Upstash.
 * Used by the cron/refresh endpoint only.
 */
export async function refreshAllEcosystems(
  token: string
): Promise<RefreshResult> {
  if (!hasKv()) {
    return {
      ok: false,
      ecosystems: ECOSYSTEMS.map((e) => ({
        id: e.id,
        ok: false,
        error: "Redis cache required",
      })),
    };
  }
  const results: { id: string; ok: boolean; error?: string }[] = [];
  const allData: IssuesResponse[] = [];

  for (const eco of ECOSYSTEMS) {
    try {
      const data = await fetchSingleEcosystemUncached(eco.id, token);
      await kvSet(`issues:${eco.id}`, data, CACHE_REVALIDATE_SECONDS);
      results.push({ id: eco.id, ok: true });
      allData.push(data);
    } catch (err) {
      results.push({
        id: eco.id,
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
    ecosystems: results,
  };
}

/**
 * Read issues from Upstash cache only. No GitHub API calls.
 * Returns null on cache miss.
 */
export async function getIssuesFromCache(
  ecosystemId: string | null
): Promise<IssuesResponse | null> {
  if (!hasKv()) return null;
  if (ecosystemId) {
    return kvGet<IssuesResponse>(`issues:${ecosystemId}`);
  }
  const combined = await kvGet<IssuesResponse>("issues:all");
  if (combined) return combined;
  const results = await Promise.all(
    ECOSYSTEMS.map((eco) => kvGet<IssuesResponse>(`issues:${eco.id}`))
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
