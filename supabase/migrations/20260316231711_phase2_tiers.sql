-- Phase 2: Subscription tiers — lookup table + admin RPCs + performance indexes
-- Design spec: docs/superpowers/specs/2026-03-14-subscription-tiers-design.md

-- =============================================================================
-- 1. Tiers table (small lookup — uses IDENTITY, not UUID)
-- =============================================================================

CREATE TABLE tiers (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  level       int NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  color       text,  -- bare HSL value: "120 60% 40%"
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tiers_level ON tiers (level);

-- =============================================================================
-- 2. RLS — read-only for authenticated, managed via service role
-- =============================================================================

ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tiers_select_authenticated" ON tiers
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies — service role only

-- =============================================================================
-- 3. admin_set_tier_level() — set a user's tier (comp accounts, admin override)
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_set_tier_level(
  target_user_id uuid,
  new_level int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set tier levels';
  END IF;

  -- Validate tier level exists
  IF NOT EXISTS (
    SELECT 1 FROM public.tiers WHERE level = new_level
  ) THEN
    RAISE EXCEPTION 'Invalid tier level: %', new_level;
  END IF;

  -- Bypass the column protection trigger
  PERFORM set_config('app.bypass_column_protection', 'true', true);

  UPDATE public.profiles SET tier_level = new_level WHERE id = target_user_id;

  PERFORM set_config('app.bypass_column_protection', '', true);
END;
$$;

-- =============================================================================
-- 4. admin_set_content_tier() — set min_tier_level on content tables
--    Uses dynamic SQL with whitelisted table names (no injection risk)
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_set_content_tier(
  p_table_name text,
  p_content_id uuid,
  p_tier_level int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set content tier levels';
  END IF;

  -- Validate tier level exists
  IF NOT EXISTS (
    SELECT 1 FROM public.tiers WHERE level = p_tier_level
  ) THEN
    RAISE EXCEPTION 'Invalid tier level: %', p_tier_level;
  END IF;

  -- Whitelist of allowed tables (prevents SQL injection)
  IF p_table_name NOT IN ('courses', 'groups', 'events', 'recordings') THEN
    RAISE EXCEPTION 'Invalid table: %', p_table_name;
  END IF;

  -- Dynamic update (safe because table name is whitelisted above)
  EXECUTE format(
    'UPDATE public.%I SET min_tier_level = $1 WHERE id = $2',
    p_table_name
  ) USING p_tier_level, p_content_id;
END;
$$;

-- =============================================================================
-- 5. admin_set_lesson_tier() — lesson-level tier override (nullable)
--    Pass -1 to reset to inherited (NULL)
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_set_lesson_tier(
  p_lesson_id uuid,
  p_tier_level int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set lesson tier levels';
  END IF;

  IF p_tier_level = -1 THEN
    -- Reset to inherited (NULL = inherit from parent course)
    UPDATE public.lessons SET min_tier_level = NULL WHERE id = p_lesson_id;
  ELSE
    -- Validate tier level
    IF NOT EXISTS (
      SELECT 1 FROM public.tiers WHERE level = p_tier_level
    ) THEN
      RAISE EXCEPTION 'Invalid tier level: %', p_tier_level;
    END IF;

    UPDATE public.lessons SET min_tier_level = p_tier_level WHERE id = p_lesson_id;
  END IF;
END;
$$;

-- =============================================================================
-- 6. Performance indexes for RLS policy lookups and query filters
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_tier_level ON profiles (tier_level);
CREATE INDEX IF NOT EXISTS idx_courses_tier ON courses (min_tier_level);
CREATE INDEX IF NOT EXISTS idx_events_tier ON events (min_tier_level);
CREATE INDEX IF NOT EXISTS idx_groups_tier ON groups (min_tier_level);
CREATE INDEX IF NOT EXISTS idx_recordings_tier ON recordings (min_tier_level);
CREATE INDEX IF NOT EXISTS idx_lessons_tier ON lessons (min_tier_level)
  WHERE min_tier_level IS NOT NULL;
