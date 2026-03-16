# Design Spec — Wire Social Feed & Groups to Supabase

**Issue:** #10
**Date:** 2026-03-16
**Status:** Draft

---

## Overview

Wire the social feed, groups, posts, comments, and reactions to Supabase. Replace all mock data in Feed.tsx, Groups.tsx, and GroupDetail.tsx with live queries. Add Realtime subscriptions for live feed updates and @mention notifications via a new notifications table.

---

## 1. Migration Schema

Single migration file: `supabase/migrations/YYYYMMDDHHMMSS_phase2_community.sql`

### 1.1 Groups

```sql
CREATE TABLE groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  thumbnail_url   text,
  banner_url      text,
  category        text,
  is_private      bool NOT NULL DEFAULT false,
  min_tier_level  int NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 1.2 Group Members

```sql
CREATE TABLE group_members (
  user_id   uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  group_id  uuid NOT NULL REFERENCES groups ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member',  -- 'member' | 'moderator'
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);
```

### 1.3 Posts

Extends `docs/schema.md` with two additions:
- `post_type text` — filterable (question, share, project, achievement, announcement)
- `images text[]` replaces `image_url text` — PostCard already renders multi-image grids

```sql
CREATE TABLE posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  group_id    uuid REFERENCES groups ON DELETE CASCADE,  -- NULL = main feed
  content     text NOT NULL,
  post_type   text,          -- 'question' | 'share' | 'project' | 'achievement' | 'announcement'
  images      text[],        -- array of image URLs
  is_pinned   bool NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### 1.4 Post Comments

```sql
CREATE TABLE post_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  parent_id   uuid REFERENCES post_comments ON DELETE CASCADE,  -- threaded replies
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### 1.5 Post Reactions

PK includes `reaction_type` so users can react with multiple emoji types per post (love, fire, idea, robot, clap, question).

```sql
CREATE TABLE post_reactions (
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  post_id       uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id, reaction_type)
);
```

### 1.6 Notifications (minimal)

Minimal table for @mention notifications. Full notification system (Realtime push, email hooks, UI) is issue #17.

```sql
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  source_user_id  uuid REFERENCES auth.users ON DELETE SET NULL,  -- who triggered it
  type            text NOT NULL,      -- 'mention' | 'reply' | 'reaction' (extensible by #17)
  title           text NOT NULL,
  body            text,
  action_url      text,
  is_read         bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 2. Indexes

PostgreSQL does NOT auto-index FK columns. All FK columns must have explicit indexes for JOIN and CASCADE performance.

```sql
-- Groups
CREATE INDEX idx_groups_category ON groups (category);
CREATE INDEX idx_groups_created_by ON groups (created_by);  -- FK index

-- Group members
CREATE INDEX idx_group_members_group ON group_members (group_id);  -- FK index
CREATE INDEX idx_group_members_user ON group_members (user_id);    -- FK index + RLS

-- Posts (composite index for cursor-based pagination)
CREATE INDEX idx_posts_feed ON posts (group_id, created_at DESC, id DESC);  -- feed query + cursor
CREATE INDEX idx_posts_user ON posts (user_id);  -- FK index + RLS

-- Post comments
CREATE INDEX idx_post_comments_post ON post_comments (post_id, created_at);  -- FK index + feed query
CREATE INDEX idx_post_comments_parent ON post_comments (parent_id);          -- FK index
CREATE INDEX idx_post_comments_user ON post_comments (user_id);              -- FK index + RLS

-- Post reactions
CREATE INDEX idx_post_reactions_post ON post_reactions (post_id, reaction_type);  -- aggregation query

-- Notifications
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);  -- FK + feed
CREATE INDEX idx_notifications_source ON notifications (source_user_id);  -- FK index
```

---

## 3. RLS Policies

**Performance note:** All policies use `(SELECT auth.uid())` instead of bare `auth.uid()` to cache the function call per policy evaluation (Supabase best practice — avoids per-row function invocation).

### 3.1 Groups

```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see all groups
CREATE POLICY "groups_select_authenticated" ON groups
  FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE — managed via service role (admin CMS)
```

### 3.2 Group Members

```sql
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see memberships
CREATE POLICY "group_members_select_authenticated" ON group_members
  FOR SELECT TO authenticated USING (true);

-- Join: owner only, gated by tier
CREATE POLICY "group_members_insert_owner_tier" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      SELECT p.tier_level >= g.min_tier_level
      FROM profiles p, groups g
      WHERE p.id = (SELECT auth.uid()) AND g.id = group_id
    )
  );

-- Leave: owner only
CREATE POLICY "group_members_delete_owner" ON group_members
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- No UPDATE — to change role, admin uses service role
CREATE POLICY "group_members_update_deny" ON group_members
  FOR UPDATE TO authenticated USING (false);
```

### 3.3 Posts

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated for public groups + main feed; members only for private groups
CREATE POLICY "posts_select_authenticated" ON posts
  FOR SELECT TO authenticated
  USING (
    group_id IS NULL  -- main feed: visible to all
    OR NOT (SELECT is_private FROM groups WHERE id = group_id)  -- public group
    OR EXISTS (  -- member of private group
      SELECT 1 FROM group_members
      WHERE group_members.group_id = posts.group_id
        AND group_members.user_id = (SELECT auth.uid())
    )
  );

-- INSERT: authenticated user, own post, must be group member for group posts
CREATE POLICY "posts_insert_owner" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      group_id IS NULL  -- main feed: anyone can post
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = posts.group_id
          AND group_members.user_id = (SELECT auth.uid())
      )
    )
  );

