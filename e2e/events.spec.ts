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

/** Get a future event UUID via Supabase REST API */
async function getEventId(): Promise<string> {
  const now = new Date().toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/events?is_published=eq.true&starts_at=gt.${now}&order=starts_at.asc&select=id,title&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const [event] = await res.json();
  if (!event?.id) throw new Error("No upcoming published events found in database");
  return event.id;
}

/** Clean up any RSVP left by the test user */
async function cleanupRsvp(eventId: string) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/event_rsvps?event_id=eq.${eventId}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
    }
  );
}

/** Navigate to /events and wait for data to render */
async function goToEvents(page: Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await safeGoto(page, "/events");
    try {
      await expect(
        page.getByRole("heading", { name: /לוז המועדון/ })
      ).toBeVisible({ timeout: 20_000 });
      return;
    } catch {
      await page.waitForTimeout(2000);
    }
  }
  throw new Error("Events page loaded but heading never appeared");
}

// ─── Events list page ────────────────────────────────────────────────────

test.describe("Events page", () => {
  test("loads and shows calendar heading", async ({ page }) => {
    await goToEvents(page);
  });

  test("shows calendar tabs", async ({ page }) => {
    await goToEvents(page);
    // Verify the calendar/live tabs are visible (always rendered after data loads)
    await expect(page.getByRole("tab", { name: /לוח שנה/ })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("tab", { name: /חדר לייבים/ })).toBeVisible({ timeout: 5_000 });
  });
});

// ─── Event detail page ───────────────────────────────────────────────────

test.describe("Event detail page", () => {
  test("renders event details", async ({ page }) => {
    const eventId = await getEventId();
    await safeGoto(page, `/events/${eventId}`);
    // Wait for speaker label to appear (indicates data loaded)
    await expect(
      page.getByText(/מנחה/).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows RSVP button", async ({ page }) => {
    const eventId = await getEventId();
    await safeGoto(page, `/events/${eventId}`);
    await expect(
      page.getByRole("button", { name: /הרשמה לאירוע/ })
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ─── RSVP toggle (serial — modifies DB) ─────────────────────────────────

test.describe("Event RSVP", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  let eventId: string;

  test.beforeAll(async () => {
    eventId = await getEventId();
    // Ensure no leftover RSVP from previous runs
    await cleanupRsvp(eventId);
  });

  test.afterAll(async () => {
    await cleanupRsvp(eventId);
  });

  test("RSVP to event creates a row in event_rsvps", async ({ page }) => {
    await safeGoto(page, `/events/${eventId}`);

    // Wait for RSVP button
    const rsvpButton = page.getByRole("button", { name: /הרשמה לאירוע/ });
    await expect(rsvpButton).toBeVisible({ timeout: 15_000 });

    // Click to RSVP
    await rsvpButton.click();

    // Button should change to "נרשמת!" (optimistic update)
    await expect(
      page.getByRole("button", { name: /נרשמת/ })
    ).toBeVisible({ timeout: 10_000 });

    // Wait for mutation to settle, then verify it persists on reload
    await page.waitForTimeout(2000);
    await page.reload();
    await expect(
      page.getByRole("button", { name: /נרשמת/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("un-RSVP removes the row from event_rsvps", async ({ page }) => {
    await safeGoto(page, `/events/${eventId}`);

    // Button should show "נרשמת!" from previous test
    const rsvpButton = page.getByRole("button", { name: /נרשמת/ });
    await expect(rsvpButton).toBeVisible({ timeout: 15_000 });

    // Click to un-RSVP
    await rsvpButton.click();

    // Button should revert to "הרשמה לאירוע"
    await expect(
      page.getByRole("button", { name: /הרשמה לאירוע/ })
    ).toBeVisible({ timeout: 10_000 });

    // Verify it persists on reload
    await page.waitForTimeout(2000);
    await page.reload();
    await expect(
      page.getByRole("button", { name: /הרשמה לאירוע/ })
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Calendar export ─────────────────────────────────────────────────────

test.describe("Calendar export", () => {
  test("Google Calendar link is present on event detail", async ({ page }) => {
    const eventId = await getEventId();
    await safeGoto(page, `/events/${eventId}`);
    await expect(
      page.getByRole("link", { name: /הוסף ליומן/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test(".ics download button is present on event detail", async ({ page }) => {
    const eventId = await getEventId();
    await safeGoto(page, `/events/${eventId}`);
    await expect(
      page.getByRole("button", { name: /\.ics/ })
    ).toBeVisible({ timeout: 15_000 });
  });
});
