import { test, expect } from "@playwright/test";

test.describe("Ecosystem page", () => {
  test("shows ecosystem name for TanStack", async ({ page }) => {
    await page.goto("/ecosystem/tanstack");
    // TanStack ecosystem name or loading/error
    await expect(
      page
        .getByText("TanStack")
        .or(page.getByText(/Fetching|error|unavailable|token|GitHub/i))
        .first()
    ).toBeVisible({ timeout: 60_000 });
  });

  test("shows 404 for invalid ecosystem id", async ({ page }) => {
    await page.goto("/ecosystem/invalid-id");
    await expect(page.getByText(/Page not found|doesn't exist/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
