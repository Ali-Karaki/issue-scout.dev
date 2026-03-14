"use client";

import { ECOSYSTEMS } from "@/lib/ecosystems.config";
import type { FilterState, SortOption } from "@/lib/filters";

export type { FilterState, SortOption };

interface IssueFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  repos: string[];
  labels: string[];
}

export function IssueFilters({
  filters,
  onChange,
  repos,
  labels,
}: IssueFiltersProps) {
  const update = (key: keyof FilterState, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700 mb-6">
      <div>
        <label htmlFor="filter-ecosystem" className="block text-xs text-zinc-500 mb-1">Ecosystem</label>
        <select
          id="filter-ecosystem"
          value={filters.ecosystem}
          onChange={(e) => update("ecosystem", e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
        >
          <option value="">All</option>
          {ECOSYSTEMS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-repo" className="block text-xs text-zinc-500 mb-1">Repo</label>
        <select
          id="filter-repo"
          value={filters.repo}
          onChange={(e) => update("repo", e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-amber-600 min-w-[180px]"
        >
          <option value="">All</option>
          {repos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-status" className="block text-xs text-zinc-500 mb-1">Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(e) => update("status", e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
        >
          <option value="">All</option>
          <option value="likely_unclaimed">Likely unclaimed</option>
          <option value="possible_wip">Possible WIP</option>
          <option value="stale">Stale</option>
        </select>
      </div>
      <div>
        <label htmlFor="filter-label" className="block text-xs text-zinc-500 mb-1">Label</label>
        <select
          id="filter-label"
          value={filters.label}
          onChange={(e) => update("label", e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-amber-600 min-w-[140px]"
        >
          <option value="">All</option>
          {labels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-sort" className="block text-xs text-zinc-500 mb-1">Sort</label>
        <select
          id="filter-sort"
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
        >
          <option value="recently_updated">Recently updated</option>
          <option value="most_comments">Most comments</option>
          <option value="likely_easiest">Likely easiest</option>
          <option value="highest_readiness">Highest readiness</option>
        </select>
      </div>
      <div className="flex items-end gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.beginnerOnly}
            onChange={(e) => update("beginnerOnly", e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
          Beginner only
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.recentlyActiveOnly}
            onChange={(e) => update("recentlyActiveOnly", e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
          Recently active
        </label>
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
  );
}
