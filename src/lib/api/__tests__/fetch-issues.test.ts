import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getIssuesFromCache,
  getCachedIssues,
  refreshAllProjects,
  refreshProjectsBatch,
  type IssuesResponse,
} from "../fetch-issues";
import { PROJECTS } from "../../projects.config";
import type { RawIssueWithPrCount } from "../../github";

const mockGetIssuesForRepos = vi.fn();
const mockHasKv = vi.fn();
const mockKvGet = vi.fn();
const mockKvSet = vi.fn();
const mockKvSetNx = vi.fn();
const mockKvDel = vi.fn();

vi.mock("../../kv", () => ({
  hasKv: () => mockHasKv(),
  kvGet: (key: string) => mockKvGet(key),
  kvSet: (key: string, value: unknown, ttl: number) =>
    mockKvSet(key, value, ttl),
  kvSetNx: (key: string, value: unknown, ttl: number) =>
    mockKvSetNx(key, value, ttl),
  kvDel: (key: string) => mockKvDel(key),
  kvListGet: async (key: string) => {
    const v = await mockKvGet(key);
    return Array.isArray(v) ? v : [];
  },
  kvListSet: (key: string, value: string[], ttl?: number) =>
    mockKvSet(key, value, ttl ?? 604800),
}));

vi.mock("../../github", () => ({
  getIssuesForRepos: (...args: unknown[]) => mockGetIssuesForRepos(...args),
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
        languages: [],
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
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "issues:all") return Promise.resolve(null);
      const projectId = key.replace("issues:", "");
      return Promise.resolve(makeMockResponse(projectId));
    });

    const result = await getIssuesFromCache(null);

    expect(result).not.toBeNull();
    expect(result!.issues).toHaveLength(PROJECTS.length);
    expect(result!.summary.total).toBe(PROJECTS.length);
    expect(mockKvGet).toHaveBeenCalledWith("issues:all");
  });

  it('"all" projects returns null when any cache miss', async () => {
    const projectWithMiss = PROJECTS[0]!.id;
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "issues:all") return Promise.resolve(null);
      if (key === `issues:${projectWithMiss}`) return Promise.resolve(null);
      const projectId = key.replace("issues:", "");
      return Promise.resolve(makeMockResponse(projectId));
    });

    const result = await getIssuesFromCache(null);

    expect(result).toBeNull();
  });
});

describe("getCachedIssues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached data when KV configured", async () => {
    const cached = makeMockResponse("tanstack");
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(cached);

    const result = await getCachedIssues("tanstack");

    expect(result).toEqual(cached);
    expect(mockKvGet).toHaveBeenCalledWith("issues:tanstack");
  });

  it("returns null when KV configured and cache miss", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(null);

    const result = await getCachedIssues("tanstack");

    expect(result).toBeNull();
  });

  it("falls back to getIssuesFromCache when KV not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const result = await getCachedIssues("tanstack");

    expect(result).toBeNull();
    expect(mockKvGet).not.toHaveBeenCalled();
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
          languages: [],
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
    expect(result.projects).toHaveLength(PROJECTS.length);
    expect(result.projects.every((p) => p.ok)).toBe(true);
    expect(mockGetIssuesForRepos).toHaveBeenCalledTimes(PROJECTS.length);
    expect(mockKvSet).toHaveBeenCalledTimes(PROJECTS.length + 2);
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
      .mockRejectedValueOnce(new Error("GitHub API error"))
      .mockResolvedValue({ raw: [], failedRepos: [] });

    const result = await refreshAllProjects("token");

    expect(result.ok).toBe(false);
    expect(result.projects).toHaveLength(PROJECTS.length);
    const failed = result.projects.find((p) => !p.ok);
    expect(failed?.error).toBe("GitHub API error");
  });
});

