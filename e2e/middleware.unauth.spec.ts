import { test, expect } from "@playwright/test";

test.describe("Auth middleware — unauthenticated redirects", () => {
  test("redirects /courses to /login with next param", async ({ page }) => {
    await page.goto("/courses");
    await expect(page).toHaveURL(/\/login\?next=%2Fcourses/);
  });

  test("redirects /profile to /login", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /settings to /login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("does NOT redirect / (public)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("does NOT redirect /login (public)", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/login");
  });
});
