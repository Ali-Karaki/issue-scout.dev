import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchIssues } from "../fetch-issues";
import type { IssuesResponse } from "../fetch-issues";
import type { RawIssueWithPrCount } from "../../github";

const mockGetIssuesForRepos = vi.fn();
const mockHasKv = vi.fn();
const mockKvGet = vi.fn();
const mockKvSet = vi.fn();

vi.mock("../../github", () => ({
  getIssuesForRepos: (...args: unknown[]) => mockGetIssuesForRepos(...args),
}));

vi.mock("../../kv", () => ({
  hasKv: () => mockHasKv(),
  kvGet: (key: string) => mockKvGet(key),
  kvSet: (key: string, value: unknown, ttl: number) =>
    mockKvSet(key, value, ttl),
}));

function makeMockResponse(ecosystemId: string): IssuesResponse {
  return {
    issues: [
      {
        id: "owner/repo#1",
        number: 1,
        title: "Test",
        url: "https://github.com/owner/repo/issues/1",
        repo: "owner/repo",
        ecosystem: ecosystemId,
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
      total: 1,
      likelyUnclaimed: 1,
      beginnerFriendly: 0,
      stale: 0,
      reposCovered: 1,
      failedRepos: [],
    },
  };
}

describe("fetchIssues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIssuesForRepos.mockImplementation(
      async (_repos: string[], ecosystemId: string) => {
        const raw: RawIssueWithPrCount = {
          issue: {
            number: 1,
            title: "Test",
            state: "open",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: "https://github.com/owner/repo/issues/1",
            comments: 0,
            labels: [{ name: "bug" }],
          },
          repo: "owner/repo",
          ecosystem: ecosystemId,
          matchedOpenPrs: 0,
        };
        return { raw: [raw], failedRepos: [] };
      }
    );
  });

  it("single ecosystem, KV configured, cache hit returns cached data", async () => {
    const cached = makeMockResponse("tanstack");
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(cached);

    const result = await fetchIssues("tanstack", "token");

    expect(result).toEqual(cached);
    expect(mockKvGet).toHaveBeenCalledWith("issues:tanstack");
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
    expect(mockKvSet).not.toHaveBeenCalled();
  });

  it("single ecosystem, KV configured, cache miss fetches and sets", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(null);
    mockKvSet.mockResolvedValue(true);

    const result = await fetchIssues("tanstack", "token");

    expect(mockKvGet).toHaveBeenCalledWith("issues:tanstack");
    expect(mockGetIssuesForRepos).toHaveBeenCalled();
    expect(mockKvSet).toHaveBeenCalledWith(
      "issues:tanstack",
      expect.objectContaining({
        issues: expect.any(Array),
        summary: expect.objectContaining({ total: expect.any(Number) }),
      }),
      expect.any(Number)
    );
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.summary.total).toBeGreaterThan(0);
  });

  it("single ecosystem, KV not configured, throws", async () => {
    mockHasKv.mockReturnValue(false);

    await expect(fetchIssues("tanstack", "token")).rejects.toThrow(
      "Redis cache required"
    );
    expect(mockKvGet).not.toHaveBeenCalled();
    expect(mockKvSet).not.toHaveBeenCalled();
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
  });

  it('"all" ecosystems merges results', async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(null);
    mockKvSet.mockResolvedValue(true);

    const result = await fetchIssues(null, "token");

    expect(mockGetIssuesForRepos).toHaveBeenCalledTimes(2); // tanstack + vercel
    expect(result.issues).toBeDefined();
    expect(result.summary.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.summary.failedRepos)).toBe(true);
  });

  it("invalid ecosystem throws", async () => {
    await expect(fetchIssues("invalid-eco", "token")).rejects.toThrow(
      "Unknown ecosystem"
    );
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
  });
});