-- UPDATE: owner only
CREATE POLICY "posts_update_owner" ON posts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: owner + site admin + site moderator + group moderator
CREATE POLICY "posts_delete_authorized" ON posts
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id  -- owner
    OR (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'moderator')  -- site admin/mod
    OR EXISTS (  -- group moderator
      SELECT 1 FROM group_members
      WHERE group_members.group_id = posts.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = 'moderator'
    )
  );
```

### 3.4 Post Comments

```sql
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: follows post visibility (if you can see the post, you can see comments)
CREATE POLICY "post_comments_select_authenticated" ON post_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_comments.post_id
    )
  );

-- INSERT: authenticated, own comment
CREATE POLICY "post_comments_insert_owner" ON post_comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: owner only
CREATE POLICY "post_comments_update_owner" ON post_comments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: owner + site admin + site moderator + group moderator (via post's group)
CREATE POLICY "post_comments_delete_authorized" ON post_comments
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'moderator')
    OR EXISTS (
      SELECT 1 FROM group_members gm
      JOIN posts p ON p.group_id = gm.group_id
      WHERE p.id = post_comments.post_id
        AND gm.user_id = (SELECT auth.uid())
        AND gm.role = 'moderator'
    )
  );
```

### 3.5 Post Reactions

```sql
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: follows post visibility (if you can see the post, you can see reactions)
CREATE POLICY "post_reactions_select_authenticated" ON post_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_reactions.post_id
    )
  );

-- INSERT: owner only
CREATE POLICY "post_reactions_insert_owner" ON post_reactions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: owner only (unreact)
CREATE POLICY "post_reactions_delete_owner" ON post_reactions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- No UPDATE — delete and re-insert
CREATE POLICY "post_reactions_update_deny" ON post_reactions
  FOR UPDATE TO authenticated USING (false);
```

### 3.6 Notifications

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: owner only
CREATE POLICY "notifications_select_owner" ON notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- INSERT: service role / triggers only (no direct client inserts)

-- UPDATE: owner (mark as read)
CREATE POLICY "notifications_update_owner" ON notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: owner
CREATE POLICY "notifications_delete_owner" ON notifications
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

## 4. Database Triggers

### 4.1 Updated-at Triggers

`update_updated_at()` function already exists from Phase 1 auth migration. Only create new triggers:

```sql
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.2 @Mention Notification Trigger

Fires on `posts` INSERT and `post_comments` INSERT. Parses `@display_name` from content, resolves to profile, inserts notification.

**Known limitation:** `display_name` has no UNIQUE constraint. If two users share a name, the first match is used. A future improvement could switch to UUID-based mentions (`@[uuid]`) resolved at render time, or add a UNIQUE constraint on `display_name` with a collision-avoidance strategy.

