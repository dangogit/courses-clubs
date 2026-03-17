/**
 * Integration tests for tier RLS policies, RPCs, and triggers
 * against the local Supabase instance (port 55122).
 *
 * Tests:
 *  1. admin_set_tier_level RPC — admin success, non-admin rejection, invalid tier
 *  2. admin_set_content_tier RPC — admin success, non-admin rejection, invalid table
 *  3. get_lesson_with_access RPC — video_url gating, _locked flag
 *  4. protect_sensitive_columns trigger — blocks direct tier_level UPDATE
 *  5. Event RSVP tier gating — RLS INSERT policy on event_rsvps
 *
 * Requires local Supabase running (`supabase start`).
 * Uses service role to set up and tear down test data.
 * Uses psql via child_process for operations that require raw SQL
 * (e.g., bypassing protect_sensitive_columns trigger to promote test admins).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import type { Database } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Local Supabase constants (well-known keys for `supabase start`)
// ---------------------------------------------------------------------------
const SUPABASE_URL = "http://127.0.0.1:55121";
const POSTGRES_URL = "postgresql://postgres:postgres@127.0.0.1:55122/postgres";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WO_o0BQXe0NBIQRRMBdKmnUJWBCcqMIKQ-jU";

const TEST_PASSWORD = "TestPass123";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/** Service-role client (bypasses RLS) — used for setup & teardown. */
const serviceClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Create a Supabase client authenticated as a specific test user. */
async function createAuthenticatedClient(
  email: string,
  password: string = TEST_PASSWORD,
): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return client;
}

// ---------------------------------------------------------------------------
// Raw SQL helper — uses psql to bypass triggers when needed
// ---------------------------------------------------------------------------

/**
 * Execute raw SQL against the local Supabase database via psql.
 * Used for test setup that needs to bypass RLS AND triggers
 * (e.g., promoting a user to admin when protect_sensitive_columns blocks it).
 */
function execSQL(sql: string): string {
  return execSync(`psql "${POSTGRES_URL}" -t -A -c "${sql.replace(/"/g, '\\"')}"`, {
    encoding: "utf-8",
    timeout: 10_000,
  }).trim();
}

/**
 * Promote a user to admin by bypassing the protect_sensitive_columns trigger.
 * This sets the session variable that the trigger checks, then updates the role.
 */
function promoteToAdmin(userId: string): void {
  execSQL(`
    SET LOCAL app.bypass_column_protection = 'true';
    UPDATE profiles SET role = 'admin' WHERE id = '${userId}'
  `);
}

/**
 * Set a user's tier_level directly, bypassing the protect_sensitive_columns trigger.
 */
function setTierLevel(userId: string, level: number): void {
  execSQL(`
    SET LOCAL app.bypass_column_protection = 'true';
    UPDATE profiles SET tier_level = ${level} WHERE id = '${userId}'
  `);
}

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------
let adminUserId: string;
let adminEmail: string;
let memberUserId: string;
let freeMemberUserId: string;
let testCourseId: string;
let testLessonId: string;
let testEventId: string;

