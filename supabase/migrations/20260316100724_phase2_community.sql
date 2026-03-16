-- Phase 2: Community — groups, posts, comments, reactions, notifications
-- Tables, RLS policies, triggers, indexes, and Realtime configuration

-- =============================================================================
-- 0. Prerequisites — add tier_level to profiles (needed for group join gating)
-- Full tier system in issue #30; this just adds the column with default 0 (free)
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier_level int NOT NULL DEFAULT 0;

-- =============================================================================
-- 1. Groups
-- =============================================================================

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

-- =============================================================================
-- 2. Group Members
-- =============================================================================

CREATE TABLE group_members (
  user_id   uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  group_id  uuid NOT NULL REFERENCES groups ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member',  -- 'member' | 'moderator'
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- =============================================================================
-- 3. Posts
-- =============================================================================

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

-- =============================================================================
-- 4. Post Comments
-- =============================================================================

CREATE TABLE post_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  parent_id   uuid REFERENCES post_comments ON DELETE CASCADE,  -- threaded replies
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. Post Reactions
-- =============================================================================

CREATE TABLE post_reactions (
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  post_id       uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id, reaction_type)
);

-- =============================================================================
-- 6. Notifications (minimal — full system in issue #17)
-- =============================================================================

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  source_user_id  uuid REFERENCES auth.users ON DELETE SET NULL,
  type            text NOT NULL,      -- 'mention' | 'reply' | 'reaction'
  title           text NOT NULL,
  body            text,
  action_url      text,
  is_read         bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. Indexes
-- PostgreSQL does NOT auto-index FK columns.
-- =============================================================================

-- Groups
CREATE INDEX idx_groups_category ON groups (category);
CREATE INDEX idx_groups_created_by ON groups (created_by);

-- Group members
CREATE INDEX idx_group_members_group ON group_members (group_id);
CREATE INDEX idx_group_members_user ON group_members (user_id);

-- Posts (composite index for cursor-based pagination)
CREATE INDEX idx_posts_feed ON posts (group_id, created_at DESC, id DESC);
CREATE INDEX idx_posts_user ON posts (user_id);

-- Post comments
CREATE INDEX idx_post_comments_post ON post_comments (post_id, created_at);
CREATE INDEX idx_post_comments_parent ON post_comments (parent_id);
CREATE INDEX idx_post_comments_user ON post_comments (user_id);

-- Post reactions
CREATE INDEX idx_post_reactions_post ON post_reactions (post_id, reaction_type);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_source ON notifications (source_user_id);

-- =============================================================================
-- 8. RLS — Groups
-- =============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select_authenticated" ON groups
  FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE — managed via service role (admin CMS)

-- =============================================================================
-- 9. RLS — Group Members
-- =============================================================================

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_authenticated" ON group_members
  FOR SELECT TO authenticated USING (true);

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

CREATE POLICY "group_members_delete_owner" ON group_members
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "group_members_update_deny" ON group_members
  FOR UPDATE TO authenticated USING (false);

-- =============================================================================
-- 10. RLS — Posts
-- =============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_authenticated" ON posts
  FOR SELECT TO authenticated
  USING (
    group_id IS NULL
    OR NOT (SELECT is_private FROM groups WHERE id = group_id)
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = posts.group_id
        AND group_members.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "posts_insert_owner" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = posts.group_id
          AND group_members.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "posts_update_owner" ON posts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "posts_delete_authorized" ON posts
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'moderator')
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = posts.group_id
        AND group_members.user_id = (SELECT auth.uid())
        AND group_members.role = 'moderator'
    )
  );

-- =============================================================================
-- 11. RLS — Post Comments
-- =============================================================================

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_select_authenticated" ON post_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_comments.post_id
    )
  );

CREATE POLICY "post_comments_insert_owner" ON post_comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "post_comments_update_owner" ON post_comments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

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

-- =============================================================================
-- 12. RLS — Post Reactions
-- =============================================================================

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions_select_authenticated" ON post_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_reactions.post_id
    )
  );

CREATE POLICY "post_reactions_insert_owner" ON post_reactions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "post_reactions_delete_owner" ON post_reactions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "post_reactions_update_deny" ON post_reactions
  FOR UPDATE TO authenticated USING (false);

-- =============================================================================
-- 13. RLS — Notifications
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_owner" ON notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- No INSERT policy — service role / triggers only

CREATE POLICY "notifications_update_owner" ON notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_delete_owner" ON notifications
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- 14. Triggers — updated_at
-- update_updated_at() function already exists from Phase 1 auth migration
-- =============================================================================

CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 15. Trigger — @mention notifications
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mention text;
  mentioned_user_id uuid;
BEGIN
  FOR mention IN
    SELECT DISTINCT (regexp_matches(NEW.content, '@([^\s@]+(?:\s[^\s@]+)?)', 'g'))[1]
  LOOP
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
        'אזכור חדש',
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

-- =============================================================================
-- 16. Realtime — enable for posts table
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE posts;
