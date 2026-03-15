import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

const mockRefreshProjectsBatch = vi.fn();
const mockRevalidateTag = vi.fn();

vi.mock("@/lib/api/fetch-issues", () => ({
  refreshProjectsBatch: (token: string) => mockRefreshProjectsBatch(token),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string, profile?: string) =>
    mockRevalidateTag(tag, profile),
}));

describe("POST /api/cron/refresh-batch", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when no Authorization header", async () => {
    process.env.CRON_SECRET = "secret123";

    const req = new NextRequest("http://localhost:3000/api/cron/refresh-batch", {
      method: "POST",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockRefreshProjectsBatch).not.toHaveBeenCalled();
  });

  it("returns 503 when GITHUB_TOKEN missing", async () => {
    process.env.CRON_SECRET = "secret123";
    delete process.env.GITHUB_TOKEN;

    const req = new NextRequest("http://localhost:3000/api/cron/refresh-batch", {
      method: "POST",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("GitHub token required for refresh");
    expect(mockRefreshProjectsBatch).not.toHaveBeenCalled();
  });

  it("returns 200 and calls refreshProjectsBatch when authorized", async () => {
    process.env.CRON_SECRET = "secret123";
    process.env.GITHUB_TOKEN = "gh_token";

    mockRefreshProjectsBatch.mockResolvedValue({
      ok: true,
      projects: [{ id: "facebook-react", ok: true }],
      nextIndex: 1,
      cycleComplete: false,
      retryQueueSize: 0,
    });

    const req = new NextRequest("http://localhost:3000/api/cron/refresh-batch", {
      method: "POST",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.refreshed).toEqual(["facebook-react"]);
    expect(body.nextIndex).toBe(1);
    expect(body.cycleComplete).toBe(false);
    expect(body.retryQueueSize).toBe(0);
    expect(mockRefreshProjectsBatch).toHaveBeenCalledWith("gh_token");
    expect(mockRevalidateTag).toHaveBeenCalledWith("issues", "max");
  });

  it("returns 200 with skipped when lock held and does not revalidate", async () => {
    process.env.CRON_SECRET = "secret123";
    process.env.GITHUB_TOKEN = "gh_token";

    mockRefreshProjectsBatch.mockResolvedValue({
      ok: false,
      projects: [],
      nextIndex: 5,
      cycleComplete: false,
      retryQueueSize: 2,
      skipped: true,
      reason: "lock held",
    });

    const req = new NextRequest("http://localhost:3000/api/cron/refresh-batch", {
      method: "POST",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("lock held");
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("calls revalidateTag when some projects succeed", async () => {
    process.env.CRON_SECRET = "secret123";
    process.env.GITHUB_TOKEN = "gh_token";

    mockRefreshProjectsBatch.mockResolvedValue({
      ok: false,
      projects: [
        { id: "p1", ok: true },
        { id: "p2", ok: false, error: "Rate limited" },
      ],
      nextIndex: 2,
      cycleComplete: false,
      retryQueueSize: 1,
    });

    const req = new NextRequest("http://localhost:3000/api/cron/refresh-batch", {
      method: "POST",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(207);
    expect(body.refreshed).toEqual(["p1"]);
    expect(body.failed).toEqual([{ id: "p2", error: "Rate limited" }]);
    expect(mockRevalidateTag).toHaveBeenCalledWith("issues", "max");
  });
});
