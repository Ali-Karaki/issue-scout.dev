"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { IssuesResponse } from "@/lib/api/fetch-issues";
import type { FilterState } from "@/lib/filters";
import { filtersToParams } from "@/lib/url-filters";

const DEFAULT_LIMIT = 50;

const FETCH_TIMEOUT_MS = 30_000;

async function fetcher(url: string): Promise<IssuesResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
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

function buildUrl(base: string, page: number, filters: FilterState): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(DEFAULT_LIMIT));
  const filterParams = filtersToParams(filters);
  filterParams.forEach((value, key) => {
    params.set(key, value);
  });
  const sep = base.includes("?") ? "&" : "?";
  return base + sep + params.toString();
}

export function useIssuesFetch(apiUrl: string, filters: FilterState) {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: IssuesResponse | null) => {
      if (!apiUrl) return null;
      if (pageIndex === 0) return buildUrl(apiUrl, 1, filters);
      if (!previousPageData?.pagination?.hasMore) return null;
      return buildUrl(apiUrl, pageIndex + 1, filters);
    },
    [apiUrl, filters]
  );

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
    dataUpdatedAt,
  } = useSWRInfinite(getKey, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
    errorRetryCount: 2,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.message?.includes("429") || err?.message?.includes("Too many requests")) {
        setTimeout(() => revalidate(), 60_000);
      } else if (retryCount < 2) {
        setTimeout(() => revalidate(), 5000);
      }
    },
  });

  const mergedData: IssuesResponse | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    const allIssues = data.flatMap((d) => d.issues);
    const last = data[data.length - 1];
    const first = data[0];
    return {
      issues: allIssues,
      summary: first.summary,
      filteredSummary: first.filteredSummary,
      pagination: last.pagination,
    };
  }, [data]);

  const loading = isLoading && !mergedData;
  const isRevalidating = isValidating && !!mergedData;
  const loadingMore = isValidating && size > 1;
  const hasMore = mergedData?.pagination?.hasMore ?? false;

  const loadMore = useCallback(() => {
    if (!apiUrl || !hasMore || loadingMore) return;
    setSize(size + 1);
  }, [apiUrl, hasMore, loadingMore, size, setSize]);

  const fetchData = useCallback(() => mutate(), [mutate]);

  const lastUpdatedAt = dataUpdatedAt ?? 0;

  return {
    data: mergedData,
    loading,
    isRevalidating,
    loadingMore,
    error: error?.message ?? null,
    retry: fetchData,
    fetchData,
    loadMore,
    hasMore,
    lastUpdatedAt,
  };
}
