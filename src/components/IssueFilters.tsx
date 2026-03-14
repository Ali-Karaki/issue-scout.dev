"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PROJECTS } from "@/lib/projects.config";
import type { FilterState, SortOption } from "@/lib/filters";
import { CLAIM_STATUS, BEGINNER } from "@/lib/terminology";

export type { FilterState, SortOption };

const SORT_LABELS: Record<SortOption, string> = {
  best_match: "Best match",
  best_for_beginners: "Best for beginners",
  most_ready: "Most ready to start",
  recently_updated: "Recently updated",
  most_comments: "Most comments",
};

interface IssueFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  repos: string[];
  labels: string[];
  initialFilters?: FilterState;
  onClear?: () => void;
  showProject?: boolean;
}

export function IssueFilters({
  filters,
  onChange,
  repos,
  labels,
  initialFilters,
  onClear,
  showProject = true,
}: IssueFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const update = useCallback(
    (key: keyof FilterState, value: string | boolean) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const hasActiveFilters = initialFilters && (
    filters.q !== initialFilters.q ||
    filters.project !== initialFilters.project ||
    filters.repo !== initialFilters.repo ||
    filters.status !== initialFilters.status ||
    filters.label !== initialFilters.label ||
    filters.sort !== initialFilters.sort ||
    filters.sortColumn !== initialFilters.sortColumn ||
    filters.sortDesc !== initialFilters.sortDesc ||
    filters.beginnerOnly !== initialFilters.beginnerOnly ||
    filters.excludeStale !== initialFilters.excludeStale
  );

  const unclaimedActive =
    filters.status === "likely_unclaimed" && filters.excludeStale;
  const toggleUnclaimed = () => {
    if (unclaimedActive) {
      onChange({ ...filters, status: "", excludeStale: false });
    } else {
      onChange({ ...filters, status: "likely_unclaimed", excludeStale: true });
    }
  };
  const toggleBeginner = () => update("beginnerOnly", !filters.beginnerOnly);

  const selectClass =
    "w-full min-w-0 px-3 py-1.5 pr-7 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-amber-600 appearance-none";
  const selectWrapperClass = "relative";

  const chipBase =
    "px-3 py-1 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg cursor-pointer";
  const chipInactive =
    "bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500";
  const chipActive = "border-transparent";

  return (
    <div className="rounded-xl bg-zinc-800/30 border border-zinc-700 mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex-1 min-w-[160px]">
          <input
            type="search"
            placeholder="Search issues..."
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-600"
            aria-label="Search issues by title or label"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={selectWrapperClass}>
            <select
              id="filter-sort"
              value={filters.sort}
              onChange={(e) =>
                onChange({
                  ...filters,
                  sort: e.target.value as import("@/lib/filters").SortOption,
                  sortColumn: null,
                })
              }
              className={selectClass}
              aria-label="Sort issues"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
              ▼
            </span>
          </div>
          <motion.button
            type="button"
            onClick={toggleUnclaimed}
            className={`${chipBase} ${unclaimedActive ? "bg-emerald-600 text-white " + chipActive : chipInactive}`}
            title={CLAIM_STATUS.likely_unclaimed.tooltip}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            Unclaimed
          </motion.button>
          <motion.button
            type="button"
            onClick={toggleBeginner}
            className={`${chipBase} ${filters.beginnerOnly ? "bg-amber-600/80 text-zinc-900 " + chipActive : chipInactive}`}
            title={BEGINNER.tooltip}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            Beginner
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-500 transition-colors duration-200 flex items-center gap-1"
            aria-expanded={expanded}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            More filters
            <span
              className={`inline-block text-zinc-400 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </motion.button>
          {hasActiveFilters && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-500 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="overflow-hidden border-t border-zinc-700/50"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-3">
          {showProject && (
            <div className="min-w-[140px]">
              <label
                htmlFor="filter-project"
                className="block text-xs text-zinc-500 mb-1"
              >
                Project
              </label>
              <div className={selectWrapperClass}>
                <select
                  id="filter-project"
                  value={filters.project}
                  onChange={(e) => update("project", e.target.value)}
                  className={selectClass}
                >
                  <option value="">All</option>
                  {PROJECTS.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                  ▼
                </span>
              </div>
            </div>
          )}
          <div className="min-w-[180px]">
            <label
              htmlFor="filter-repo"
              className="block text-xs text-zinc-500 mb-1"
            >
              Repo
            </label>
            <div className={selectWrapperClass}>
              <select
                id="filter-repo"
                value={filters.repo}
                onChange={(e) => update("repo", e.target.value)}
                className={`${selectClass} min-w-[180px]`}
              >
                <option value="">All</option>
                {repos.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                ▼
              </span>
            </div>
          </div>
          <div className="min-w-[140px]">
            <label
              htmlFor="filter-label"
              className="block text-xs text-zinc-500 mb-1"
            >
              Label
            </label>
            <div className={selectWrapperClass}>
              <select
                id="filter-label"
                value={filters.label}
                onChange={(e) => update("label", e.target.value)}
                className={`${selectClass} min-w-[140px]`}
              >
                <option value="">All</option>
                {labels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                ▼
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.excludeStale}
                onChange={(e) => update("excludeStale", e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
              />
              Exclude stale
            </label>
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
