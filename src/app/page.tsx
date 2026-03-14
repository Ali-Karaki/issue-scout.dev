"use client";

import { useState, useCallback } from "react";
import { CACHE_PREFIX, CACHE_TTL_MS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { RepoResult } from "@/lib/github";

function IssueLink({
  number,
  title,
  state,
  created_at,
  html_url,
}: {
  number: number;
  title: string | null;
  state: string;
  created_at: string;
  html_url: string;
}) {
  const displayTitle = (title || "").slice(0, 80) + ((title || "").length > 80 ? "…" : "");
  return (
    <a
      href={html_url}
      target="_blank"
      rel="noopener"
      className="flex items-start gap-3 py-2.5 border-b border-zinc-700 last:border-0 no-underline text-inherit hover:bg-zinc-800/50 transition"
    >
      <span className="font-mono text-sm text-amber-500 shrink-0">#{number}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug">{displayTitle}</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {state} · {formatDate(created_at)}
        </div>
      </div>
    </a>
  );
}

function RepoCard({
  data,
  initialExpand,
}: {
  data: RepoResult;
  initialExpand: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpand);
  const [showAll, setShowAll] = useState(false);

  const { repo, unclaimed, totalIssues } = data;
  const label = totalIssues === 0 ? "0" : `${unclaimed.length}/${totalIssues}`;
  const issues = showAll ? unclaimed : unclaimed.slice(0, 10);
  const hasMore = unclaimed.length > 10 && !showAll;
  const moreCount = unclaimed.length - 10;

  return (
    <div
      className="repo-card bg-zinc-800/50 border border-zinc-700 rounded-xl mb-3 overflow-hidden"
      data-repo={repo}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="repo-header flex items-center justify-between w-full px-5 py-4 cursor-pointer hover:bg-zinc-800 transition text-left"
      >
        <span className="font-mono font-medium text-sm">{repo}</span>
        <span
          className={`text-xs px-2.5 py-1 rounded-md font-medium ${
            unclaimed.length === 0
              ? "bg-zinc-700 text-zinc-500"
              : "bg-amber-700 text-zinc-900"
          }`}
        >
          {label}
        </span>
      </button>
      <div
        className={`repo-body border-t border-zinc-700 px-5 py-3 max-h-96 overflow-y-auto ${
          expanded ? "" : "hidden"
        }`}
      >
        {unclaimed.length === 0 ? (
          <div className="flex items-start gap-3 py-2.5 text-zinc-500 cursor-default">
            No unclaimed issues
          </div>
        ) : (
          <>
            {issues.map((i) => (
              <IssueLink
                key={i.number}
                number={i.number}
                title={i.title}
                state={i.state}
                created_at={i.created_at}
                html_url={i.html_url}
              />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="block w-full text-center py-2 mt-2 text-sm text-amber-500 hover:underline bg-transparent border-none cursor-pointer font-inherit"
              >
                +{moreCount} more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getCached(): RepoResult[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + "all");
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCached(data: RepoResult[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_PREFIX + "all",
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

export default function Page() {
  const [results, setResults] = useState<RepoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAndRender = useCallback(async () => {
    const cached = getCached();
    if (cached) {
      setResults(cached);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const { results: data } = (await res.json()) as { results: RepoResult[] };
      setResults(data);
      setCached(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredResults =
    results?.filter((r) =>
      r.repo.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const totalUnclaimed = results?.reduce((s, r) => s + r.unclaimed.length, 0) ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          TanStack <span className="text-amber-500">Unclaimed</span> Issues
        </h1>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter repos..."
            className="w-48 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-700"
          />
          <button
            type="button"
            onClick={fetchAndRender}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-900 font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fetch
          </button>
        </div>
      </header>

      {results && results.length > 0 && (
        <div className="flex gap-6 mb-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <span className="text-sm text-zinc-500">
            Repos:{" "}
            <strong className="text-amber-500 font-medium">{results.length}</strong>
          </span>
          <span className="text-sm text-zinc-500">
            Total unclaimed:{" "}
            <strong className="text-amber-500 font-medium">{totalUnclaimed}</strong>
          </span>
        </div>
      )}

      <div id="content">
        {loading && (
          <div className="text-center py-12 text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <div>Fetching issues from GitHub...</div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <>
            {filteredResults.map((r, i) => (
              <RepoCard key={r.repo} data={r} initialExpand={i < 3} />
            ))}
          </>
        )}

        {!loading && !error && results === null && (
          <div className="text-center py-12 text-zinc-500">
            Click Fetch to load unclaimed issues from TanStack repos.
          </div>
        )}

        {!loading && !error && results && filteredResults.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No repos match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
