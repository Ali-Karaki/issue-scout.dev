import { test, expect } from "@playwright/test";

test.describe("Debug cache endpoint", () => {
  test("returns cache status (ok or not configured)", async ({ request }) => {
    const res = await request.get("/api/debug/cache");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.redis).toMatch(/^(ok|not configured)$/);
  });
});
