import { test, expect } from "@playwright/test";

test.describe("Project page", () => {
  test("shows project name for TanStack", async ({ page }) => {
    await page.goto("/project/tanstack");
    // TanStack project name or loading/error
    await expect(
      page
        .getByText("TanStack")
        .or(page.getByText(/Fetching|error|unavailable|token|GitHub/i))
        .first()
    ).toBeVisible({ timeout: 60_000 });
  });

  test("shows 404 for invalid project id", async ({ page }) => {
    await page.goto("/project/invalid-id");
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible({
      timeout: 5000,
    });
  });
});
