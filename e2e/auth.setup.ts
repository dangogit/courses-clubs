import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  TEST_USER,
  waitForMagicLinkCode,
  clearMailbox,
} from "./helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

setup("create and authenticate test user", async ({ page }) => {
  // 1. Create user via admin API (idempotent)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listData } = await admin.auth.admin.listUsers();
  const exists = listData?.users?.some((u) => u.email === TEST_USER.email);

  if (!exists) {
    const { error } = await admin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: { full_name: TEST_USER.displayName },
    });
    if (error)
      throw new Error(`Failed to create test user: ${error.message}`);
  }

  // 2. Clear all emails before sending magic link
  await clearMailbox();

  // 3. Navigate to login and send magic link
  await page.goto("/login");
  await page.getByLabel("אימייל").fill(TEST_USER.email);
  await page.getByRole("button", { name: /שלח קישור התחברות/ }).click();

  // Wait for success message
  await expect(page.getByText("שלחנו קישור התחברות")).toBeVisible({
    timeout: 10_000,
  });

  // 4. Fetch magic link from Mailpit and extract auth code
  const code = await waitForMagicLinkCode(page, TEST_USER.email);

  // 5. Navigate to auth callback with the code (sets session cookies)
  await page.goto(`/auth/callback?code=${code}`);
  await page.waitForURL("/", { timeout: 15_000 });

  // 7. Save authenticated state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
