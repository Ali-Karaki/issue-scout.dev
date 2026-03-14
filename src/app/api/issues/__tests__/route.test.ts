import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import type { IssuesResponse } from "@/lib/api/fetch-issues";

const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn();
const mockHasKv = vi.fn();
const mockFetchIssues = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (ip: string) => mockCheckRateLimit(ip),
  getClientIp: (req: Request) => mockGetClientIp(req),
}));

vi.mock("@/lib/kv", () => ({
  hasKv: () => mockHasKv(),
}));

vi.mock("@/lib/api/fetch-issues", () => ({
  fetchIssues: (ecosystem: string | null, token: string) =>
    mockFetchIssues(ecosystem, token),
}));

function makeMockResponse(issueCount: number): IssuesResponse {
  return {
    issues: Array.from({ length: issueCount }, (_, i) => ({
      id: `owner/repo#${i + 1}`,
      number: i + 1,
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
    process.env = { ...originalEnv, GITHUB_TOKEN: "valid-token", PAT: "" };
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockHasKv.mockReturnValue(true);
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
    expect(mockFetchIssues).not.toHaveBeenCalled();
  });

  it("returns 503 when GITHUB_TOKEN is missing", async () => {
    process.env.GITHUB_TOKEN = "";
    process.env.PAT = "";

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("GitHub token required");
    expect(mockFetchIssues).not.toHaveBeenCalled();
  });

  it("returns 503 when GITHUB_TOKEN is placeholder", async () => {
    process.env.GITHUB_TOKEN = "your_github_token_here";

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("GitHub token required");
  });

  it("returns 503 when Redis not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain("Redis cache required");
    expect(mockFetchIssues).not.toHaveBeenCalled();
  });

  it("returns 500 when fetchIssues throws", async () => {
    mockFetchIssues.mockRejectedValue(new Error("GitHub API error"));

    const req = new NextRequest("http://localhost:3000/api/issues");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("GitHub API error");
  });

  it("returns success with pagination and Cache-Control", async () => {
    const data = makeMockResponse(100);
    mockFetchIssues.mockResolvedValue(data);

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
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
    expect(mockFetchIssues).toHaveBeenCalledWith(null, "valid-token");
  });

  it("sanitizes invalid page and limit to defaults", async () => {
    const data = makeMockResponse(5);
    mockFetchIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?page=abc&limit=xyz"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(50);
  });

  it("returns 400 for invalid ecosystem", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/issues?ecosystem=invalid"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid ecosystem");
    expect(mockFetchIssues).not.toHaveBeenCalled();
  });

  it("treats empty ecosystem as all ecosystems", async () => {
    const data = makeMockResponse(10);
    mockFetchIssues.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues?ecosystem="
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockFetchIssues).toHaveBeenCalledWith(null, "valid-token");
    expect(body.issues).toHaveLength(10);
  });
});
