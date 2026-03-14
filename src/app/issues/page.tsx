"use client";

import { useState, useEffect, useMemo } from "react";
import { SummaryBar } from "@/components/SummaryBar";
import { IssueFilters } from "@/components/IssueFilters";
import { IssueCard } from "@/components/IssueCard";
import type { NormalizedIssue } from "@/lib/types";
import {
  applyFiltersAndSort,
  INITIAL_FILTERS,
  type FilterState,
} from "@/lib/filters";

export default function IssuesPage() {
  const [data, setData] = useState<{
    issues: NormalizedIssue[];
    summary: {
      total: number;
      likelyUnclaimed: number;
      beginnerFriendly: number;
      stale: number;
      reposCovered: number;
      failedRepos: string[];
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch("/api/issues")
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- data fetch pattern */
    setLoading(true);
    setError(null);
    fetch("/api/issues")
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const retry = fetchData;

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
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">
        Issues
      </h1>

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
        onChange={setFilters}
        repos={repos}
        labels={labels}
      />

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 rounded-xl border border-zinc-700 bg-zinc-800/30">
            No issues match your filters.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
}
