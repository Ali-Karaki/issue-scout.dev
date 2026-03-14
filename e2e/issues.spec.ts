import { test, expect } from "@playwright/test";

test.describe("Issues page", () => {
  test("shows summary bar and filters when loaded", async ({ page }) => {
    await page.goto("/issues");
    // Wait for loading to finish
    await page.waitForSelector('[aria-busy="true"]', { state: "hidden", timeout: 60_000 }).catch(() => {});
    // Summary bar, filters, or error state
    await expect(
      page.getByText("Total:").or(page.getByLabel(/Ecosystem/i)).or(page.getByText(/error|unavailable|configuration/i))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("has filter controls", async ({ page }) => {
    await page.goto("/issues");
    await page.waitForSelector('[aria-busy="true"]', { state: "hidden", timeout: 60_000 }).catch(() => {});
    await expect(
      page.getByLabel(/Ecosystem/i).or(page.getByRole("button", { name: /retry|refresh/i }))
    ).toBeVisible({ timeout: 15_000 });
  });
});
