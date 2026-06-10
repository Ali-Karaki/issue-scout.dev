import { test, expect } from "@playwright/test";

test.describe("Project page", () => {
  test("shows react project page content", async ({ page }) => {
    await page.goto("/project/facebook-react");
    await expect(
      page
        .getByRole("heading", { name: "react" })
        .or(page.getByText("Loading issues..."))
        .or(page.getByRole("button", { name: "Retry loading issues" }))
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
