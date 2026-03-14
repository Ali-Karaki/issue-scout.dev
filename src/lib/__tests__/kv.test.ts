import { vi, describe, it, expect, beforeEach } from "vitest";
import { hasKv, kvGet, kvSet, __resetForTesting } from "../kv";

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
  })),
}));

function setKvEnv() {
  process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
}

function unsetKvEnv() {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

describe("kv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unsetKvEnv();
    __resetForTesting();
  });

  describe("hasKv", () => {
    it("returns false when env unset", () => {
      expect(hasKv()).toBe(false);
    });

    it("returns true when env set", () => {
      setKvEnv();
      __resetForTesting();

      expect(hasKv()).toBe(true);
    });
  });

  describe("kvGet", () => {
    it("returns null when unconfigured", async () => {
      expect(await kvGet("x")).toBe(null);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("returns null when configured but key missing", async () => {
      setKvEnv();
      __resetForTesting();
      mockGet.mockResolvedValue(null);

      expect(await kvGet("x")).toBe(null);
      expect(mockGet).toHaveBeenCalledWith("x");
    });

    it("returns value on hit", async () => {
      setKvEnv();
      __resetForTesting();
      mockGet.mockResolvedValue({ a: 1 });

      expect(await kvGet<{ a: number }>("x")).toEqual({ a: 1 });
      expect(mockGet).toHaveBeenCalledWith("x");
    });

    it("returns null on Redis error", async () => {
      setKvEnv();
      __resetForTesting();
      mockGet.mockRejectedValue(new Error("Redis error"));

      expect(await kvGet("x")).toBe(null);
    });
  });

  describe("kvSet", () => {
    it("returns false when unconfigured", async () => {
      expect(await kvSet("x", { v: 1 }, 60)).toBe(false);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("returns true on success", async () => {
      setKvEnv();
      __resetForTesting();
      mockSet.mockResolvedValue("OK");

      expect(await kvSet("x", { v: 1 }, 60)).toBe(true);
      expect(mockSet).toHaveBeenCalledWith("x", { v: 1 }, { ex: 60 });
    });

    it("returns false on Redis error", async () => {
      setKvEnv();
      __resetForTesting();
      mockSet.mockRejectedValue(new Error("Redis error"));

      expect(await kvSet("x", { v: 1 }, 60)).toBe(false);
    });
  });
});
