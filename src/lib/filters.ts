import { RECENTLY_ACTIVE_MS } from "./constants";
import type { NormalizedIssue } from "./types";
import type { IssueStatus } from "./types";

export type SortOption =
  | "best_match"
  | "best_for_beginners"
  | "most_ready"
  | "likely_unclaimed"
  | "recently_updated"
  | "most_comments"
  | "likely_easiest"
  | "highest_readiness";

export interface FilterState {
  project: string;
  repo: string;
  status: IssueStatus | "";
  beginnerOnly: boolean;
  recentlyActiveOnly: boolean;
  excludeStale: boolean;
  highReadinessOnly: boolean;
  label: string;
  sort: SortOption;
  q: string;
}

export const INITIAL_FILTERS: FilterState = {
  project: "",
  repo: "",
  status: "",
  beginnerOnly: false,
  recentlyActiveOnly: false,
  excludeStale: false,
  highReadinessOnly: false,
  label: "",
  sort: "best_match",
  q: "",
};

export function applyFiltersAndSort(
  issues: NormalizedIssue[],
  filters: FilterState,
  options?: { skipProjectFilter?: boolean }
): NormalizedIssue[] {
  let result = [...issues];

  if (filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    result = result.filter(
      (i) =>
        (i.title ?? "").toLowerCase().includes(q) ||
        i.labels.some((l) => l.toLowerCase().includes(q))
    );
  }
  if (!options?.skipProjectFilter && filters.project) {
    result = result.filter((i) => i.project === filters.project);
  }
  if (filters.repo) {
    result = result.filter((i) => i.repo === filters.repo);
  }
  if (filters.status) {
    result = result.filter((i) => i.status === filters.status);
  }
  if (filters.label) {
    result = result.filter((i) =>
      i.labels.some((l) => l.toLowerCase() === filters.label.toLowerCase())
    );
  }
  if (filters.beginnerOnly) {
    result = result.filter((i) => i.isBeginnerFriendly);
  }
  if (filters.recentlyActiveOnly) {
    const cutoff = Date.now() - RECENTLY_ACTIVE_MS;
    result = result.filter(
      (i) => new Date(i.updatedAt).getTime() > cutoff
    );
  }
  if (filters.excludeStale) {
    result = result.filter((i) => !i.isStale);
  }
  if (filters.highReadinessOnly) {
    result = result.filter((i) => i.readiness === "high");
  }

  const sort = filters.sort;
  const readinessOrder = { high: 3, medium: 2, low: 1 };
  const unclaimedScore = (i: NormalizedIssue) =>
    i.status === "likely_unclaimed" ? 3 : i.status === "possible_wip" ? 1 : 0;

  result.sort((a, b) => {
    switch (sort) {
      case "best_match": {
        const scoreA =
          unclaimedScore(a) * 100 +
          (a.isBeginnerFriendly ? 10 : 0) +
          readinessOrder[a.readiness] +
          (a.isStale ? -5 : 0) +
          new Date(a.updatedAt).getTime() / 1e12;
        const scoreB =
          unclaimedScore(b) * 100 +
          (b.isBeginnerFriendly ? 10 : 0) +
          readinessOrder[b.readiness] +
          (b.isStale ? -5 : 0) +
          new Date(b.updatedAt).getTime() / 1e12;
        return scoreB - scoreA;
      }
      case "best_for_beginners":
        return (
          (b.isBeginnerFriendly ? 1 : 0) - (a.isBeginnerFriendly ? 1 : 0) ||
          readinessOrder[b.readiness] - readinessOrder[a.readiness] ||
          unclaimedScore(b) - unclaimedScore(a)
        );
      case "most_ready":
        return (
          readinessOrder[b.readiness] - readinessOrder[a.readiness] ||
          unclaimedScore(b) - unclaimedScore(a) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "likely_unclaimed":
        return (
          unclaimedScore(b) - unclaimedScore(a) ||
          readinessOrder[b.readiness] - readinessOrder[a.readiness] ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "recently_updated":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "most_comments":
        return b.comments - a.comments;
      case "likely_easiest":
        return (
          (b.isBeginnerFriendly ? 1 : 0) - (a.isBeginnerFriendly ? 1 : 0) ||
          (a.matchedOpenPrs === 0 ? 1 : 0) - (b.matchedOpenPrs === 0 ? 1 : 0)
        );
      case "highest_readiness":
        return readinessOrder[b.readiness] - readinessOrder[a.readiness];
      default:
        return 0;
    }
  });

  return result;
}
