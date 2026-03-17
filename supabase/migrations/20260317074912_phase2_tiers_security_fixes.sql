-- Phase 2: Tier security hardening
-- Fixes from code review: REVOKE/GRANT, redundant index, server-side video_url gating

-- =============================================================================
-- 1. Restrict SECURITY DEFINER functions to authenticated role only
--    (previously callable by anon — internal admin check prevented escalation,
--     but exposing SECURITY DEFINER to anon is poor hygiene)
-- =============================================================================

REVOKE ALL ON FUNCTION admin_set_tier_level(uuid, int) FROM anon, public;
GRANT EXECUTE ON FUNCTION admin_set_tier_level(uuid, int) TO authenticated;

REVOKE ALL ON FUNCTION admin_set_content_tier(text, uuid, int) FROM anon, public;
GRANT EXECUTE ON FUNCTION admin_set_content_tier(text, uuid, int) TO authenticated;

REVOKE ALL ON FUNCTION admin_set_lesson_tier(uuid, int) FROM anon, public;
GRANT EXECUTE ON FUNCTION admin_set_lesson_tier(uuid, int) TO authenticated;

-- =============================================================================
-- 2. Drop redundant index on tiers.level
--    (UNIQUE constraint already creates an implicit B-tree index)
-- =============================================================================

DROP INDEX IF EXISTS idx_tiers_level;

-- =============================================================================
-- 3. Server-side lesson detail RPC — nullifies video_url for under-tier users
--    This prevents API-level bypass of client-side lock overlays.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lesson_with_access(
  p_course_id uuid,
  p_lesson_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_user_tier int;
  v_course_tier int;
  v_lesson_tier int;
  v_effective_tier int;
  v_lesson jsonb;
BEGIN
  -- Get current user
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's tier level
  SELECT tier_level INTO v_user_tier
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_tier IS NULL THEN
    v_user_tier := 0;
  END IF;

  -- Get course tier
  SELECT min_tier_level INTO v_course_tier
  FROM public.courses
  WHERE id = p_course_id AND is_published = true;

  IF v_course_tier IS NULL THEN
    RAISE EXCEPTION 'Course not found';
  END IF;

  -- Get lesson as JSON
  SELECT to_jsonb(l.*) INTO v_lesson
  FROM public.lessons l
  WHERE l.id = p_lesson_id AND l.course_id = p_course_id;

  IF v_lesson IS NULL THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  -- Resolve effective tier: lesson override ?? course tier
  v_lesson_tier := (v_lesson ->> 'min_tier_level')::int;
  v_effective_tier := COALESCE(v_lesson_tier, v_course_tier);

  -- If user doesn't have access, nullify sensitive fields
  IF v_user_tier < v_effective_tier THEN
    v_lesson := v_lesson || jsonb_build_object(
      'video_url', null,
      '_locked', true,
      '_required_tier', v_effective_tier
    );
  ELSE
    v_lesson := v_lesson || jsonb_build_object(
      '_locked', false,
      '_required_tier', v_effective_tier
    );
  END IF;

  RETURN v_lesson;
END;
$$;

-- Restrict to authenticated only
REVOKE ALL ON FUNCTION get_lesson_with_access(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION get_lesson_with_access(uuid, uuid) TO authenticated;
