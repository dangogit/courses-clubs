import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  TEST_USER,
  getLatestMagicLink,
  extractAuthCode,
  clearMailbox,
} from "./helpers";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays club name and tagline", async ({ page }) => {
    await expect(page.getByText("Brainers Club")).toBeVisible();
    await expect(page.getByText("קהילת ה-AI הישראלית")).toBeVisible();
  });

  test("displays Google OAuth button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Google/ })
    ).toBeVisible();
  });

  test("displays Magic Link email form", async ({ page }) => {
    await expect(page.getByLabel("אימייל")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /שלח קישור התחברות/ })
    ).toBeVisible();
  });

  test("does not show sidebar or header", async ({ page }) => {
    await expect(page.locator("[data-slot='sidebar']")).not.toBeVisible();
  });

  test("shows error toast when navigated with error param", async ({
    page,
  }) => {
    await page.goto("/login?error=ההתחברות נכשלה");
    await expect(page.locator("[data-sonner-toast]")).toBeVisible();
  });

  test("sends magic link and shows success message", async ({ page }) => {
    const email = `login-test-${Date.now()}@courses-clubs.local`;

    await page.getByLabel("אימייל").fill(email);
    await page.getByRole("button", { name: /שלח קישור התחברות/ }).click();

    await expect(page.getByText("שלחנו קישור התחברות")).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Magic Link auth flow", () => {
  const email = "e2e-magiclink-flow@courses-clubs.local";

  test("full flow: send magic link → click link → authenticated", async ({
    page,
  }) => {
    // Create user via admin API so the magic link works
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: listData } = await admin.auth.admin.listUsers();
    if (!listData?.users?.some((u) => u.email === email)) {
      await admin.auth.admin.createUser({
        email,
        password: TEST_USER.password,
        email_confirm: true,
      });
    }

    // Clear all emails
    await clearMailbox();

    // Send magic link
    await page.goto("/login");
    await page.getByLabel("אימייל").fill(email);
    await page.getByRole("button", { name: /שלח קישור התחברות/ }).click();

    await expect(page.getByText("שלחנו קישור התחברות")).toBeVisible({
      timeout: 10_000,
    });

    // Fetch magic link from Mailpit
    let magicLink: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await page.waitForTimeout(500);
      magicLink = await getLatestMagicLink(email);
      if (magicLink) break;
    }

    expect(magicLink).toBeTruthy();

    // Extract auth code by following the verify URL server-side
    // (Supabase redirects to site_url which may differ from the test server port)
    const code = await extractAuthCode(magicLink!);
    expect(code).toBeTruthy();

    // Navigate to our auth callback with the extracted code
    await page.goto(`/auth/callback?code=${code}`);
    await page.waitForURL("/", { timeout: 15_000 });

    // Should be on the home page (authenticated)
    await expect(page).toHaveURL("/");
  });
});
