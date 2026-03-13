import { test, expect } from "@playwright/test";

test.describe("Authenticated smoke tests", () => {
  test("home page loads with authenticated user", async ({ page }) => {
    await page.goto("/");
    // The page should load without errors
    await expect(page).toHaveURL("/");
    // Dev nav page renders (actual app routes are under /(main))
    await expect(page.getByText("Brainers Club")).toBeVisible();
  });
});
