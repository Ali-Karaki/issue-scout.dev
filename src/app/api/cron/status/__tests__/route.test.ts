import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

const mockHasKv = vi.fn();
const mockKvGet = vi.fn();
const mockKvListGet = vi.fn();

vi.mock("@/lib/cron-auth", () => ({
  verifyCronSecret: (req: NextRequest) =>
    req.headers.get("authorization") === "Bearer secret123",
}));

vi.mock("@/lib/kv", () => ({
  hasKv: () => mockHasKv(),
  kvGet: (key: string) => mockKvGet(key),
  kvListGet: (key: string) => mockKvListGet(key),
}));

describe("GET /api/cron/status", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when no Authorization header", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/status", {
      method: "GET",
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockKvGet).not.toHaveBeenCalled();
  });

  it("returns 503 when Redis not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const req = new NextRequest("http://localhost:3000/api/cron/status", {
      method: "GET",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("Redis not configured");
    expect(mockKvGet).not.toHaveBeenCalled();
  });

  it("returns nextIndex, retryQueueSize, lockHeld when authorized", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "cron:refresh:index") return Promise.resolve(42);
      if (key === "cron:refresh:lock") return Promise.resolve(1234567890);
      return Promise.resolve(null);
    });
    mockKvListGet.mockResolvedValue(["p1", "p2", "p3"]);

    const req = new NextRequest("http://localhost:3000/api/cron/status", {
      method: "GET",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nextIndex).toBe(42);
    expect(body.retryQueueSize).toBe(3);
    expect(body.lockHeld).toBe(true);
  });

  it("returns lockHeld false when lock key is null", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvGet.mockImplementation((key: string) => {
      if (key === "cron:refresh:index") return Promise.resolve(0);
      if (key === "cron:refresh:lock") return Promise.resolve(null);
      return Promise.resolve(null);
    });
    mockKvListGet.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/cron/status", {
      method: "GET",
      headers: { Authorization: "Bearer secret123" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nextIndex).toBe(0);
    expect(body.retryQueueSize).toBe(0);
    expect(body.lockHeld).toBe(false);
  });
});
