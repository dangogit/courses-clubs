import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_USER } from "./helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function signInWithPassword() {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    }
  );
  return res;
}

setup("create and authenticate test user", async ({ page }) => {
  // 1. Try to sign in — if user doesn't exist yet, create them first
  let signInRes = await signInWithPassword();

  if (!signInRes.ok) {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: { full_name: TEST_USER.displayName },
    });
    signInRes = await signInWithPassword();
    if (!signInRes.ok) {
      throw new Error(`Failed to sign in after creating user: ${await signInRes.text()}`);
    }
  }

  const session = await signInRes.json();

  // 2. Set the auth cookie directly (matches @supabase/ssr cookie format)
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  await page.context().addCookies([
    {
      name: "sb-127-auth-token",
      value: cookieValue,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 86400,
    },
  ]);

  // 3. Verify the session works by navigating to a protected route
  await page.goto("/courses");
  await expect(page).toHaveURL("/courses");

  // 4. Save authenticated state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
