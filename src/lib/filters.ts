import type { NormalizedIssue } from "./types";
import type { IssueStatus } from "./types";

export type SortOption =
  | "best_match"
  | "best_for_beginners"
  | "most_ready"
  | "recently_updated"
  | "most_comments";

export type SortColumn =
  | "title"
  | "repo"
  | "claim"
  | "beginner"
  | "readiness"
  | "comments";

export interface FilterState {
  project: string[];
  repo: string[];
  status: IssueStatus | "";
  beginnerOnly: boolean;
  excludeStale: boolean;
  tech: string[];
  sort: SortOption;
  sortColumn: SortColumn | null;
  sortDesc: boolean;
  q: string;
}

export const INITIAL_FILTERS: FilterState = {
  project: [],
  repo: [],
  status: "",
  beginnerOnly: false,
  excludeStale: false,
  tech: [],
  sort: "best_match",
  sortColumn: null,
  sortDesc: false,
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
  if (!options?.skipProjectFilter && filters.project.length) {
    const projectSet = new Set(filters.project);
    result = result.filter((i) => projectSet.has(i.project));
  }
  if (filters.repo.length) {
    const repoSet = new Set(filters.repo);
    result = result.filter((i) => repoSet.has(i.repo));
  }
  if (filters.status) {
    result = result.filter((i) => i.status === filters.status);
  }
  if (filters.tech.length) {
    const techSet = new Set(filters.tech.map((t) => t.toLowerCase()));
    result = result.filter((i) =>
      (i.languages ?? []).some((l) => techSet.has(l.toLowerCase()))
    );
  }
  if (filters.beginnerOnly) {
    result = result.filter((i) => i.isBeginnerFriendly);
  }
  if (filters.excludeStale) {
    result = result.filter((i) => !i.isStale);
  }

  const readinessOrder = { high: 3, medium: 2, low: 1 };
  const statusOrder: Record<NormalizedIssue["status"], number> = {
    likely_unclaimed: 3,
    possible_wip: 2,
    stale: 1,
  };
  const unclaimedScore = (i: NormalizedIssue) =>
    i.status === "likely_unclaimed" ? 3 : i.status === "possible_wip" ? 1 : 0;

  const sortColumn = filters.sortColumn;
  const sortDesc = filters.sortDesc;

  if (sortColumn) {
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "title":
          cmp = (a.title ?? "").localeCompare(b.title ?? "");
          break;
        case "repo":
          cmp = a.repo.localeCompare(b.repo);
          break;
        case "claim":
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "beginner":
          cmp = (a.isBeginnerFriendly ? 1 : 0) - (b.isBeginnerFriendly ? 1 : 0);
          break;
        case "readiness":
          cmp = readinessOrder[a.readiness] - readinessOrder[b.readiness];
          break;
        case "comments":
          cmp = a.comments - b.comments;
          break;
        default:
          return 0;
      }
      return sortDesc ? -cmp : cmp;
    });
  } else {
    const sort = filters.sort;
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
      case "recently_updated":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "most_comments":
        return b.comments - a.comments;
      default:
        return 0;
    }
  });
  }

  return result;
}
