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

async function fetchEcosystemCached(
  ecosystemId: string,
  token: string
): Promise<IssuesResponse> {
  if (!hasKv()) {
    throw new Error(
      "Redis cache required. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
  }
  const cacheKey = `issues:${ecosystemId}`;
  const cached = await kvGet<IssuesResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchSingleEcosystemUncached(ecosystemId, token);
  await kvSet(cacheKey, data, CACHE_REVALIDATE_SECONDS);
  return data;
}

export async function fetchIssues(
  ecosystemId: string | null,
  token: string
): Promise<IssuesResponse> {
  if (ecosystemId) {
    return fetchEcosystemCached(ecosystemId, token);
  }

  // "all": cache per ecosystem (each under 2MB), then merge
  const results = await Promise.all(
    ECOSYSTEMS.map((eco) => fetchEcosystemCached(eco.id, token))
  );
  const allIssues = results.flatMap((r) => r.issues);
  const allFailedRepos = results.flatMap((r) => r.summary.failedRepos);

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
