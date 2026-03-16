import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TEST_USER } from "./helpers";

/**
 * Community RLS integration tests.
 *
 * These tests hit the local Supabase instance directly (no browser) to verify
 * that RLS policies on groups, group_members, posts, post_comments,
 * post_reactions, and notifications work as designed.
 *
 * Runs in the Playwright test runner for env loading and auth setup,
 * but all assertions are pure API calls via the Supabase JS client.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ---------------------------------------------------------------------------
// Helpers — authenticated Supabase clients
// ---------------------------------------------------------------------------

/** Service role client — bypasses RLS */
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Authenticated client as the primary test user */
async function createUserClient(): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  if (error) throw new Error(`User 1 sign-in failed: ${error.message}`);
  return client;
}

/** Create (if needed) and sign in a second user for cross-user tests */
async function createSecondUser(): Promise<SupabaseClient> {
  const email = "e2e-test-2@courses-clubs.local";
  const password = "TestUser2-1234!";

  const { data: existing } = await admin.auth.admin.listUsers();
  if (!existing?.users.find((u: { email?: string }) => u.email === email)) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Test User 2" },
    });
    if (error) throw new Error(`Failed to create user 2: ${error.message}`);
  }

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`User 2 sign-in failed: ${error.message}`);
  return client;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Community RLS policies", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(30_000);

  let userClient: SupabaseClient;
  let user2Client: SupabaseClient;
  let userId: string;
  let user2Id: string;
  let testGroupId: string;
  let testPostId: string;

  test.beforeAll(async () => {
    userClient = await createUserClient();
    user2Client = await createSecondUser();

    const {
      data: { user },
    } = await userClient.auth.getUser();
    userId = user!.id;

    const {
      data: { user: u2 },
    } = await user2Client.auth.getUser();
    user2Id = u2!.id;

    // Ensure user2 has a profile row (auto-creation trigger may not fire for admin-created users)
    await admin.from("profiles").upsert(
      { id: user2Id, display_name: "E2E Test User 2", role: "member" },
      { onConflict: "id" }
    );

    // Create a test group via service role
    const { data: group, error: groupErr } = await admin
      .from("groups")
      .insert({
        name: "RLS Test Group",
        is_private: false,
        min_tier_level: 0,
      })
      .select("id")
      .single();
    if (groupErr) throw new Error(`Failed to create test group: ${groupErr.message}`);
    testGroupId = group!.id;

    // Create a test post owned by user1 via service role
    const { data: post, error: postErr } = await admin
      .from("posts")
      .insert({
        user_id: userId,
        content: "RLS test post",
        group_id: null,
      })
      .select("id")
      .single();
    if (postErr) throw new Error(`Failed to create test post: ${postErr.message}`);
    testPostId = post!.id;
  });

  test.afterAll(async () => {
    // Clean up in dependency order: reactions → comments → posts → group_members → groups
    await admin.from("post_reactions").delete().eq("post_id", testPostId);
    await admin.from("post_comments").delete().eq("post_id", testPostId);
    await admin.from("posts").delete().eq("id", testPostId);
    await admin.from("group_members").delete().eq("group_id", testGroupId);
    await admin.from("groups").delete().eq("id", testGroupId);
    // Clean up any notifications created during tests
    await admin.from("notifications").delete().eq("type", "rls_test");

    // Delete the second user
    if (user2Id) {
      await admin.auth.admin.deleteUser(user2Id);
    }
  });

  // =========================================================================
  // Groups
  // =========================================================================

  test("groups: authenticated can SELECT", async () => {
    const { data, error } = await userClient.from("groups").select("id");
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.some((g) => g.id === testGroupId)).toBe(true);
  });

  test("groups: authenticated cannot INSERT", async () => {
    const { data, error } = await userClient
      .from("groups")
      .insert({ name: "Should Fail" })
      .select("id")
      .single();
    // Expect RLS violation — no INSERT policy exists for authenticated role
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  test("groups: authenticated cannot DELETE", async () => {
    const { data, error } = await userClient
      .from("groups")
      .delete()
      .eq("id", testGroupId)
      .select("id");
    // Either error or 0 rows returned (RLS filters the delete)
    if (error) {
      expect(error).not.toBeNull();
    } else {
      expect(data).toEqual([]);
    }
    // Verify group still exists
    const { data: check } = await admin
      .from("groups")
      .select("id")
      .eq("id", testGroupId)
      .single();
    expect(check).not.toBeNull();
  });

  // =========================================================================
  // Group Members
  // =========================================================================

  test("group_members: can join free group (INSERT own)", async () => {
    const { error } = await userClient.from("group_members").insert({
      user_id: userId,
      group_id: testGroupId,
      role: "member",
    });
    expect(error).toBeNull();

    // Clean up — leave group so subsequent tests start fresh
    await userClient
      .from("group_members")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", testGroupId);
  });

  test("group_members: cannot join as another user", async () => {
    const { error } = await userClient.from("group_members").insert({
      user_id: user2Id,
      group_id: testGroupId,
      role: "member",
    });
    // RLS WITH CHECK fails — user_id != auth.uid()
    expect(error).not.toBeNull();
  });

  test("group_members: cannot UPDATE membership", async () => {
    // First join the group
    await userClient.from("group_members").insert({
      user_id: userId,
      group_id: testGroupId,
      role: "member",
    });

    // Try to update role — should be denied
    const { data, error } = await userClient
      .from("group_members")
      .update({ role: "moderator" })
      .eq("user_id", userId)
      .eq("group_id", testGroupId)
      .select();

    // UPDATE policy uses USING(false) — either error or 0 rows matched
    if (error) {
      expect(error).not.toBeNull();
    } else {
      expect(data).toEqual([]);
    }

    // Verify role is still "member"
    const { data: check } = await admin
      .from("group_members")
      .select("role")
      .eq("user_id", userId)
      .eq("group_id", testGroupId)
      .single();
    expect(check?.role).toBe("member");

    // Clean up
    await userClient
      .from("group_members")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", testGroupId);
  });

  test("group_members: can leave group (DELETE own)", async () => {
    // Join first
    await userClient.from("group_members").insert({
      user_id: userId,
      group_id: testGroupId,
      role: "member",
    });

    // Leave (DELETE own membership)
    const { error } = await userClient
      .from("group_members")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", testGroupId);
    expect(error).toBeNull();

    // Verify gone
    const { data: check } = await admin
      .from("group_members")
      .select("user_id")
      .eq("user_id", userId)
      .eq("group_id", testGroupId);
    expect(check).toEqual([]);
  });

  test("group_members: cannot remove another user", async () => {
    // User2 joins the group
    await admin.from("group_members").insert({
      user_id: user2Id,
      group_id: testGroupId,
      role: "member",
    });

    // User1 tries to delete user2's membership — should fail
    const { data } = await userClient
      .from("group_members")
      .delete()
      .eq("user_id", user2Id)
      .eq("group_id", testGroupId)
      .select("user_id");
    // RLS USING clause filters out rows where user_id != auth.uid()
    expect(data).toEqual([]);

    // Verify user2 is still a member
    const { data: check } = await admin
      .from("group_members")
      .select("user_id")
      .eq("user_id", user2Id)
      .eq("group_id", testGroupId)
      .single();
    expect(check).not.toBeNull();

    // Clean up
    await admin
      .from("group_members")
      .delete()
      .eq("user_id", user2Id)
      .eq("group_id", testGroupId);
  });

  // =========================================================================
  // Posts
  // =========================================================================

  test("posts: can read main feed posts (group_id IS NULL)", async () => {
    const { data, error } = await userClient
      .from("posts")
      .select("id")
      .is("group_id", null);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.some((p) => p.id === testPostId)).toBe(true);
  });

  test("posts: owner can update own post", async () => {
    const { error } = await userClient
      .from("posts")
      .update({ content: "RLS test post updated" })
      .eq("id", testPostId);
    expect(error).toBeNull();

    // Verify the update took effect
    const { data: check } = await admin
      .from("posts")
      .select("content")
      .eq("id", testPostId)
      .single();
    expect(check?.content).toBe("RLS test post updated");

    // Revert
    await admin
      .from("posts")
      .update({ content: "RLS test post" })
      .eq("id", testPostId);
  });

  test("posts: non-owner cannot update another's post", async () => {
    const { data, error } = await user2Client
      .from("posts")
      .update({ content: "Hijacked!" })
      .eq("id", testPostId)
      .select("id");
    // RLS USING clause won't match — either error or 0 rows
    if (error) {
      expect(error).not.toBeNull();
    } else {
      expect(data).toEqual([]);
    }

    // Verify content unchanged
    const { data: check } = await admin
      .from("posts")
      .select("content")
      .eq("id", testPostId)
      .single();
    expect(check?.content).toBe("RLS test post");
  });

  test("posts: non-owner non-admin cannot delete another's post", async () => {
    const { data } = await user2Client
      .from("posts")
      .delete()
      .eq("id", testPostId)
      .select("id");
    // User2 is a regular member — not owner, not admin, not group moderator
    expect(data).toEqual([]);

    // Verify post still exists
    const { data: check } = await admin
      .from("posts")
      .select("id")
      .eq("id", testPostId)
      .single();
    expect(check).not.toBeNull();
  });

  // =========================================================================
  // Post Reactions
  // =========================================================================

  test("post_reactions: can add reaction to visible post", async () => {
    const { error } = await userClient.from("post_reactions").insert({
      user_id: userId,
      post_id: testPostId,
      reaction_type: "like",
    });
    expect(error).toBeNull();
  });

  test("post_reactions: cannot update reaction (denied)", async () => {
    const { data, error } = await userClient
      .from("post_reactions")
      .update({ reaction_type: "love" })
      .eq("user_id", userId)
      .eq("post_id", testPostId)
      .select();
    // UPDATE policy uses USING(false)
    if (error) {
      expect(error).not.toBeNull();
    } else {
      expect(data).toEqual([]);
    }
  });

  test("post_reactions: can remove own reaction", async () => {
    const { error } = await userClient
      .from("post_reactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", testPostId)
      .eq("reaction_type", "like");
    expect(error).toBeNull();

    // Verify gone
    const { data: check } = await admin
      .from("post_reactions")
      .select("user_id")
      .eq("user_id", userId)
      .eq("post_id", testPostId);
    expect(check).toEqual([]);
  });

  test("post_reactions: cannot remove another user's reaction", async () => {
    // User2 adds a reaction
    await user2Client.from("post_reactions").insert({
      user_id: user2Id,
      post_id: testPostId,
      reaction_type: "like",
    });

    // User1 tries to delete user2's reaction
    const { data } = await userClient
      .from("post_reactions")
      .delete()
      .eq("user_id", user2Id)
      .eq("post_id", testPostId)
      .eq("reaction_type", "like")
      .select("user_id");
    // RLS USING clause filters — user_id != auth.uid()
    expect(data).toEqual([]);

    // Verify user2's reaction still exists
    const { data: check } = await admin
      .from("post_reactions")
      .select("user_id")
      .eq("user_id", user2Id)
      .eq("post_id", testPostId)
      .single();
    expect(check).not.toBeNull();

    // Clean up
    await admin
      .from("post_reactions")
      .delete()
      .eq("user_id", user2Id)
      .eq("post_id", testPostId);
  });

  // =========================================================================
  // Notifications
  // =========================================================================

  test("notifications: cannot read another user's notifications", async () => {
    // Insert a notification for user2 via service role
    const { error: insertErr } = await admin.from("notifications").insert({
      user_id: user2Id,
      source_user_id: userId,
      type: "rls_test",
      title: "Test notification",
      body: "You should not see this",
    });
    expect(insertErr).toBeNull();

    // User1 tries to read all notifications — should not see user2's
    const { data, error } = await userClient
      .from("notifications")
      .select("id, user_id")
      .eq("type", "rls_test");
    expect(error).toBeNull();
    // Should return 0 rows because RLS restricts to owner only
    expect(data).toEqual([]);

    // Clean up
    await admin.from("notifications").delete().eq("type", "rls_test");
  });
});
