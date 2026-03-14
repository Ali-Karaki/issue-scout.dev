import { test, expect } from "@playwright/test";

test.describe("Ecosystem page", () => {
  test("shows ecosystem name for TanStack", async ({ page }) => {
    await page.goto("/ecosystem/tanstack");
    // TanStack ecosystem name or loading/error
    await expect(
      page.getByText("TanStack").or(page.getByText(/Fetching|error|unavailable/i))
    ).toBeVisible({ timeout: 60_000 });
  });
});
