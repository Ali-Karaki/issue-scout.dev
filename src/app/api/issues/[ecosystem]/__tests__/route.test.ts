import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import type { IssuesResponse } from "@/lib/api/fetch-issues";

const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn();
const mockHasKv = vi.fn();
const mockGetIssuesFromCache = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (ip: string) => mockCheckRateLimit(ip),
  getClientIp: (req: Request) => mockGetClientIp(req),
}));

vi.mock("@/lib/kv", () => ({
  hasKv: () => mockHasKv(),
}));

vi.mock("@/lib/api/fetch-issues", () => ({
  getIssuesFromCache: (ecosystem: string) =>
    mockGetIssuesFromCache(ecosystem),
}));

function makeMockResponse(ecosystemId: string, issueCount: number): IssuesResponse {
  return {
    issues: Array.from({ length: issueCount }, (_, i) => ({
      id: `owner/repo#${i + 1}`,
      number: i + 1,
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

describe("GET /api/issues/[ecosystem]", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockHasKv.mockReturnValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const req = new NextRequest("http://localhost:3000/api/issues/tanstack");
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "tanstack" }),
    });
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Too many requests");
    expect(mockGetIssuesFromCache).not.toHaveBeenCalled();
  });

  it("returns 503 when Redis not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const req = new NextRequest("http://localhost:3000/api/issues/tanstack");
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "tanstack" }),
    });
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain("Redis cache required");
    expect(mockGetIssuesFromCache).not.toHaveBeenCalled();
  });

  it("returns 503 when cache is empty", async () => {
    mockGetIssuesFromCache.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/issues/tanstack");
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "tanstack" }),
    });
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("Data not yet available. Try again later.");
    expect(res.headers.get("Retry-After")).toBe("300");
  });

  it("returns 400 for invalid ecosystem", async () => {
    const req = new NextRequest("http://localhost:3000/api/issues/invalid-eco");
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "invalid-eco" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid ecosystem");
    expect(mockGetIssuesFromCache).not.toHaveBeenCalled();
  });

  it("returns 500 when getIssuesFromCache throws", async () => {
    mockGetIssuesFromCache.mockRejectedValue(new Error("Cache error"));

    const req = new NextRequest("http://localhost:3000/api/issues/tanstack");
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "tanstack" }),
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Cache error");
  });

  it("returns success with pagination and Cache-Control", async () => {
    const data = makeMockResponse("tanstack", 50);
    mockGetIssuesFromCache.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues/tanstack?page=2&limit=10"
    );
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "tanstack" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(10);
    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      hasMore: true,
    });
    expect(body.summary).toEqual(data.summary);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
    expect(mockGetIssuesFromCache).toHaveBeenCalledWith("tanstack");
  });

  it("sanitizes invalid page and limit to defaults", async () => {
    const data = makeMockResponse("vercel", 5);
    mockGetIssuesFromCache.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues/vercel?page=-1&limit=999"
    );
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "vercel" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(100);
  });

  it("applies sort param server-side", async () => {
    const data = makeMockResponse("tanstack", 10);
    data.issues = data.issues.map((issue, i) => ({
      ...issue,
      comments: 10 - i,
      updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    mockGetIssuesFromCache.mockResolvedValue(data);

    const req = new NextRequest(
      "http://localhost:3000/api/issues/tanstack?sort=most_comments&page=1&limit=5"
    );
    const res = await GET(req, {
      params: Promise.resolve({ ecosystem: "tanstack" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.issues).toHaveLength(5);
    expect(body.issues[0].comments).toBe(10);
    expect(body.issues[4].comments).toBe(6);
  });
});
