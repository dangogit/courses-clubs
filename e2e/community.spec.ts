import { test, expect, type Page } from "@playwright/test";

test.setTimeout(60_000);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Robust page.goto with retry — handles:
 * - ERR_ABORTED (dev server compiling on first request)
 * - Middleware auth redirect to /login (intermittent getUser() failure)
 */
async function safeGoto(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(path, { timeout: 30_000 });
    } catch {
      await page.waitForTimeout(2000);
      continue;
    }
    if (!page.url().includes("/login")) return;
    await page.waitForTimeout(1000);
  }
  throw new Error(`Navigation to ${path} failed after 3 retries`);
}

/** Get the first group UUID via Supabase REST API */
async function getGroupId(): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/groups?select=id&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const [group] = await res.json();
  if (!group?.id) throw new Error("No groups found in database");
  return group.id;
}

// ─── Feed page tests ────────────────────────────────────────────────────────

test.describe("Feed page", () => {
  test("feed page loads and shows create post area", async ({ page }) => {
    await safeGoto(page, "/community");
    await expect(
      page.getByText("שתף שאלה, פרויקט, הישג או תובנה עם הקהילה...")
    ).toBeVisible({ timeout: 20_000 });
  });

  test("feed page shows sort buttons", async ({ page }) => {
    await safeGoto(page, "/community");
    await expect(page.getByText("חדשים").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("פעילות אחרונה")).toBeVisible();
    await expect(page.getByText("נשמרו")).toBeVisible();
  });

  test("feed page shows post count badge", async ({ page }) => {
    await safeGoto(page, "/community");
    await expect(page.getByText(/\d+\s*פוסטים/)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Feed post creation", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  const testContent = `E2E test post ${Date.now()}`;

  test("creating a post shows it in the feed", async ({ page }) => {
    await safeGoto(page, "/community");
    // Wait for page to fully load
    await expect(
      page.getByText("שתף שאלה, פרויקט, הישג או תובנה עם הקהילה...")
    ).toBeVisible({ timeout: 20_000 });

    // Click the create post area to open the dialog
    await page.getByText("שתף שאלה, פרויקט, הישג או תובנה עם הקהילה...").click();

    // Wait for the dialog to appear
    await expect(page.getByText("צור פוסט")).toBeVisible({ timeout: 10_000 });

    // Type content in the textarea
    const textarea = page.getByPlaceholder("שתף מה שעל ליבך... השתמש ב-@ לתיוג חברים");
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill(testContent);

    // Click "פוסט" button to publish
    await page.getByRole("button", { name: "פוסט" }).click();

    // Verify the post appears in the feed
    await expect(page.getByText(testContent)).toBeVisible({ timeout: 15_000 });

    // Cleanup: delete the post via service role API
    await fetch(
      `${SUPABASE_URL}/rest/v1/posts?content=eq.${encodeURIComponent(testContent)}`,
      {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
      }
    );
  });
});

// ─── Groups page tests ──────────────────────────────────────────────────────

test.describe("Groups page", () => {
  test("groups page shows seeded groups", async ({ page }) => {
    await safeGoto(page, "/groups");
    await expect(
      page.getByRole("heading", { name: "קבוצות" })
    ).toBeVisible({ timeout: 20_000 });

    // Verify at least one group card is visible (seeded group names)
    await expect(
      page.getByText("Prompt Engineering").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("groups page search filters groups", async ({ page }) => {
    await safeGoto(page, "/groups");
    await expect(
      page.getByRole("heading", { name: "קבוצות" })
    ).toBeVisible({ timeout: 20_000 });

    // Wait for groups to load
    await expect(
      page.getByText("Prompt Engineering").first()
    ).toBeVisible({ timeout: 15_000 });

    // Type in search to filter
    const searchInput = page.getByPlaceholder("חפש קבוצה...");
    await searchInput.fill("No-Code");

    // Verify filtered group appears
    await expect(page.getByText("No-Code AI").first()).toBeVisible({ timeout: 10_000 });

    // Verify non-matching groups are hidden
    await expect(page.getByText("AI לעסקים").first()).not.toBeVisible();
  });

  test("groups page filter buttons work", async ({ page }) => {
    await safeGoto(page, "/groups");
    await expect(
      page.getByRole("heading", { name: "קבוצות" })
    ).toBeVisible({ timeout: 20_000 });

    // Wait for groups to load
    await expect(
      page.getByText("Prompt Engineering").first()
    ).toBeVisible({ timeout: 15_000 });

    // Click "ציבוריות" filter
    await page.getByText("ציבוריות").click();
    await page.waitForTimeout(500);

    // Private group "למידת מכונה מתקדמת" should not be visible
    await expect(page.getByText("למידת מכונה מתקדמת").first()).not.toBeVisible();

    // Public group should still be visible
    await expect(page.getByText("Prompt Engineering").first()).toBeVisible();
  });
});

// ─── Group detail tests ─────────────────────────────────────────────────────

test.describe("Group detail", () => {
  test("group detail page loads with group info", async ({ page }) => {
    const groupId = await getGroupId();
    await safeGoto(page, `/groups/${groupId}`);

    // Verify "אודות הקבוצה" section is visible
    await expect(page.getByText("אודות הקבוצה")).toBeVisible({ timeout: 20_000 });

    // Verify back link is present
    await expect(page.getByText("חזרה לכל הקבוצות")).toBeVisible();
  });

  test("group detail shows join button", async ({ page }) => {
    const groupId = await getGroupId();
    await safeGoto(page, `/groups/${groupId}`);

    // Wait for page to load
    await expect(page.getByText("אודות הקבוצה")).toBeVisible({ timeout: 20_000 });

    // Verify either join or leave button is present
    await expect(
      page.getByRole("button", { name: /הצטרפות לקבוצה|עזיבת קבוצה/ })
    ).toBeVisible({ timeout: 10_000 });
  });
});
