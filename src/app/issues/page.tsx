"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SummaryBar } from "@/components/SummaryBar";
import { IssueFilters } from "@/components/IssueFilters";
import { IssueCard } from "@/components/IssueCard";
import {
  applyFiltersAndSort,
  INITIAL_FILTERS,
  type FilterState,
} from "@/lib/filters";
import { filtersToParams, paramsToFilters } from "@/lib/url-filters";
import { useIssuesFetch } from "@/hooks/use-issues-fetch";

export default function IssuesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading, loadingMore, error, retry, fetchData, loadMore, hasMore } = useIssuesFetch("/api/issues");

  const [filters, setFilters] = useState<FilterState>(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.toString()) return paramsToFilters(params);
    return INITIAL_FILTERS;
  });

  const updateFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      const params = filtersToParams(newFilters);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.toString()) {
      /* eslint-disable react-hooks/set-state-in-effect -- sync filters from URL */
      setFilters(paramsToFilters(params));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams]);

  const repos = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.issues.map((i) => i.repo))].sort();
  }, [data]);

  const labels = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const i of data.issues) {
      for (const l of i.labels) set.add(l);
    }
    return [...set].sort();
  }, [data]);

  const filteredIssues = useMemo(() => {
    if (!data) return [];
    return applyFiltersAndSort(data.issues, filters);
  }, [data, filters]);

  if (loading) {
    return (
      <div
        className="max-w-4xl mx-auto px-6 py-12"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="text-center py-16 text-zinc-500">
          <div className="w-10 h-10 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Fetching issues from GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="max-w-4xl mx-auto px-6 py-12"
        aria-live="polite"
      >
        <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400">
          <p className="mb-3">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">
          Issues
        </h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
        >
          Refresh
        </button>
      </div>

      <SummaryBar
        total={data.summary.total}
        likelyUnclaimed={data.summary.likelyUnclaimed}
        beginnerFriendly={data.summary.beginnerFriendly}
        stale={data.summary.stale}
        reposCovered={data.summary.reposCovered}
        failedRepos={data.summary.failedRepos}
      />

      <IssueFilters
        filters={filters}
        onChange={updateFilters}
        repos={repos}
        labels={labels}
      />

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 rounded-xl border border-zinc-700 bg-zinc-800/30">
            No issues match your filters.
          </div>
        ) : (
          <>
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
