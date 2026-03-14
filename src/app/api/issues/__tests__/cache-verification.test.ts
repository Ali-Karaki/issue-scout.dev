/**
 * Verifies that unstable_cache is working: second identical request should not
 * call getCachedIssues (cache hit). Uses a cache-aware mock for unstable_cache.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import type { IssuesResponse } from "@/lib/api/fetch-issues";

const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn();
const mockHasKv = vi.fn();
const mockGetCachedIssues = vi.fn();
const mockFetchIssuesFromGitHub = vi.fn();
const mockKvSet = vi.fn();

const cache = new Map<string, unknown>();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (ip: string) => mockCheckRateLimit(ip),
  getClientIp: () => mockGetClientIp(),
}));

vi.mock("@/lib/kv", () => ({
  hasKv: () => mockHasKv(),
  kvSet: (...args: unknown[]) => mockKvSet(...args),
}));

vi.mock("@/lib/api/fetch-issues", () => ({
  getCachedIssues: (project: string | null) => mockGetCachedIssues(project),
  fetchIssuesFromGitHub: () => mockFetchIssuesFromGitHub(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: () => Promise<unknown>,
    keyParts: string[],
    _options?: { revalidate?: number; tags?: string[] }
  ) => {
    const key = keyParts.join(":");
    return async () => {
      if (cache.has(key)) return cache.get(key);
      const result = await fn();
      cache.set(key, result);
      return result;
    };
  },
}));

function makeMockResponse(issueCount: number): IssuesResponse {
  return {
    issues: Array.from({ length: issueCount }, (_, i) => ({
      id: `owner/repo#${i + 1}`,
      number: i + 1,
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
    })),
    summary: {
      total: issueCount,
      likelyUnclaimed: issueCount,
      beginnerFriendly: 0,
      stale: 0,
      reposCovered: 1,
      failedRepos: [],
    },
  };
}

describe("GET /api/issues cache verification", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
    process.env = { ...originalEnv, NODE_ENV: "production" };
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockHasKv.mockReturnValue(true);
    mockKvSet.mockResolvedValue(true);
    mockGetCachedIssues.mockResolvedValue(makeMockResponse(10));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("second identical request hits cache (getCachedIssues called once)", async () => {
    const url = "http://localhost:3000/api/issues?page=1&limit=10";
    const req1 = new NextRequest(url);
    const req2 = new NextRequest(url);

    const res1 = await GET(req1);
    expect(res1.status).toBe(200);

    const res2 = await GET(req2);
    expect(res2.status).toBe(200);

    // With cache working, getCachedIssues runs once; second request is cache hit
    expect(mockGetCachedIssues).toHaveBeenCalledTimes(1);
  });
});
