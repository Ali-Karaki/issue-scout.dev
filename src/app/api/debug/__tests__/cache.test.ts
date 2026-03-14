import { vi, describe, it, expect, beforeEach } from "vitest";
import { GET } from "../cache/route";

const mockHasKv = vi.fn();
const mockKvGet = vi.fn();
const mockKvSet = vi.fn();

vi.mock("@/lib/kv", () => ({
  hasKv: () => mockHasKv(),
  kvGet: (key: string) => mockKvGet(key),
  kvSet: (key: string, value: unknown, ttl: number) => mockKvSet(key, value, ttl),
}));

describe("GET /api/debug/cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not configured when Redis not configured", async () => {
    mockHasKv.mockReturnValue(false);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redis).toBe("not configured");
    expect(body.message).toContain("UPSTASH_REDIS_REST");
    expect(mockKvGet).not.toHaveBeenCalled();
    expect(mockKvSet).not.toHaveBeenCalled();
  });

  it("returns ok when Redis configured and get/set succeed", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvSet.mockResolvedValue(true);
    mockKvGet.mockResolvedValue({ ping: 12345 });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redis).toBe("ok");
    expect(body.configured).toBe(true);
    expect(body.write).toBe("ok");
    expect(body.read).toBe("ok");
    expect(body.sample).toEqual({ ping: 12345 });
    expect(mockKvSet).toHaveBeenCalled();
    expect(mockKvGet).toHaveBeenCalled();
  });

  it("returns 500 when Redis configured but set throws", async () => {
    mockHasKv.mockReturnValue(true);
    mockKvSet.mockRejectedValue(new Error("Connection refused"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.redis).toBe("error");
    expect(body.configured).toBe(true);
    expect(body.error).toBe("Connection refused");
  });
});