```sql
CREATE OR REPLACE FUNCTION public.notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mention text;
  mentioned_user_id uuid;
BEGIN
  -- Extract @mentions from content (matches @<display_name> pattern)
  FOR mention IN
    SELECT DISTINCT (regexp_matches(NEW.content, '@([^\s@]+(?:\s[^\s@]+)?)', 'g'))[1]
  LOOP
    -- Resolve display_name to user_id
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE display_name = mention
    LIMIT 1;

    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, source_user_id, type, title, body, action_url)
      VALUES (
        mentioned_user_id,
        NEW.user_id,
        'mention',
        'אזכור חדש',  -- "New mention"
        substring(NEW.content FROM 1 FOR 200),
        CASE
          WHEN TG_TABLE_NAME = 'posts' THEN '/feed?post=' || NEW.id
          WHEN TG_TABLE_NAME = 'post_comments' THEN '/feed?post=' || NEW.post_id
        END
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER posts_mention_notify
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();

CREATE TRIGGER post_comments_mention_notify
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();
```

---

## 5. Supabase Realtime Configuration

### 5.1 Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
```

### 5.2 Client-Side Subscription Strategy

Row-level filtered channels for scalability:

- **Main feed**: filter `group_id=is.null` (NOT `eq.null` — Supabase Realtime uses `is` for null)
- **Group feed**: filter `group_id=eq.<uuid>`

```typescript
// Main feed example
supabase.channel('feed-main')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts',
    filter: 'group_id=is.null'
  }, handler)
  .subscribe();

