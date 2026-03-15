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

function makeMockResponse(issueCount: number): IssuesResponse {
  return {
    issues: Array.from({ length: issueCount }, (_, i) => ({
      id: `owner/repo#${i + 1}`,
      number: i + 1,
      title: "Test",
      url: "https://github.com/owner/repo/issues/1",
      repo: "owner/repo",
      project: "facebook-react",
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

function createContext(project: string) {
  return { params: Promise.resolve({ project }) };
}

describe("GET /api/issues/[project]", () => {
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

  it("returns 400 for invalid project", async () => {
    const req = new NextRequest("http://localhost:3000/api/issues/invalid");
    const res = await GET(req, createContext("invalid"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid project");
    expect(mockGetCachedIssues).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const req = new NextRequest("http://localhost:3000/api/issues/facebook-react");
    const res = await GET(req, createContext("facebook-react"));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Too many requests");
    expect(mockGetCachedIssues).not.toHaveBeenCalled();
  });

  it("returns 503 when cache is empty and no GITHUB_TOKEN", async () => {
    mockGetCachedIssues.mockResolvedValue(null);
    delete process.env.GITHUB_TOKEN;

    const req = new NextRequest("http://localhost:3000/api/issues/facebook-react");
    const res = await GET(req, createContext("facebook-react"));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("Data not yet available. Try again later.");
    expect(mockFetchIssuesFromGitHub).not.toHaveBeenCalled();
  });

  it("returns 200 with Cache-Control when data available", async () => {
    const data = makeMockResponse(50);
    mockGetCachedIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues/facebook-react?page=1&limit=10"
    );
    const res = await GET(req, createContext("facebook-react"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(10);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 50,
      hasMore: true,
    });
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(mockGetCachedIssues).toHaveBeenCalledWith("facebook-react");
  });

  it("writes to cache when falling back to GitHub", async () => {
    mockGetCachedIssues.mockResolvedValue(null);
    process.env.GITHUB_TOKEN = "test-token";
    const data = makeMockResponse(5);
    mockFetchIssuesFromGitHub.mockResolvedValue(data);

    const req = new NextRequest("http://localhost:3000/api/issues/facebook-react");
    await GET(req, createContext("facebook-react"));

    expect(mockKvSet).toHaveBeenCalledWith(
      "issues:facebook-react",
      data,
      604800
    );
  });
});
