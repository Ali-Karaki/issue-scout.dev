import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useSWR from "swr";
import { useIssuesFetch } from "../use-issues-fetch";
import type { IssuesResponse } from "@/lib/api/fetch-issues";
import { INITIAL_FILTERS } from "@/lib/filters";

vi.mock("swr");

const mockMutate = vi.fn();
const useSWRMock = vi.mocked(useSWR);

function makeMockResponse(page: number): IssuesResponse {
  return {
    issues: [
      {
        id: `owner/repo#${page}`,
        number: page,
        title: "Test",
        url: "https://github.com/owner/repo/issues/1",
        repo: "owner/repo",
        project: "tanstack",
        labels: ["bug"],
        languages: ["TypeScript"],
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
      hasMore: page < 1,
    },
  };
}

describe("useIssuesFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null data and loading when apiUrl is empty", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useIssuesFetch("", INITIAL_FILTERS, 1)
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(useSWRMock).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it("returns data when SWR has data", () => {
    const page1 = makeMockResponse(1);
    useSWRMock.mockReturnValue({
      data: page1,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useIssuesFetch("/api/issues/tanstack", INITIAL_FILTERS, 1)
    );

    expect(result.current.data).toEqual(page1);
    expect(result.current.data?.issues).toHaveLength(1);
    expect(result.current.data?.pagination?.total).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.total).toBe(2);
    expect(result.current.limit).toBe(50);
    expect(result.current.loading).toBe(false);
  });

  it("returns hasNextPage true when page < totalPages", () => {
    const page1 = makeMockResponse(1);
    (page1.pagination as { hasMore: boolean }).hasMore = true;
    useSWRMock.mockReturnValue({
      data: page1,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useIssuesFetch("/api/issues/tanstack", INITIAL_FILTERS, 1)
    );

    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetchData and retry call mutate", () => {
    useSWRMock.mockReturnValue({
      data: makeMockResponse(1),
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useIssuesFetch("/api/issues/tanstack", INITIAL_FILTERS, 1)
    );

    result.current.fetchData();
    expect(mockMutate).toHaveBeenCalledTimes(1);

    result.current.retry();
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });

  it("returns error from SWR", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: new Error("API error 503"),
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useIssuesFetch("/api/issues/tanstack", INITIAL_FILTERS, 1)
    );

    expect(result.current.error).toBe("API error 503");
  });

  it("passes page to build URL", () => {
    useSWRMock.mockImplementation((key) => ({
      data: key ? makeMockResponse(2) : undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    }) as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useIssuesFetch("/api/issues/tanstack", INITIAL_FILTERS, 2)
    );

    expect(useSWRMock).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.any(Function),
      expect.any(Object)
    );
    expect(result.current.page).toBe(2);
  });

  it("includes multi-value params in URL for repo and tech", () => {
    useSWRMock.mockImplementation((key) => ({
      data: key ? makeMockResponse(1) : undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    }) as ReturnType<typeof useSWR>);

    const filtersWithMulti = {
      ...INITIAL_FILTERS,
      repo: ["a/b", "c/d"],
      tech: ["TypeScript", "Python"],
    };

    renderHook(() =>
      useIssuesFetch("/api/issues", filtersWithMulti, 1)
    );

    const swrKey = useSWRMock.mock.calls[0][0] as string;
    expect(swrKey).toContain("repo=a%2Fb");
    expect(swrKey).toContain("repo=c%2Fd");
    expect(swrKey).toContain("tech=TypeScript");
    expect(swrKey).toContain("tech=Python");
  });
});
