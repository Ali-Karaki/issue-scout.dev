"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
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
    params.append(key, value);
  });
  const sep = base.includes("?") ? "&" : "?";
  return base + sep + params.toString();
}

export function useIssuesFetch(
  apiUrl: string,
  filters: FilterState,
  page: number
) {
  const key = apiUrl ? buildUrl(apiUrl, page, filters) : null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    errorRetryCount: 2,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.message?.includes("429") || err?.message?.includes("Too many requests")) {
        setTimeout(() => revalidate(), 60_000);
      } else if (retryCount < 2) {
        setTimeout(() => revalidate(), 5000);
      }
    },
  });

  const loading = isLoading && !data;
  const isRevalidating = isValidating && !!data;

  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const limit = pagination?.limit ?? DEFAULT_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const fetchData = useCallback(() => mutate(), [mutate]);

  return {
    data,
    loading,
    isRevalidating,
    error: error?.message ?? null,
    retry: fetchData,
    fetchData,
    page,
    totalPages,
    total,
    limit,
    hasNextPage,
    hasPrevPage,
  };
}
