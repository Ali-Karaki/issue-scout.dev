import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useSWRInfinite from "swr/infinite";
import { useIssuesFetch } from "../use-issues-fetch";
import type { IssuesResponse } from "@/lib/api/fetch-issues";

vi.mock("swr/infinite");

const mockMutate = vi.fn();
const mockSetSize = vi.fn();
const useSWRInfiniteMock = vi.mocked(useSWRInfinite);

function makeMockResponse(
  page: number,
  hasMore: boolean
): IssuesResponse {
  return {
    issues: [
      {
        id: `owner/repo#${page}`,
        number: page,
        title: "Test",
        url: "https://github.com/owner/repo/issues/1",
        repo: "owner/repo",
        ecosystem: "tanstack",
        labels: ["bug"],
        state: "open",
        comments: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isBeginnerFriendly: false,
        matchedOpenPrs: 0,
        status: "likely_unclaimed",
        readiness: "high",
        isStale: false,
        explanation: "",
      },
    ],
    summary: {
      total: 2,
      likelyUnclaimed: 2,
      beginnerFriendly: 0,
      stale: 0,
      reposCovered: 1,
      failedRepos: [],
    },
    pagination: {
      page,
      limit: 50,
      total: 2,
      hasMore,
    },
  };
}

describe("useIssuesFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null data and loading false when apiUrl is empty", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      size: 0,
      setSize: mockSetSize,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useIssuesFetch(""));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
    expect(useSWRInfiniteMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: true,
        dedupingInterval: 2000,
        errorRetryCount: 2,
      })
    );
  });

  it("returns merged data when SWR has data", () => {
    const page1 = makeMockResponse(1, true);
    const page2 = makeMockResponse(2, false);
    useSWRInfiniteMock.mockReturnValue({
      data: [page1, page2],
      error: null,
      isLoading: false,
      isValidating: false,
      size: 2,
      setSize: mockSetSize,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useIssuesFetch("/api/issues/tanstack"));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.issues).toHaveLength(2);
    expect(result.current.data?.summary).toEqual(page1.summary);
    expect(result.current.data?.pagination?.hasMore).toBe(false);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("returns hasMore true when last page has hasMore", () => {
    const page1 = makeMockResponse(1, true);
    useSWRInfiniteMock.mockReturnValue({
      data: [page1],
      error: null,
      isLoading: false,
      isValidating: false,
      size: 1,
      setSize: mockSetSize,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useIssuesFetch("/api/issues/tanstack"));

    expect(result.current.hasMore).toBe(true);
  });

  it("loadMore calls setSize when hasMore and not loadingMore", () => {
    const page1 = makeMockResponse(1, true);
    useSWRInfiniteMock.mockReturnValue({
      data: [page1],
      error: null,
      isLoading: false,
      isValidating: false,
      size: 1,
      setSize: mockSetSize,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useIssuesFetch("/api/issues/tanstack"));

    result.current.loadMore();

    expect(mockSetSize).toHaveBeenCalledWith(2);
  });

  it("fetchData and retry call mutate", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: [makeMockResponse(1, false)],
      error: null,
      isLoading: false,
      isValidating: false,
      size: 1,
      setSize: mockSetSize,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useIssuesFetch("/api/issues/tanstack"));

    result.current.fetchData();
    expect(mockMutate).toHaveBeenCalledTimes(1);

    result.current.retry();
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });

  it("returns error from SWR", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: undefined,
      error: new Error("API error 503"),
      isLoading: false,
      isValidating: false,
      size: 1,
      setSize: mockSetSize,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useIssuesFetch("/api/issues/tanstack"));

    expect(result.current.error).toBe("API error 503");
  });
});