describe("refreshProjectsBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKvSetNx.mockResolvedValue(true);
    mockKvDel.mockResolvedValue(true);
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
          languages: [],
        };
        return { raw: [raw], failedRepos: [] };
      }
    );
  });

  it("returns error when KV not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const result = await refreshProjectsBatch("token");

    expect(result.ok).toBe(false);
    expect(result.nextIndex).toBe(0);
    expect(result.cycleComplete).toBe(false);
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
    expect(mockKvSet).not.toHaveBeenCalled();
  });

  it("returns skipped when lock is held", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvSetNx.mockResolvedValue(false);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "cron:refresh:index") return Promise.resolve(5);
      if (key === "cron:retry:queue") return Promise.resolve(["p1", "p2"]);
      return Promise.resolve(null);
    });

    const result = await refreshProjectsBatch("token");

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("lock held");
    expect(result.nextIndex).toBe(5);
    expect(result.retryQueueSize).toBe(2);
    expect(result.projects).toEqual([]);
    expect(mockGetIssuesForRepos).not.toHaveBeenCalled();
    expect(mockKvDel).not.toHaveBeenCalled();
  });

  it("fetches batch and updates index when KV configured", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockResolvedValue(0);
    mockKvSet.mockResolvedValue(true);

    const result = await refreshProjectsBatch("token");

    expect(result.ok).toBe(true);
    expect(result.projects.length).toBeLessThanOrEqual(10);
    expect(result.nextIndex).toBe(result.projects.length);
    expect(mockKvGet).toHaveBeenCalledWith("cron:refresh:index");
    expect(mockGetIssuesForRepos).toHaveBeenCalledTimes(result.projects.length);
  });

  it("adds failed projects to retry queue and only advances index for successes", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "cron:refresh:index") return Promise.resolve(0);
      if (key === "cron:retry:queue") return Promise.resolve([]);
      if (key === "cron:retry:counts") return Promise.resolve(null);
      return Promise.resolve(null);
    });
    mockKvSet.mockResolvedValue(true);

    let callCount = 0;
    mockGetIssuesForRepos.mockImplementation(
      async (_repos: string[], projectId: string) => {
        callCount++;
        if (projectId === PROJECTS[1]!.id) {
          throw new Error("Rate limited");
        }
        const raw: RawIssueWithPrCount = {
          issue: {
            number: 1,
            title: "Test",
            state: "open",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: "https://github.com/owner/repo/issues/1",
            comments: 0,
            labels: [],
          },
          repo: "owner/repo",
          project: projectId,
          matchedOpenPrs: 0,
          languages: [],
        };
        return { raw: [raw], failedRepos: [] };
      }
    );

    const result = await refreshProjectsBatch("token");

    expect(result.ok).toBe(false);
    expect(result.retryQueueSize).toBe(1);
    expect(result.nextIndex).toBe(9);
    expect(mockKvSet).toHaveBeenCalledWith(
      "cron:retry:queue",
      [PROJECTS[1]!.id],
      expect.any(Number)
    );
  });

  it("drops failed project from retry queue when at cap", async () => {
    const fullQueue = Array.from({ length: 60 }, (_, i) => PROJECTS[i % PROJECTS.length]!.id);
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "cron:refresh:index") return Promise.resolve(0);
      if (key === "cron:retry:queue") return Promise.resolve(fullQueue);
      if (key === "cron:retry:counts") return Promise.resolve({});
      return Promise.resolve(null);
    });
    mockKvSet.mockResolvedValue(true);

    let callCount = 0;
    mockGetIssuesForRepos.mockImplementation(
      async (_repos: string[], projectId: string) => {
        callCount++;
        if (callCount === 1) throw new Error("Rate limited");
        const raw: RawIssueWithPrCount = {
          issue: {
            number: 1,
            title: "Test",
            state: "open",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: "https://github.com/owner/repo/issues/1",
            comments: 0,
            labels: [],
          },
          repo: "owner/repo",
          project: projectId,
          matchedOpenPrs: 0,
          languages: [],
        };
        return { raw: [raw], failedRepos: [] };
      }
    );

    const result = await refreshProjectsBatch("token");

    expect(result.ok).toBe(false);
    expect(result.retryQueueSize).toBe(50);
    expect(mockKvSet).toHaveBeenCalledWith(
      "cron:retry:queue",
      expect.any(Array),
      expect.any(Number)
    );
    const retryQueueArg = mockKvSet.mock.calls.find(
      (c) => c[0] === "cron:retry:queue"
    )?.[1] as string[];
    expect(retryQueueArg.length).toBe(50);
  });

  it("rebuilds issues:all when cycle completes", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "cron:refresh:index") {
        return Promise.resolve(PROJECTS.length - 3);
      }
      if (key.startsWith("issues:")) {
        const id = key.replace("issues:", "");
        if (id === "all" || id === "summary") return Promise.resolve(null);
        return Promise.resolve(makeMockResponse(id));
      }
      return Promise.resolve(null);
    });
    mockKvSet.mockResolvedValue(true);

    const result = await refreshProjectsBatch("token");

    expect(result.cycleComplete).toBe(true);
    expect(mockKvSet).toHaveBeenCalledWith(
      "issues:all",
      expect.any(Object),
      expect.any(Number)
    );
    expect(mockKvSet).toHaveBeenCalledWith(
      "issues:summary",
      expect.any(Object),
      expect.any(Number)
    );
  });
});
