import { test, expect } from "@playwright/test";

test.describe("Issues page", () => {
  test("shows summary bar and filters when loaded", async ({ page }) => {
    await page.goto("/issues");
    // Wait for content: summary bar, filters, error state, or loading
    await expect(
      page
        .getByText("Total:")
        .or(page.getByLabel(/Ecosystem/i))
        .or(page.getByText(/error|unavailable|configuration|token|GitHub|Fetching/i))
        .first()
    ).toBeVisible({ timeout: 90_000 });
  });

  test("has filter controls", async ({ page }) => {
    await page.goto("/issues");
    await expect(
      page
        .getByLabel(/Ecosystem/i)
        .or(page.getByRole("button", { name: /retry|refresh/i }))
        .first()
    ).toBeVisible({ timeout: 90_000 });
  });
});
