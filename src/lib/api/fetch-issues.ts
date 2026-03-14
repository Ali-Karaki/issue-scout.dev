import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS } from "../constants";
import { ECOSYSTEMS } from "../ecosystems.config";
import { getIssuesForRepos, type RawIssueWithPrCount } from "../github";
import { normalizeIssue } from "../analysis/normalize";
import type { NormalizedIssue } from "../types";

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

async function fetchIssuesUncached(
  ecosystemId: string | null,
  token: string
): Promise<IssuesResponse> {
  const ecosystems = ecosystemId
    ? ECOSYSTEMS.filter((e) => e.id === ecosystemId)
    : ECOSYSTEMS;

  const allRaw: RawIssueWithPrCount[] = [];
  const allFailedRepos: string[] = [];

  for (const eco of ecosystems) {
    const { raw, failedRepos } = await getIssuesForRepos(
      eco.repos,
      eco.id,
      token
    );
    allRaw.push(...raw);
    allFailedRepos.push(...failedRepos);
  }

  const issues = allRaw.map(normalizeIssue);
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
      failedRepos: allFailedRepos,
    },
  };
}

export async function fetchIssues(
  ecosystemId: string | null,
  token: string
): Promise<IssuesResponse> {
  const cacheKey = `issues-${ecosystemId ?? "all"}`;
  return unstable_cache(
    () => fetchIssuesUncached(ecosystemId, token),
    [cacheKey],
    { revalidate: CACHE_REVALIDATE_SECONDS }
  )();
}
