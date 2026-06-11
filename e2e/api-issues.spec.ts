import { test, expect } from "@playwright/test";

// Per-project endpoint is fast in CI; aggregate can be slow on first self-heal.
const ISSUES_URL = "/api/issues/facebook-react?page=1&limit=5";

test.describe("GET /api/issues", () => {
  test("returns Cache-Control header for CDN caching when data available", async ({
    request,
  }) => {
    const res = await request.get(ISSUES_URL);
    if (res.ok()) {
      const cacheControl = res.headers()["cache-control"];
      expect(cacheControl).toContain("s-maxage=86400");
      expect(cacheControl).toContain("stale-while-revalidate");
    }
  });

  test("identical requests return consistent response", async ({ request }) => {
    const res1 = await request.get(ISSUES_URL);
    const res2 = await request.get(ISSUES_URL);

    expect(res1.status()).toBe(res2.status());
    if (res1.ok()) {
      const body1 = await res1.json();
      const body2 = await res2.json();
      expect(body1.issues?.length).toBe(body2.issues?.length);
      expect(body1.pagination?.total).toBe(body2.pagination?.total);
    }
  });
});
