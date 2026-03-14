"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { IssuesResponse } from "@/lib/api/fetch-issues";

const DEFAULT_LIMIT = 50;

async function fetcher(url: string): Promise<IssuesResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        message = data.error;
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
  const getKey = useCallback(
    (pageIndex: number, previousPageData: IssuesResponse | null) => {
      if (!apiUrl) return null;
      if (pageIndex === 0) return buildUrl(apiUrl, 1);
      if (!previousPageData?.pagination?.hasMore) return null;
      return buildUrl(apiUrl, pageIndex + 1);
    },
    [apiUrl]
  );

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    errorRetryCount: 2,
  });

  const mergedData: IssuesResponse | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    const allIssues = data.flatMap((d) => d.issues);
    const last = data[data.length - 1];
    return {
      issues: allIssues,
      summary: data[0].summary,
      pagination: last.pagination,
    };
  }, [data]);

  const loading =
    isLoading || (isValidating && !!mergedData && size === 1);
  const loadingMore = isValidating && size > 1;
  const hasMore = mergedData?.pagination?.hasMore ?? false;

  const loadMore = useCallback(() => {
    if (!apiUrl || !hasMore || loadingMore) return;
    setSize(size + 1);
  }, [apiUrl, hasMore, loadingMore, size, setSize]);

  const fetchData = useCallback(() => mutate(), [mutate]);

  return {
    data: mergedData,
    loading,
    loadingMore,
    error: error?.message ?? null,
    retry: fetchData,
    fetchData,
    loadMore,
    hasMore,
  };
}
