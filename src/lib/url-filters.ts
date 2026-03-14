import type { FilterState, SortOption } from "./filters";
import { INITIAL_FILTERS } from "./filters";

export function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.project) params.set("project", filters.project);
  if (filters.repo) params.set("repo", filters.repo);
  if (filters.status) params.set("status", filters.status);
  if (filters.label) params.set("label", filters.label);
  if (filters.beginnerOnly) params.set("beginnerOnly", "1");
  if (filters.recentlyActiveOnly) params.set("recentlyActiveOnly", "1");
  if (filters.excludeStale) params.set("excludeStale", "1");
  if (filters.highReadinessOnly) params.set("highReadinessOnly", "1");
  if (filters.sort && filters.sort !== "best_match")
    params.set("sort", filters.sort);
  return params;
}

export function paramsToFilters(params: URLSearchParams): FilterState {
  const sortOptions: SortOption[] = [
    "best_match",
    "best_for_beginners",
    "most_ready",
    "likely_unclaimed",
    "recently_updated",
    "most_comments",
    "likely_easiest",
    "highest_readiness",
  ];
  const sort = params.get("sort");
  const filters: FilterState = { ...INITIAL_FILTERS };
  const q = params.get("q");
  if (q) filters.q = q;
  const project = params.get("project");
  if (project) filters.project = project;
  const repo = params.get("repo");
  if (repo) filters.repo = repo;
  const status = params.get("status");
  if (
    status &&
    (status === "likely_unclaimed" ||
      status === "possible_wip" ||
      status === "stale")
  )
    filters.status = status;
  const label = params.get("label");
  if (label) filters.label = label;
  filters.beginnerOnly = params.get("beginnerOnly") === "1";
  filters.recentlyActiveOnly = params.get("recentlyActiveOnly") === "1";
  filters.excludeStale = params.get("excludeStale") === "1";
  filters.highReadinessOnly = params.get("highReadinessOnly") === "1";
  if (sort && sortOptions.includes(sort as SortOption))
    filters.sort = sort as SortOption;
  return filters;
}
