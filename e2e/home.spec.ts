import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("shows IssueScout branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "IssueScout" })).toBeVisible();
  });

  test("clicking Issues in header navigates to /issues", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Issues", exact: true }).click();
    await expect(page).toHaveURL(/\/issues/);
  });
});
