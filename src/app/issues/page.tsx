"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { SummaryBar } from "@/components/SummaryBar";
import { IssueFilters } from "@/components/IssueFilters";
import { IssueCard } from "@/components/IssueCard";
import { IssuesTable } from "@/components/issues-table/IssuesTable";
import { Pagination } from "@/components/Pagination";
import { ResultSummary } from "@/components/ResultSummary";
import { AnimatePresence, motion } from "motion/react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatUpdatedAgo } from "@/lib/utils";
import { INITIAL_FILTERS, type FilterState } from "@/lib/filters";
import { filtersToParams, paramsToFilters } from "@/lib/url-filters";
import { useIssuesFetch } from "@/hooks/use-issues-fetch";
import { fadeIn, defaultTransition } from "@/lib/animations";

export default function IssuesPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filters, setFilters] = useState<FilterState>(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.toString()) return paramsToFilters(params);
    return INITIAL_FILTERS;
  });
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(p) && p >= 1 ? p : 1;
  });
  const { data, loading, isRevalidating, error, retry, fetchData, totalPages, total, limit, lastUpdatedAt } =
    useIssuesFetch("/api/issues", filters, page);

  const updateFilters = useCallback(
    (newFilters: FilterState, resetPage = true) => {
      setFilters(newFilters);
      const newPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const params = filtersToParams(newFilters);
      params.set("page", String(newPage));
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(null, "", url);
    },
    [pathname, page]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const params = filtersToParams(filters);
      params.set("page", String(newPage));
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(null, "", url);
    },
    [pathname, filters]
  );

  const handleSortChange = useCallback(
    (sortColumn: import("@/lib/filters").SortColumn, sortDesc: boolean) => {
      updateFilters({ ...filters, sortColumn, sortDesc }, true);
    },
    [filters, updateFilters]
  );

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setFilters(params.toString() ? paramsToFilters(params) : INITIAL_FILTERS);
      const p = parseInt(params.get("page") ?? "1", 10);
      setPage(Number.isFinite(p) && p >= 1 ? p : 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.toString()) {
      setFilters(paramsToFilters(params));
      const p = parseInt(params.get("page") ?? "1", 10);
      setPage(Number.isFinite(p) && p >= 1 ? p : 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from URL on mount only; searchParams causes re-run loops
  }, []);

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

  const displayIssues = data?.issues ?? [];

  if (loading) {
    return (
      <div
        className="max-w-4xl mx-auto px-6 py-12"
        aria-busy="true"
        aria-live="polite"
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="max-w-4xl mx-auto px-6 py-12"
        aria-live="polite"
      >
        <motion.div
          className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={defaultTransition}
        >
          <p className="mb-3">{error}</p>
          <button
            onClick={retry}
            aria-label="Retry loading issues"
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const displayCount = data.filteredSummary?.total ?? total;
  const totalCount = data.summary.total;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-semibold text-zinc-100">Issues</h1>
        <button
          type="button"
          onClick={fetchData}
          disabled={isRevalidating}
          aria-label="Refresh issues"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition disabled:opacity-50 disabled:cursor-wait"
        >
          {isRevalidating ? "Refreshing…" : formatUpdatedAgo(lastUpdatedAt) || "Updated just now"}
        </button>
      </div>

      <IssueFilters
        filters={filters}
        onChange={updateFilters}
        repos={repos}
        labels={labels}
        initialFilters={INITIAL_FILTERS}
        onClear={() => updateFilters(INITIAL_FILTERS)}
        showProject={true}
      />

      <ResultSummary
        count={displayCount}
        total={totalCount}
        filters={filters}
        initialFilters={INITIAL_FILTERS}
        onRemoveFilter={(updates) => updateFilters({ ...filters, ...updates })}
      />

      <div className="relative space-y-4">
        <AnimatePresence>
          {isRevalidating && (
            <motion.div
              className="fixed inset-0 z-50 flex items-start justify-center pt-28 bg-bg/40"
              aria-live="polite"
              aria-busy="true"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={defaultTransition}
            >
              <div
                className="w-8 h-8 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin"
                aria-hidden="true"
              />
            </motion.div>
          )}
        </AnimatePresence>
        {displayIssues.length === 0 ? (
          <motion.div
            className="text-center py-16 text-zinc-500 rounded-xl border border-zinc-700 bg-zinc-800/30"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={defaultTransition}
          >
            <p className="mb-4">
              {data.summary.total === 0 && data.summary.failedRepos.length > 0
                ? "Unable to load issues from GitHub. Please try again later."
                : "No issues match your filters."}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="hidden md:block">
              <IssuesTable
                issues={displayIssues}
                sortColumn={filters.sortColumn}
                sortDesc={filters.sortDesc}
                onSortChange={handleSortChange}
              />
            </div>
            <div className="md:hidden space-y-4">
              {displayIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={handlePageChange}
              isLoading={isRevalidating}
            />
          </>
        )}
      </div>

      <SummaryBar
        total={data.summary.total}
        likelyUnclaimed={data.summary.likelyUnclaimed}
        beginnerFriendly={data.summary.beginnerFriendly}
        stale={data.summary.stale}
        reposCovered={data.summary.reposCovered}
        failedRepos={data.summary.failedRepos}
        filteredSummary={data.filteredSummary}
      />
    </div>
  );
}
