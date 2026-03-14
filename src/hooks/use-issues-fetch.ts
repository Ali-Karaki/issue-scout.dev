"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data fetch in effect */
import { useState, useEffect, useCallback } from "react";
import type { IssuesResponse } from "@/lib/api/fetch-issues";

const DEFAULT_LIMIT = 50;

async function fetchWithErrorHandling(
  url: string
): Promise<IssuesResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        message =
          res.status === 503
            ? data.error
            : data.error;
      } else if (res.status === 503) {
        message = "Service temporarily unavailable. Check configuration.";
      }
    } catch {
      if (res.status === 503) {
        message = "Service temporarily unavailable. Check configuration.";
      }
    }
    throw new Error(message);
  }
  return res.json();
}

function buildUrl(base: string, page: number): string {
  const url = new URL(base, window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(DEFAULT_LIMIT));
  return url.pathname + url.search;
}

export function useIssuesFetch(apiUrl: string) {
  const [data, setData] = useState<IssuesResponse | null>(null);
  const [loading, setLoading] = useState(!!apiUrl);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(() => {
    if (!apiUrl) return;
    setLoading(true);
    setError(null);
    fetchWithErrorHandling(buildUrl(apiUrl, 1))
      .then((json) => {
        setData(json);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unknown error")
      )
      .finally(() => setLoading(false));
  }, [apiUrl]);

  const loadMore = useCallback(() => {
    if (!apiUrl || !data?.pagination?.hasMore || loadingMore) return;
    const nextPage = (data.pagination.page ?? 1) + 1;
    setLoadingMore(true);
    fetchWithErrorHandling(buildUrl(apiUrl, nextPage))
      .then((json) => {
        setData((prev) => {
          if (!prev) return json;
          return {
            ...json,
            issues: [...prev.issues, ...json.issues],
            pagination: json.pagination ?? prev.pagination,
          };
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unknown error")
      )
      .finally(() => setLoadingMore(false));
  }, [apiUrl, data, loadingMore]);

  useEffect(() => {
    if (!apiUrl) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWithErrorHandling(buildUrl(apiUrl, 1))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const hasMore = data?.pagination?.hasMore ?? false;

  return { data, loading, loadingMore, error, retry: fetchData, fetchData, loadMore, hasMore };
}
