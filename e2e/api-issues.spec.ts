import { test, expect } from "@playwright/test";

test.describe("GET /api/issues", () => {
  test("returns Cache-Control header for CDN caching when data available", async ({
    request,
  }) => {
    const res = await request.get("/api/issues?page=1&limit=10");
    // 200 = data from cache; 503 = cache empty
    if (res.ok()) {
      const cacheControl = res.headers()["cache-control"];
      expect(cacheControl).toContain("s-maxage=86400");
      expect(cacheControl).toContain("stale-while-revalidate");
    }
  });

  test("identical requests return consistent response", async ({ request }) => {
    const url = "/api/issues?page=1&limit=5";
    const res1 = await request.get(url);
    const res2 = await request.get(url);

    expect(res1.status()).toBe(res2.status());
    if (res1.ok()) {
      const body1 = await res1.json();
      const body2 = await res2.json();
      expect(body1.issues?.length).toBe(body2.issues?.length);
      expect(body1.pagination?.total).toBe(body2.pagination?.total);
    }
  });
});
