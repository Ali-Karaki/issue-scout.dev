import type { FilterState, SortColumn, SortOption } from "./filters";
import { INITIAL_FILTERS } from "./filters";

const SORT_COLUMNS: SortColumn[] = [
  "title",
  "repo",
  "claim",
  "beginner",
  "readiness",
  "comments",
];

export function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.project) params.set("project", filters.project);
  if (filters.repo) params.set("repo", filters.repo);
  if (filters.status) params.set("status", filters.status);
  if (filters.label) params.set("label", filters.label);
  if (filters.tech) params.set("tech", filters.tech);
  if (filters.beginnerOnly) params.set("beginnerOnly", "1");
  if (filters.excludeStale) params.set("excludeStale", "1");
  if (filters.sort && filters.sort !== "best_match")
    params.set("sort", filters.sort);
  if (filters.sortColumn) params.set("sortColumn", filters.sortColumn);
  if (filters.sortDesc) params.set("sortDesc", "1");
  return params;
}

export function paramsToFilters(params: URLSearchParams): FilterState {
  const sortOptions: SortOption[] = [
    "best_match",
    "best_for_beginners",
    "most_ready",
    "recently_updated",
    "most_comments",
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
  const tech = params.get("tech");
  if (tech) filters.tech = tech;
  filters.beginnerOnly = params.get("beginnerOnly") === "1";
  filters.excludeStale = params.get("excludeStale") === "1";
  if (sort && sortOptions.includes(sort as SortOption))
    filters.sort = sort as SortOption;
  const sortColumn = params.get("sortColumn");
  if (sortColumn && SORT_COLUMNS.includes(sortColumn as SortColumn))
    filters.sortColumn = sortColumn as SortColumn;
  filters.sortDesc = params.get("sortDesc") === "1";
  return filters;
}
