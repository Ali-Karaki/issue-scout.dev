import { RECENTLY_ACTIVE_MS } from "./constants";
import type { NormalizedIssue } from "./types";
import type { IssueStatus } from "./types";

export type SortOption =
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
  label: string;
  sort: SortOption;
}

export const INITIAL_FILTERS: FilterState = {
  project: "",
  repo: "",
  status: "",
  beginnerOnly: false,
  recentlyActiveOnly: false,
  excludeStale: false,
  label: "",
  sort: "recently_updated",
};

export function applyFiltersAndSort(
  issues: NormalizedIssue[],
  filters: FilterState,
  options?: { skipProjectFilter?: boolean }
): NormalizedIssue[] {
  let result = [...issues];

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

  const sort = filters.sort;
  result.sort((a, b) => {
    switch (sort) {
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
      case "highest_readiness": {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.readiness] - order[a.readiness];
      }
      default:
        return 0;
    }
  });

  return result;
}
