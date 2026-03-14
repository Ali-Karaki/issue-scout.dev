"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams, usePathname } from "next/navigation";
import { notFound } from "next/navigation";
import { SummaryBar } from "@/components/SummaryBar";
import { IssueFilters } from "@/components/IssueFilters";
import { IssueCard } from "@/components/IssueCard";
import { IssuesTable } from "@/components/issues-table/IssuesTable";
import { Pagination } from "@/components/Pagination";
import { ResultSummary } from "@/components/ResultSummary";
import { formatUpdatedAgo } from "@/lib/utils";
import { PROJECTS } from "@/lib/projects.config";
import { INITIAL_FILTERS, type FilterState } from "@/lib/filters";
import { filtersToParams, paramsToFilters } from "@/lib/url-filters";
import { useIssuesFetch } from "@/hooks/use-issues-fetch";

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const projectConfig = PROJECTS.find((e) => e.id === id);
  const [filters, setFilters] = useState<FilterState>(() => {
    const urlParams = new URLSearchParams(searchParams.toString());
    const base = { ...INITIAL_FILTERS, project: id ?? "" };
    if (urlParams.toString()) {
      const fromUrl = paramsToFilters(urlParams);
      return { ...base, ...fromUrl, project: id ?? "" };
    }
    return base;
  });
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(p) && p >= 1 ? p : 1;
  });
  const { data, loading, isRevalidating, error, retry, fetchData, totalPages, total, limit, lastUpdatedAt } =
    useIssuesFetch(
      projectConfig ? `/api/issues/${id}` : "",
      filters,
      page
    );

  const updateFilters = useCallback(
    (newFilters: FilterState, resetPage = true) => {
      const merged = { ...newFilters, project: id ?? "" };
      setFilters(merged);
      const newPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const urlParams = filtersToParams(merged);
      urlParams.set("page", String(newPage));
      const qs = urlParams.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(null, "", url);
    },
    [id, pathname, page]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const urlParams = filtersToParams({ ...filters, project: id ?? "" });
      urlParams.set("page", String(newPage));
      const qs = urlParams.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(null, "", url);
    },
    [id, pathname, filters]
  );

  const handleSortChange = useCallback(
    (sortColumn: import("@/lib/filters").SortColumn, sortDesc: boolean) => {
      updateFilters({ ...filters, sortColumn, sortDesc }, true);
    },
    [filters, updateFilters]
  );

  useEffect(() => {
    setFilters((prev) => ({ ...prev, project: id ?? "" }));
  }, [id]);

  useEffect(() => {
    const onPopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const base = { ...INITIAL_FILTERS, project: id ?? "" };
      setFilters(urlParams.toString() ? { ...base, ...paramsToFilters(urlParams), project: id ?? "" } : base);
      const p = parseInt(urlParams.get("page") ?? "1", 10);
      setPage(Number.isFinite(p) && p >= 1 ? p : 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams.toString());
    if (urlParams.toString()) {
      setFilters((prev) => ({ ...prev, ...paramsToFilters(urlParams), project: id ?? "" }));
      const p = parseInt(urlParams.get("page") ?? "1", 10);
      setPage(Number.isFinite(p) && p >= 1 ? p : 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from URL on mount; searchParams causes re-run loops
  }, [id]);

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

  if (!projectConfig) {
    notFound();
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center py-16 text-zinc-500">
          <div className="w-10 h-10 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Fetching issues...</p>
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
            aria-label="Retry loading issues"
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

  const initialFilters = { ...INITIAL_FILTERS, project: id };
  const displayCount = data.filteredSummary?.total ?? total;
  const totalCount = data.summary.total;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">
            {projectConfig.name}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{projectConfig.description}</p>
        </div>
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

      <ResultSummary
        count={displayCount}
        total={totalCount}
        filters={filters}
        initialFilters={initialFilters}
        onRemoveFilter={(updates) => updateFilters({ ...filters, ...updates })}
      />

      <IssueFilters
        filters={filters}
        onChange={updateFilters}
        repos={repos}
        labels={labels}
        initialFilters={initialFilters}
        onClear={() => updateFilters(initialFilters)}
        showProject={false}
      />

      <SummaryBar
        total={data.summary.total}
        likelyUnclaimed={data.summary.likelyUnclaimed}
        beginnerFriendly={data.summary.beginnerFriendly}
        stale={data.summary.stale}
        reposCovered={data.summary.reposCovered}
        failedRepos={data.summary.failedRepos}
        filteredSummary={data.filteredSummary}
      />

      <div className="relative space-y-4">
        {isRevalidating && (
          <div
            className="absolute inset-0 z-10 flex items-start justify-center pt-8 bg-bg/60"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-2 rounded-lg bg-zinc-800/90 px-4 py-3 border border-zinc-600">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Updating results…</span>
            </div>
          </div>
        )}
        {displayIssues.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 rounded-xl border border-zinc-700 bg-zinc-800/30">
            <p className="mb-4">
              {data.summary.total === 0 && data.summary.failedRepos.length > 0
                ? "Unable to load issues from GitHub. Please try again later."
                : "No issues match your filters."}
            </p>
          </div>
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
    </div>
  );
}
