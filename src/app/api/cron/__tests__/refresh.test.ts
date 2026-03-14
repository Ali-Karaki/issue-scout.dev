import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../refresh/route";

const mockRefreshAllProjects = vi.fn();

vi.mock("@/lib/api/fetch-issues", () => ({
  refreshAllProjects: (token: string) => mockRefreshAllProjects(token),
}));

describe("POST /api/cron/refresh", () => {
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

    const req = new NextRequest("http://localhost:3000/api/cron/refresh", {
      method: "POST",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockRefreshAllProjects).not.toHaveBeenCalled();
  });

  it("returns 401 when wrong CRON_SECRET", async () => {
    process.env.CRON_SECRET = "secret123";
    process.env.GITHUB_TOKEN = "gh_token";

    const req = new NextRequest("http://localhost:3000/api/cron/refresh", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockRefreshAllProjects).not.toHaveBeenCalled();
  });

  it("returns 503 when GITHUB_TOKEN missing", async () => {
    process.env.CRON_SECRET = "secret123";
    delete process.env.GITHUB_TOKEN;

    const req = new NextRequest("http://localhost:3000/api/cron/refresh", {
      method: "POST",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("GitHub token required for refresh");
    expect(mockRefreshAllProjects).not.toHaveBeenCalled();
  });

  it("returns 200 and calls refreshAllProjects when authorized", async () => {
    process.env.CRON_SECRET = "secret123";
    process.env.GITHUB_TOKEN = "gh_token";

    mockRefreshAllProjects.mockResolvedValue({ ok: true, projects: [] });

    const req = new NextRequest("http://localhost:3000/api/cron/refresh", {
      method: "POST",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockRefreshAllProjects).toHaveBeenCalledWith("gh_token");
  });

  it("accepts x-cron-secret header", async () => {
    process.env.CRON_SECRET = "secret123";
    process.env.GITHUB_TOKEN = "gh_token";

    mockRefreshAllProjects.mockResolvedValue({ ok: true, projects: [] });

    const req = new NextRequest("http://localhost:3000/api/cron/refresh", {
      method: "POST",
      headers: { "x-cron-secret": "secret123" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockRefreshAllProjects).toHaveBeenCalled();
  });
});
