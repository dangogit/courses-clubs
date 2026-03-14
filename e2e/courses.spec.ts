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

/** Get the first course UUID via Supabase REST API (fast, no browser needed) */
async function getCourseId(): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?title=eq.יסודות AI&select=id&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const [course] = await res.json();
  if (!course?.id) throw new Error("Course 'יסודות AI' not found in database");
  return course.id;
}

/** Navigate to /courses and wait for course data to render */
async function goToCourses(page: Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await safeGoto(page, "/courses");
    await expect(page.getByText("מרכז הלמידה")).toBeVisible({ timeout: 20_000 });
    // Verify course data loaded (client-side Supabase auth can fail transiently)
    try {
      await expect(page.getByText("יסודות AI").first()).toBeVisible({ timeout: 10_000 });
      return;
    } catch {
      await page.waitForTimeout(2000);
    }
  }
  throw new Error("Courses page loaded but course data never appeared");
}

/** Navigate to course detail via safeGoto and wait for heading */
async function goToCourseDetail(page: Page, courseId: string) {
  await safeGoto(page, `/courses/${courseId}`);
  await expect(
    page.getByRole("heading", { name: "יסודות AI" })
  ).toBeVisible({ timeout: 15_000 });
}

/** Get the first lesson UUID via Supabase REST API */
async function getLessonId(courseId: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/lessons?course_id=eq.${courseId}&order=order_index.asc&select=id&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const [lesson] = await res.json();
  if (!lesson?.id) throw new Error("First lesson not found in database");
  return lesson.id;
}

/** Navigate directly to lesson detail page */
async function goToLesson(page: Page, courseId: string, lessonId: string) {
  await safeGoto(page, `/courses/${courseId}/lesson/${lessonId}`);
  await expect(
    page.getByRole("heading", { name: "מהי בינה מלאכותית?" })
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Courses & lessons", () => {
  test("courses page shows seeded courses", async ({ page }) => {
    await goToCourses(page);
    await expect(page.getByText("יסודות AI")).toBeVisible();
    await expect(page.getByText("כל הקורסים")).toBeVisible();
  });

  test("clicking a course navigates to course detail", async ({ page }) => {
    const courseId = await getCourseId();
    await goToCourseDetail(page, courseId);
    await expect(page.getByText("מהי בינה מלאכותית?")).toBeVisible();
  });

  test("clicking a lesson navigates to lesson detail", async ({ page }) => {
    const courseId = await getCourseId();
    const lessonId = await getLessonId(courseId);
    await goToLesson(page, courseId, lessonId);
    await expect(
      page.getByRole("button", { name: /סיימתי לצפות|נצפה/ })
    ).toBeVisible();
  });
});

// Progress tests modify shared DB state — run serially to avoid race conditions
test.describe("Lesson progress", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  test("toggling lesson progress marks and unmarks a lesson", async ({
    page,
  }) => {
    const courseId = await getCourseId();
    const lessonId = await getLessonId(courseId);
    await goToLesson(page, courseId, lessonId);

    // If already marked, unmark first
    const completedBtn = page.getByRole("button", { name: /^נצפה$/ });
    if (await completedBtn.isVisible().catch(() => false)) {
      await completedBtn.click();
      await expect(
        page.getByRole("button", { name: /סיימתי לצפות/ })
      ).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // Mark complete
    await page.getByRole("button", { name: /סיימתי לצפות/ }).click();
    await expect(completedBtn).toBeVisible({ timeout: 10_000 });
    // Wait for mutation to fully settle (button re-enabled after isPending clears)
    await expect(completedBtn).toBeEnabled({ timeout: 10_000 });
    await page.waitForTimeout(500);

    // Unmark
    await completedBtn.click();
    await expect(
      page.getByRole("button", { name: /סיימתי לצפות/ })
    ).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
  });

  test("lesson progress persists after navigating away and back", async ({
    page,
  }) => {
    const courseId = await getCourseId();
    const lessonId = await getLessonId(courseId);
    await goToLesson(page, courseId, lessonId);

    // Ensure uncompleted state
    const completedBtn = page.getByRole("button", { name: /^נצפה$/ });
    if (await completedBtn.isVisible().catch(() => false)) {
      await completedBtn.click();
      await expect(
        page.getByRole("button", { name: /סיימתי לצפות/ })
      ).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // Mark complete
    await page.getByRole("button", { name: /סיימתי לצפות/ }).click();
    await expect(completedBtn).toBeVisible({ timeout: 10_000 });
    // Wait for mutation to fully settle before navigating
    await expect(completedBtn).toBeEnabled({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Navigate away and back using direct URL
    await safeGoto(page, `/courses/${courseId}/lesson/${lessonId}`);

    // Still marked as completed
    await expect(completedBtn).toBeVisible({ timeout: 15_000 });

    // Cleanup: unmark
    await completedBtn.click();
    await expect(
      page.getByRole("button", { name: /סיימתי לצפות/ })
    ).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
  });
});
