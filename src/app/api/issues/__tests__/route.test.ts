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

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (ip: string) => mockCheckRateLimit(ip),
  getClientIp: (req: Request) => mockGetClientIp(req),
}));

vi.mock("@/lib/kv", () => ({
  hasKv: () => mockHasKv(),
  kvSet: (...args: unknown[]) => mockKvSet(...args),
}));

vi.mock("@/lib/api/fetch-issues", () => ({
  getCachedIssues: (project: string | null) => mockGetCachedIssues(project),
  fetchIssuesFromGitHub: (project: string | null, _token: string) =>
    mockFetchIssuesFromGitHub(project, _token),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
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

describe("GET /api/issues", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: "production" };
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockHasKv.mockReturnValue(true);
    mockKvSet.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Too many requests");
    expect(mockGetCachedIssues).not.toHaveBeenCalled();
  });

  it("returns 503 when Redis not configured and no GITHUB_TOKEN", async () => {
    mockHasKv.mockReturnValue(false);
    delete process.env.GITHUB_TOKEN;

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain("Redis cache required");
    expect(mockGetCachedIssues).not.toHaveBeenCalled();
  });

  it("returns 503 when cache is empty and no GITHUB_TOKEN", async () => {
    mockGetCachedIssues.mockResolvedValue(null);
    delete process.env.GITHUB_TOKEN;

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("Data not yet available. Try again later.");
    expect(res.headers.get("Retry-After")).toBe("300");
    expect(mockFetchIssuesFromGitHub).not.toHaveBeenCalled();
  });

  it("returns 200 from GitHub fallback when cache empty and GITHUB_TOKEN set", async () => {
    mockGetCachedIssues.mockResolvedValue(null);
    process.env.GITHUB_TOKEN = "test-token";
    const data = makeMockResponse(5);
    mockFetchIssuesFromGitHub.mockResolvedValue(data);

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(5);
    expect(mockFetchIssuesFromGitHub).toHaveBeenCalledWith(null, "test-token");
  });

  it("writes to cache when falling back to GitHub", async () => {
    mockGetCachedIssues.mockResolvedValue(null);
    process.env.GITHUB_TOKEN = "test-token";
    const data = makeMockResponse(3);
    mockFetchIssuesFromGitHub.mockResolvedValue(data);

    const req = new NextRequest("http://localhost:3000/api/issues");
    await GET(req);

    expect(mockKvSet).toHaveBeenCalledWith(
      "issues:all",
      data,
      604800
    );
  });

  it("allows GitHub fallback when Redis not configured but GITHUB_TOKEN set", async () => {
    mockHasKv.mockReturnValue(false);
    process.env.GITHUB_TOKEN = "test-token";
    const data = makeMockResponse(2);
    mockFetchIssuesFromGitHub.mockResolvedValue(data);

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(2);
    expect(mockFetchIssuesFromGitHub).toHaveBeenCalledWith(null, "test-token");
    expect(mockKvSet).not.toHaveBeenCalled();
  });

  it("returns 500 when getIssuesFromCache throws", async () => {
    mockGetCachedIssues.mockRejectedValue(new Error("Cache error"));

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error"); // production mode hides error details
  });

  it("returns success with pagination and Cache-Control", async () => {
    const data = makeMockResponse(100);
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?page=1&limit=10"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(10);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 100,
      hasMore: true,
    });
    expect(body.summary).toEqual(data.summary);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(mockGetCachedIssues).toHaveBeenCalledWith(null);
  });

  it("sanitizes invalid page and limit to defaults", async () => {
    const data = makeMockResponse(5);
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?page=abc&limit=xyz"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(50);
  });

  it("returns 400 for invalid project", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/issues?project=invalid"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid project");
    expect(mockGetCachedIssues).not.toHaveBeenCalled();
  });

  it("treats empty project as all projects", async () => {
    const data = makeMockResponse(10);
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?project="
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetCachedIssues).toHaveBeenCalledWith(null);
    expect(body.issues).toHaveLength(10);
  });

  it("applies status filter server-side", async () => {
    const data = makeMockResponse(20);
    data.issues = data.issues.map((issue, i) => ({
      ...issue,
      status: i < 5 ? "likely_unclaimed" : "possible_wip",
    }));
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?status=likely_unclaimed&page=1&limit=50"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(5);
    expect(body.pagination.total).toBe(5);
    expect(body.issues.every((i: { status: string }) => i.status === "likely_unclaimed")).toBe(true);
  });

  it("applies tech filter server-side", async () => {
    const data = makeMockResponse(10);
    data.issues = data.issues.map((issue, i) => ({
      ...issue,
      id: `owner/repo#${i + 1}`,
      languages: i < 3 ? ["TypeScript", "JavaScript"] : ["Python"],
    }));
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?tech=TypeScript&page=1&limit=50"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(3);
    expect(body.pagination.total).toBe(3);
    expect(body.issues.every((i: { languages: string[] }) => i.languages?.includes("TypeScript"))).toBe(true);
  });

  it("applies multi-tech filter server-side", async () => {
    const data = makeMockResponse(10);
    data.issues = data.issues.map((issue, i) => ({
      ...issue,
      id: `owner/repo#${i + 1}`,
      languages: i < 3 ? ["TypeScript"] : i < 6 ? ["Python"] : ["Rust"],
    }));
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?tech=TypeScript&tech=Python&page=1&limit=50"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(6);
    expect(body.pagination.total).toBe(6);
  });

  it("applies multi-repo filter server-side", async () => {
    const data = makeMockResponse(6);
    data.issues = data.issues.map((issue, i) => ({
      ...issue,
      id: `repo-${i}#1`,
      repo: i < 2 ? "a/b" : i < 4 ? "c/d" : "e/f",
    }));
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?repo=a%2Fb&repo=e%2Ff&page=1&limit=50"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(4);
    expect(body.pagination.total).toBe(4);
    expect(body.issues.every((i: { repo: string }) => ["a/b", "e/f"].includes(i.repo))).toBe(true);
  });

});
