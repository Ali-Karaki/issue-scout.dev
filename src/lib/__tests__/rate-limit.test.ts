import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  __resetForTesting,
} from "../rate-limit";

describe("rate-limit", () => {
  describe("checkRateLimit", () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: 0 });
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.RATE_LIMIT_TEST_LIMIT = "10";
      __resetForTesting();
    });

    afterEach(() => {
      delete process.env.RATE_LIMIT_TEST_LIMIT;
      vi.useRealTimers();
    });

    it("allows first request", async () => {
      expect(await checkRateLimit("ip-1")).toBe(true);
    });

    it("allows requests under limit", async () => {
      expect(await checkRateLimit("ip-2")).toBe(true);
      expect(await checkRateLimit("ip-2")).toBe(true);
      expect(await checkRateLimit("ip-2")).toBe(true);
    });

    it("returns false when limit exceeded", async () => {
      for (let i = 0; i < 10; i++) {
        await checkRateLimit("ip-3");
      }
      expect(await checkRateLimit("ip-3")).toBe(false);
    });

    it("resets window after expiry", async () => {
      for (let i = 0; i < 10; i++) {
        await checkRateLimit("ip-4");
      }
      expect(await checkRateLimit("ip-4")).toBe(false);

      vi.advanceTimersByTime(61_001);

      expect(await checkRateLimit("ip-4")).toBe(true);
    });

    it("tracks each key independently", async () => {
      for (let i = 0; i < 10; i++) {
        await checkRateLimit("ip-a");
      }
      expect(await checkRateLimit("ip-a")).toBe(false);

      expect(await checkRateLimit("ip-b")).toBe(true);
    });
  });

  describe("getClientIp", () => {
    it("returns first IP from x-forwarded-for", () => {
      const req = new Request("http://localhost", {
        headers: { "x-forwarded-for": " 192.168.1.1 , 10.0.0.1 " },
      });
      expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("returns x-real-ip when x-forwarded-for is absent", () => {
      const req = new Request("http://localhost", {
        headers: { "x-real-ip": "10.0.0.2" },
      });
      expect(getClientIp(req)).toBe("10.0.0.2");
    });

    it("returns unknown when no IP headers", () => {
      const req = new Request("http://localhost");
      expect(getClientIp(req)).toBe("unknown");
    });
  });
});
