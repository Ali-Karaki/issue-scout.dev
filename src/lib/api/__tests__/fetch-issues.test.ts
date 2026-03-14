import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getIssuesFromCache,
  refreshAllProjects,
  type IssuesResponse,
} from "../fetch-issues";
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

function makeMockResponse(projectId: string): IssuesResponse {
  return {
    issues: [
      {
        id: "owner/repo#1",
        number: 1,
        title: "Test",
        url: "https://github.com/owner/repo/issues/1",
        repo: "owner/repo",
        project: projectId,
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

describe("getIssuesFromCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("single project, KV configured, cache hit returns cached data", async () => {
    const cached = makeMockResponse("tanstack");
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(cached);

    const result = await getIssuesFromCache("tanstack");

    expect(result).toEqual(cached);
    expect(mockKvGet).toHaveBeenCalledWith("issues:tanstack");
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
  });

  it("single project, KV configured, cache miss returns null", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(null);

    const result = await getIssuesFromCache("tanstack");

    expect(result).toBeNull();
    expect(mockKvGet).toHaveBeenCalledWith("issues:tanstack");
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
  });

  it("single project, KV not configured, returns null", async () => {
    mockHasKv.mockReturnValue(false);

    const result = await getIssuesFromCache("tanstack");

    expect(result).toBeNull();
    expect(mockKvGet).not.toHaveBeenCalled();
  });

  it('"all" projects returns issues:all when present', async () => {
    const combined = makeMockResponse("tanstack");
    combined.issues = [
      ...combined.issues,
      { ...combined.issues[0], id: "owner/repo#2", project: "vercel" },
    ];
    combined.summary = { ...combined.summary, total: 2 };
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValueOnce(combined);

    const result = await getIssuesFromCache(null);

    expect(result).toEqual(combined);
    expect(mockKvGet).toHaveBeenCalledTimes(1);
    expect(mockKvGet).toHaveBeenCalledWith("issues:all");
  });

  it('"all" projects merges per-project results when issues:all miss', async () => {
    const tanstack = makeMockResponse("tanstack");
    const vercel = makeMockResponse("vercel");
    mockHasKv.mockReturnValue(true);
    mockKvGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(tanstack)
      .mockResolvedValueOnce(vercel);

    const result = await getIssuesFromCache(null);

    expect(result).not.toBeNull();
    expect(result!.issues).toHaveLength(2);
    expect(result!.summary.total).toBe(2);
    expect(mockKvGet).toHaveBeenCalledWith("issues:all");
  });

  it('"all" projects returns null when any cache miss', async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeMockResponse("tanstack"))
      .mockResolvedValueOnce(null);

    const result = await getIssuesFromCache(null);

    expect(result).toBeNull();
  });
});

describe("refreshAllProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIssuesForRepos.mockImplementation(
      async (_repos: string[], projectId: string) => {
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
          project: projectId,
          matchedOpenPrs: 0,
        };
        return { raw: [raw], failedRepos: [] };
      }
    );
  });

  it("fetches and writes all projects when KV configured", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvSet.mockResolvedValue(true);

    const result = await refreshAllProjects("token");

    expect(result.ok).toBe(true);
    expect(result.projects).toHaveLength(2);
    expect(result.projects.every((p) => p.ok)).toBe(true);
    expect(mockGetIssuesForRepos).toHaveBeenCalledTimes(2);
    expect(mockKvSet).toHaveBeenCalledTimes(3);
  });

  it("returns error when KV not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const result = await refreshAllProjects("token");

    expect(result.ok).toBe(false);
    expect(result.projects.every((p) => !p.ok && p.error === "Redis cache required")).toBe(true);
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
    expect(mockKvSet).not.toHaveBeenCalled();
  });

  it("reports partial failure when one project fails", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvSet.mockResolvedValue(true);
    mockGetIssuesForRepos
      .mockResolvedValueOnce({ raw: [], failedRepos: [] })
      .mockRejectedValueOnce(new Error("GitHub API error"));

    const result = await refreshAllProjects("token");

    expect(result.ok).toBe(false);
    expect(result.projects).toHaveLength(2);
    const failed = result.projects.find((p) => !p.ok);
    expect(failed?.error).toBe("GitHub API error");
  });
});
