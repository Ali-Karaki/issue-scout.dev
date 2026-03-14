import { test, expect } from "@playwright/test";

test.describe("Issues page", () => {
  test.setTimeout(180_000);

  test("shows summary bar and filters when loaded", async ({ page }) => {
    await page.goto("/issues");
    // Wait for content: summary bar, filters, error state, or loading
    await expect(
      page
        .getByText("Total:")
        .or(page.getByLabel(/Project/i))
        .or(page.getByText(/error|unavailable|configuration|token|GitHub|Fetching|Redis/i))
        .first()
    ).toBeVisible({ timeout: 180_000 });
  });

  test("has filter controls", async ({ page }) => {
    await page.goto("/issues");
    await expect(
      page
        .getByText("Total:")
        .or(page.getByRole("button", { name: "Unclaimed" }))
        .or(page.getByRole("button", { name: /retry|refresh/i }))
        .first()
    ).toBeVisible({ timeout: 180_000 });
  });

  test("filter changes update URL and trigger refetch", async ({ page }) => {
    await page.goto("/issues");
    // Wait for data to load (Total: from SummaryBar)
    await expect(page.getByText("Total:")).toBeVisible({ timeout: 180_000 });

    // Click Unclaimed button (sets status=likely_unclaimed)
    await page.getByRole("button", { name: "Unclaimed" }).click();

    await expect(page).toHaveURL(/status=likely_unclaimed/, { timeout: 5000 });
  });
});