// Group feed example
supabase.channel(`feed-${groupId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts',
    filter: `group_id=eq.${groupId}`
  }, handler)
  .subscribe();
```

Each page subscribes/unsubscribes on mount/unmount via `useFeedRealtime(groupId?)` hook.

On receiving `INSERT` event → prepend new post to TanStack Query cache.
On receiving `DELETE` event → remove post from cache.
On receiving `UPDATE` event → update post in cache.

---

## 6. TanStack Query Hooks

All hooks in `src/hooks/`. Import `Database` type from `src/lib/database.types.ts`.

### 6.1 Groups

| Hook | Query Key | Behavior |
|---|---|---|
| `useGroups()` | `['groups']` | Fetch all groups with member count via Supabase count aggregation (`.select('*, group_members(count)')`). 5 min stale time. |
| `useGroup(id)` | `['groups', id]` | Single group + current user's membership status. |
| `useJoinGroup()` | mutation | Insert into `group_members`. Invalidates `['groups']` and `['groups', id]`. |
| `useLeaveGroup()` | mutation | Delete from `group_members`. Invalidates same. |

### 6.2 Feed / Posts

| Hook | Query Key | Behavior |
|---|---|---|
| `useFeed(groupId?)` | `['feed', groupId ?? 'main']` | `useInfiniteQuery` — cursor-based pagination (20 per page) using composite cursor `(created_at, id)` to handle timestamp ties: `WHERE (created_at, id) < (lastTimestamp, lastId)`. Cursor-based avoids offset drift from Realtime inserts. Joins `profiles` for author data. Aggregates reaction counts via Supabase count. Pinned posts fetched separately and prepended to first page only (excluded from cursor). |
| `useCreatePost()` | mutation | Insert post. Invalidates feed. |
| `useUpdatePost()` | mutation | Update post content/images. Optimistic update. |
| `useDeletePost()` | mutation | Delete post. Optimistic removal from cache. |

### 6.3 Comments

| Hook | Query Key | Behavior |
|---|---|---|
| `useComments(postId)` | `['comments', postId]` | Fetch comments + nested replies (via `parent_id`). Join `profiles` for author data. |
| `useCreateComment()` | mutation | Insert comment (with optional `parent_id`). Invalidates `['comments', postId]`. |
| `useUpdateComment()` | mutation | Update comment content. |
| `useDeleteComment()` | mutation | Delete comment. |

### 6.4 Reactions

| Hook | Query Key | Behavior |
|---|---|---|
| `useToggleReaction()` | mutation | Toggle pattern: attempt DELETE first; if 0 rows affected, INSERT. No UPDATE (denied by RLS). Optimistic update on reaction counts in feed cache. Defense-in-depth: always include `.eq("user_id", user.id)` in client queries even though RLS handles it. |

### 6.5 Realtime

| Hook | Behavior |
|---|---|
| `useFeedRealtime(groupId?)` | Creates Supabase channel with postgres_changes filter on `posts` table. Filters by `group_id`. On INSERT/DELETE/UPDATE → mutates TanStack Query cache directly. Cleans up channel on unmount. |

---

## 7. View Wiring

### 7.1 Feed.tsx

- Replace 4 hardcoded mock posts with `useFeed(null)`
- Wire `useCreatePost()` to CreatePostDialog
- Wire `useFeedRealtime(null)` for live updates
- Post type filter uses query param or local state to filter client-side (all types loaded)
- Remove mock `CURRENT_USER` — use Supabase auth user

### 7.2 Groups.tsx

- Replace `groups` import from `src/data/groups.ts` with `useGroups()`
- Wire join/leave buttons to `useJoinGroup()` / `useLeaveGroup()`
- Search/filter remains client-side (small dataset)

### 7.3 GroupDetail.tsx

- Replace `groupPosts[groupId]` with `useFeed(groupId)`
- Wire `useFeedRealtime(groupId)` for live group feed
- Wire `useJoinGroup()` / `useLeaveGroup()` for membership
- Wire `useCreatePost()` for group post composer

### 7.4 PostCard.tsx

- Replace `CURRENT_USER` string comparison with `auth.uid()` check
- Wire `useToggleReaction()` to reaction buttons
- Wire `useComments(postId)` for comment thread
- Wire `useCreateComment()`, `useUpdateComment()`, `useDeleteComment()`
- Admin/moderator delete via existing `useAdmin()` context + RLS enforcement

---

## 8. Seed Data

Translate existing mock data from `src/data/groups.ts` into `supabase/seed.sql` additions:
- 6 groups matching current mock structure
- Mock `leader` → set as `created_by` + insert into `group_members` with `role = 'moderator'`
- `longDescription` → stored in `description` (schema has no separate field)
- `members` / `posts` counts → not seeded (computed from relations)
- Sample posts per group (optional — can start empty)

---

## 9. Type Generation

After migration:
```bash
supabase gen types typescript --local > src/lib/database.types.ts
```

Clean stderr leaks from output file. Commit the updated types.

---

## 10. Testing Strategy

### Unit Tests
- `useGroups`, `useGroup` — mock Supabase, verify query keys and transforms
- `useCreatePost`, `useToggleReaction` — verify optimistic updates
- `useFeedRealtime` — verify channel setup/teardown
- @mention regex parsing (extract to utility function, test edge cases)

### Integration Tests
- RLS: verify post visibility for private groups (member vs non-member)
- RLS: verify moderator delete permission
- RLS: verify tier-gated group join
- @mention trigger: verify notification row created

### E2E Tests (Playwright)
- Create post in main feed → appears without refresh (Realtime)
- Create post in group feed → visible to member, not to non-member
- Join group → leave group flow
- React to post → reaction count updates
- Comment on post → comment appears

---

## 11. Files Changed

| File | Change |
|---|---|
| `supabase/migrations/YYYYMMDDHHMMSS_phase2_community.sql` | New — all tables, RLS, triggers, indexes |
| `supabase/seed.sql` | Add group seed data |
| `src/lib/database.types.ts` | Regenerated |
| `src/hooks/useGroups.ts` | New |
| `src/hooks/useGroup.ts` | New |
| `src/hooks/useJoinGroup.ts` | New |
| `src/hooks/useLeaveGroup.ts` | New |
| `src/hooks/useFeed.ts` | New |
| `src/hooks/useCreatePost.ts` | New |
| `src/hooks/useUpdatePost.ts` | New |
| `src/hooks/useDeletePost.ts` | New |
| `src/hooks/useComments.ts` | New |
| `src/hooks/useCreateComment.ts` | New |
| `src/hooks/useUpdateComment.ts` | New |
| `src/hooks/useDeleteComment.ts` | New |
| `src/hooks/useToggleReaction.ts` | New |
| `src/hooks/useFeedRealtime.ts` | New |
| `src/lib/mentions.ts` | New — @mention parsing utility |
| `src/views/Feed.tsx` | Wire to hooks, remove mock data |
| `src/views/Groups.tsx` | Wire to hooks, remove mock imports |
| `src/views/GroupDetail.tsx` | Wire to hooks, remove mock imports |
| `src/components/PostCard.tsx` | Wire to hooks, replace CURRENT_USER |
| `src/components/CreatePostDialog.tsx` | Wire to useCreatePost |
| `docs/schema.md` | Update posts schema (post_type, images), post_reactions PK, add notifications |

---

## 12. Out of Scope

- Full notification UI and Realtime push (issue #17)
- Notification email delivery via Resend (issue #18)
- Tier-based post visibility (future — posts are currently visible to all authenticated users in public groups)
- Post bookmarks / saved posts (not in schema — future feature)
- AI summary generation (future — field exists in UI but not wired)