// ---------------------------------------------------------------------------
// Setup — runs once before all tests
// ---------------------------------------------------------------------------
beforeAll(async () => {
  const ts = Date.now();

  // --- Create three test users via admin API ---
  adminEmail = `tier-admin-${ts}@test.local`;
  const memberEmail = `tier-member-${ts}@test.local`;
  const freeEmail = `tier-free-${ts}@test.local`;

  const { data: adminUser, error: adminErr } =
    await serviceClient.auth.admin.createUser({
      email: adminEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  if (adminErr)
    throw new Error(`Failed to create admin user: ${adminErr.message}`);
  adminUserId = adminUser.user.id;

  const { data: memberUser, error: memberErr } =
    await serviceClient.auth.admin.createUser({
      email: memberEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  if (memberErr)
    throw new Error(`Failed to create member user: ${memberErr.message}`);
  memberUserId = memberUser.user.id;

  const { data: freeUser, error: freeErr } =
    await serviceClient.auth.admin.createUser({
      email: freeEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  if (freeErr)
    throw new Error(`Failed to create free user: ${freeErr.message}`);
  freeMemberUserId = freeUser.user.id;

  // --- Promote admin user and set tier levels via raw SQL ---
  promoteToAdmin(adminUserId);
  setTierLevel(adminUserId, 2); // premium
  setTierLevel(memberUserId, 1); // basic
  // freeMemberUserId stays at default tier_level=0

  // Verify admin promotion worked
  const { data: adminProfile } = await serviceClient
    .from("profiles")
    .select("role, tier_level")
    .eq("id", adminUserId)
    .single();
  if (adminProfile?.role !== "admin") {
    throw new Error(
      `Failed to promote test user to admin. Got role: ${adminProfile?.role}`,
    );
  }

  // --- Create test course (requires basic tier) ---
  const { data: course, error: courseErr } = await serviceClient
    .from("courses")
    .insert({
      title: "Tier Test Course",
      description: "integration test",
      order_index: 9990,
      is_published: true,
      min_tier_level: 1,
    })
    .select("id")
    .single();
  if (courseErr)
    throw new Error(`Failed to create test course: ${courseErr.message}`);
  testCourseId = course.id;

  // --- Create test lesson with video_url ---
  const { data: lesson, error: lessonErr } = await serviceClient
    .from("lessons")
    .insert({
      course_id: testCourseId,
      title: "Tier Test Lesson",
      video_url: "https://cdn.example.com/test-video.mp4",
      order_index: 0,
      is_published: true,
      min_tier_level: null, // inherits from course (level 1)
    })
    .select("id")
    .single();
  if (lessonErr)
    throw new Error(`Failed to create test lesson: ${lessonErr.message}`);
  testLessonId = lesson.id;

  // --- Create test event (premium tier required) ---
  const { data: event, error: eventErr } = await serviceClient
    .from("events")
    .insert({
      title: "Tier Test Event",
      description: "Premium event for integration tests",
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      is_online: true,
      min_tier_level: 2,
      is_published: true,
    })
    .select("id")
    .single();
  if (eventErr)
    throw new Error(`Failed to create test event: ${eventErr.message}`);
  testEventId = event.id;
}, 30_000);

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (testEventId) {
    await serviceClient
      .from("event_rsvps")
      .delete()
      .eq("event_id", testEventId);
    await serviceClient.from("events").delete().eq("id", testEventId);
  }
  if (testCourseId) {
    await serviceClient.from("courses").delete().eq("id", testCourseId);
  }
  for (const uid of [adminUserId, memberUserId, freeMemberUserId]) {
    if (uid) await serviceClient.auth.admin.deleteUser(uid);
  }
}, 15_000);

// ---------------------------------------------------------------------------
// Helper: create a temporary user, run a callback, then clean up
// ---------------------------------------------------------------------------
async function withTempUser(
  opts: { role?: "admin" | "member"; tierLevel?: number },
  fn: (client: SupabaseClient<Database>, userId: string) => Promise<void>,
): Promise<void> {
  const email = `tier-temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.local`;
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`Failed to create temp user: ${error.message}`);
  const userId = data.user.id;

  try {
    if (opts.role === "admin") promoteToAdmin(userId);
    if (opts.tierLevel !== undefined) setTierLevel(userId, opts.tierLevel);

    const client = await createAuthenticatedClient(email);
    await fn(client, userId);
  } finally {
    await serviceClient.auth.admin.deleteUser(userId);
  }
}

// ===========================================================================
// 1. admin_set_tier_level RPC
// ===========================================================================
describe("admin_set_tier_level RPC", () => {
  it("should succeed when called by an admin user", async () => {
    await withTempUser({ role: "admin", tierLevel: 2 }, async (adminClient) => {
      await withTempUser({}, async (_targetClient, targetId) => {
        const { error } = await adminClient.rpc("admin_set_tier_level", {
          target_user_id: targetId,
          new_level: 1,
        });

        expect(error).toBeNull();

        // Verify the tier was set
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("tier_level")
          .eq("id", targetId)
          .single();

        expect(profile?.tier_level).toBe(1);
      });
    });
  });

  it("should fail when called by a non-admin (regular member)", async () => {
    await withTempUser({}, async (memberClient) => {
      const { error } = await memberClient.rpc("admin_set_tier_level", {
        target_user_id: freeMemberUserId,
        new_level: 2,
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("Only admins can set tier levels");
    });
  });

  it("should fail for invalid tier level (e.g., level 99)", async () => {
    await withTempUser({ role: "admin", tierLevel: 2 }, async (adminClient) => {
      const { error } = await adminClient.rpc("admin_set_tier_level", {
        target_user_id: memberUserId,
        new_level: 99,
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("Invalid tier level");
    });
  });
});

// ===========================================================================
// 2. admin_set_content_tier RPC
// ===========================================================================
describe("admin_set_content_tier RPC", () => {
  it("should succeed when admin sets tier on a course", async () => {
    await withTempUser({ role: "admin", tierLevel: 2 }, async (adminClient) => {
      const { error } = await adminClient.rpc("admin_set_content_tier", {
        p_table_name: "courses",
        p_content_id: testCourseId,
        p_tier_level: 2,
      });

      expect(error).toBeNull();

      // Verify the change
      const { data: course } = await serviceClient
        .from("courses")
        .select("min_tier_level")
        .eq("id", testCourseId)
        .single();

      expect(course?.min_tier_level).toBe(2);

      // Reset for subsequent tests
      await adminClient.rpc("admin_set_content_tier", {
        p_table_name: "courses",
        p_content_id: testCourseId,
        p_tier_level: 1,
      });
    });
  });

  it("should fail when non-admin tries to set tier", async () => {
    await withTempUser({}, async (memberClient) => {
      const { error } = await memberClient.rpc("admin_set_content_tier", {
        p_table_name: "courses",
        p_content_id: testCourseId,
        p_tier_level: 0,
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("Only admins can set content tier");
    });
  });

  it("should fail for invalid table name", async () => {
    await withTempUser({ role: "admin", tierLevel: 2 }, async (adminClient) => {
      const { error } = await adminClient.rpc("admin_set_content_tier", {
        p_table_name: "profiles", // not in whitelist
        p_content_id: testCourseId,
        p_tier_level: 0,
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("Invalid table");
    });
  });
});

// ===========================================================================
// 3. get_lesson_with_access RPC
// ===========================================================================
describe("get_lesson_with_access RPC", () => {
  it("should return video_url for a user with sufficient tier", async () => {
    await withTempUser({ tierLevel: 2 }, async (premClient) => {
      const { data, error } = await premClient.rpc("get_lesson_with_access", {
        p_course_id: testCourseId,
        p_lesson_id: testLessonId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.video_url).toBe("https://cdn.example.com/test-video.mp4");
      expect(data._locked).toBe(false);
    });
  });

  it("should nullify video_url and set _locked=true for under-tier user", async () => {
    // Course requires tier 1; this user has tier 0
    await withTempUser({ tierLevel: 0 }, async (freeClient) => {
      const { data, error } = await freeClient.rpc("get_lesson_with_access", {
        p_course_id: testCourseId,
        p_lesson_id: testLessonId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.video_url).toBeNull();
      expect(data._locked).toBe(true);
      expect(data._required_tier).toBe(1);
    });
  });

  it("should return _locked=false for user with exact tier match", async () => {
    // Course requires tier 1; this user has tier 1
    await withTempUser({ tierLevel: 1 }, async (basicClient) => {
      const { data, error } = await basicClient.rpc("get_lesson_with_access", {
        p_course_id: testCourseId,
        p_lesson_id: testLessonId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.video_url).toBe("https://cdn.example.com/test-video.mp4");
      expect(data._locked).toBe(false);
    });
  });
});

// ===========================================================================
// 4. protect_sensitive_columns trigger
// ===========================================================================
describe("protect_sensitive_columns trigger", () => {
  it("should prevent a regular user from updating their own tier_level directly", async () => {
    await withTempUser({}, async (regClient, regId) => {
      // Attempt to set own tier_level to 2 via direct update
      const { error } = await regClient
        .from("profiles")
        .update({ tier_level: 2 } as never)
        .eq("id", regId);

      // The update "succeeds" (RLS allows owner updates) but the trigger
      // silently resets tier_level back to its old value
      expect(error).toBeNull();

      // Verify tier_level was NOT changed
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("tier_level")
        .eq("id", regId)
        .single();

      expect(profile?.tier_level).toBe(0);
    });
  });

  it("should also prevent direct role updates by a regular user", async () => {
    await withTempUser({}, async (regClient, regId) => {
      const { error } = await regClient
        .from("profiles")
        .update({ role: "admin" } as never)
        .eq("id", regId);

      expect(error).toBeNull();

      const { data: profile } = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", regId)
        .single();

      expect(profile?.role).toBe("member");
    });
  });

  it("should allow admin_set_tier_level to bypass the trigger", async () => {
    await withTempUser({ role: "admin", tierLevel: 2 }, async (adminClient) => {
      await withTempUser({}, async (_targetClient, targetId) => {
        // Use the RPC (which sets the bypass GUC internally)
        const { error } = await adminClient.rpc("admin_set_tier_level", {
          target_user_id: targetId,
          new_level: 2,
        });

        expect(error).toBeNull();

        const { data: profile } = await serviceClient
          .from("profiles")
          .select("tier_level")
          .eq("id", targetId)
          .single();

        expect(profile?.tier_level).toBe(2);
      });
    });
  });
});

// ===========================================================================
// 5. Event RSVP tier gating (RLS)
// ===========================================================================
describe("Event RSVP tier gating (RLS)", () => {
  it("should NOT allow a free-tier user to RSVP to a premium event", async () => {
    // Event requires tier 2; user has tier 0
    await withTempUser({ tierLevel: 0 }, async (freeClient, freeId) => {
      const { error } = await freeClient
        .from("event_rsvps")
        .insert({ user_id: freeId, event_id: testEventId });

      expect(error).not.toBeNull();
      // RLS policy violation: new row violates row-level security policy
      expect(error!.code).toBe("42501");
    });
  });

  it("should allow a premium-tier user to RSVP to a premium event", async () => {
    // Event requires tier 2; user has tier 2
    await withTempUser({ tierLevel: 2 }, async (premClient, premId) => {
      const { data, error } = await premClient
        .from("event_rsvps")
        .insert({ user_id: premId, event_id: testEventId })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.user_id).toBe(premId);
      expect(data!.event_id).toBe(testEventId);

      // Clean up RSVP
      await serviceClient
        .from("event_rsvps")
        .delete()
        .eq("user_id", premId)
        .eq("event_id", testEventId);
    });
  });

  it("should NOT allow a basic-tier user to RSVP to a premium event", async () => {
    // Event requires tier 2; user has tier 1
    await withTempUser({ tierLevel: 1 }, async (basicClient, basicId) => {
      const { error } = await basicClient
        .from("event_rsvps")
        .insert({ user_id: basicId, event_id: testEventId });

      expect(error).not.toBeNull();
      expect(error!.code).toBe("42501");
    });
  });
});
