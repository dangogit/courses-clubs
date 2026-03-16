/**
 * Integration test for increment_xp RPC against local Supabase (port 55122).
 * Tests the full flow: XP award → xp_events insert → profiles update → level-up.
 *
 * Requires local Supabase running (`supabase start`).
 * Uses service role to bypass RLS and create test data.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = "http://127.0.0.1:55121";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let testUserId: string;
let testCourseId: string;
let testLessonId: string;

beforeAll(async () => {
  // Create a test user via admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: `xp-test-${Date.now()}@test.local`,
    password: "test-password-123",
    email_confirm: true,
  });
  if (error) throw new Error(`Failed to create test user: ${error.message}`);
  testUserId = data.user.id;

  // Verify profile was auto-created (by the on_auth_user_created trigger)
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_total, level_id")
    .eq("id", testUserId)
    .single();

  expect(profile?.xp_total).toBe(0);
  expect(profile?.level_id).toBe(1);

  // Create a test course + lesson for dedup tests (FK on lesson_progress)
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .insert({ title: "XP Test Course", description: "test", order_index: 999 })
    .select("id")
    .single();
  if (courseErr) throw new Error(`Failed to create test course: ${courseErr.message}`);
  testCourseId = course.id;

  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .insert({ course_id: testCourseId, title: "XP Test Lesson", order_index: 0 })
    .select("id")
    .single();
  if (lessonErr) throw new Error(`Failed to create test lesson: ${lessonErr.message}`);
  testLessonId = lesson.id;
});

afterAll(async () => {
  // Clean up test course (cascades to lessons, lesson_progress)
  if (testCourseId) {
    await supabase.from("courses").delete().eq("id", testCourseId);
  }
  // Clean up test user (cascades to profiles and xp_events)
  if (testUserId) {
    await supabase.auth.admin.deleteUser(testUserId);
  }
});

describe("increment_xp RPC", () => {
  it("awards XP and creates xp_event record", async () => {
    const { data, error } = await supabase.rpc("increment_xp", {
      p_user_id: testUserId,
      p_amount: 50,
      p_reason: "lesson_completed",
      p_reference_id: "00000000-0000-0000-0000-000000000001",
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      new_xp_total: 50,
      new_level_id: 1, // Still level 1 (0–99 XP)
      leveled_up: false,
    });

    // Verify xp_event was created
    const { data: events } = await supabase
      .from("xp_events")
      .select("*")
      .eq("user_id", testUserId);

    expect(events).toHaveLength(1);
    expect(events![0].amount).toBe(50);
    expect(events![0].reason).toBe("lesson_completed");
  });

  it("levels up when XP threshold is crossed", async () => {
    // User currently has 50 XP (level 1). Award 60 more to reach 110 → level 2 (min: 100)
    const { data, error } = await supabase.rpc("increment_xp", {
      p_user_id: testUserId,
      p_amount: 60,
      p_reason: "lesson_completed",
      p_reference_id: "00000000-0000-0000-0000-000000000002",
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      new_xp_total: 110,
      new_level_id: 2,
      leveled_up: true,
    });

    // Verify profile was updated
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp_total, level_id")
      .eq("id", testUserId)
      .single();

    expect(profile?.xp_total).toBe(110);
    expect(profile?.level_id).toBe(2);
  });

  it("accumulates XP across multiple awards", async () => {
    // Award 150 more XP → total 260 → level 3 (min: 250)
    const { data, error } = await supabase.rpc("increment_xp", {
      p_user_id: testUserId,
      p_amount: 150,
      p_reason: "post_created",
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      new_xp_total: 260,
      new_level_id: 3,
      leveled_up: true,
    });

    // Should have 3 xp_events total
    const { data: events } = await supabase
      .from("xp_events")
      .select("*")
      .eq("user_id", testUserId);

    expect(events).toHaveLength(3);
  });

  it("does not level up when staying in same tier", async () => {
    // User at 260 XP (level 3, min: 250). Award 10 → 270, still level 3 (next at 500)
    const { data, error } = await supabase.rpc("increment_xp", {
      p_user_id: testUserId,
      p_amount: 10,
      p_reason: "event_rsvp",
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      new_xp_total: 270,
      new_level_id: 3,
      leveled_up: false,
    });
  });

  it("rejects negative XP amounts", async () => {
    const { error } = await supabase.rpc("increment_xp", {
      p_user_id: testUserId,
      p_amount: -10,
      p_reason: "exploit_attempt",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toContain("p_amount must be positive");
  });

  it("rejects zero XP amount", async () => {
    const { error } = await supabase.rpc("increment_xp", {
      p_user_id: testUserId,
      p_amount: 0,
      p_reason: "zero_test",
    });

    expect(error).not.toBeNull();
  });

  it("does not double-award XP on lesson toggle-off/toggle-on", async () => {
    // Record XP before the test
    const { data: before } = await supabase
      .from("profiles")
      .select("xp_total")
      .eq("id", testUserId)
      .single();

    // First completion → trigger awards +50 XP
    await supabase
      .from("lesson_progress")
      .insert({ user_id: testUserId, lesson_id: testLessonId });

    // Toggle off (unmark lesson)
    await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", testUserId)
      .eq("lesson_id", testLessonId);

    // Toggle back on → trigger should NOT award XP again (dedup)
    await supabase
      .from("lesson_progress")
      .insert({ user_id: testUserId, lesson_id: testLessonId });

    const { data: after } = await supabase
      .from("profiles")
      .select("xp_total")
      .eq("id", testUserId)
      .single();

    // Should have gained exactly 50 XP (one award), not 100
    expect(after!.xp_total - before!.xp_total).toBe(50);
  });
});
