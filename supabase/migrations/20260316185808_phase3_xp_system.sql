-- Phase 3: XP system — xp_events table, increment_xp RPC, auto-XP triggers
-- Awards XP for lesson completions, posts, and event RSVPs

-- =============================================================================
-- 1. XP Events table
-- =============================================================================

CREATE TABLE xp_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount          int NOT NULL,
  reason          text,
  reference_id    uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX idx_xp_events_user ON xp_events (user_id);
CREATE INDEX idx_xp_events_user_created ON xp_events (user_id, created_at DESC);
CREATE INDEX idx_xp_events_reference ON xp_events (reference_id) WHERE reference_id IS NOT NULL;

-- =============================================================================
-- 3. RLS policies — xp_events
-- =============================================================================

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own XP events
CREATE POLICY "xp_events_select_owner" ON xp_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No direct client INSERT/UPDATE/DELETE — handled by SECURITY DEFINER RPC + triggers
CREATE POLICY "xp_events_insert_none" ON xp_events
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "xp_events_update_none" ON xp_events
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "xp_events_delete_none" ON xp_events
  FOR DELETE TO authenticated
  USING (false);

-- =============================================================================
-- 4. increment_xp RPC — SECURITY DEFINER (bypasses RLS)
-- Inserts xp_event, updates profiles.xp_total, handles level-up
-- Returns: new_xp_total, new_level_id, leveled_up
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_xp(
  p_user_id     uuid,
  p_amount      int,
  p_reason      text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_level_id  int;
  v_new_xp_total  int;
  v_new_level_id  int;
  v_leveled_up    boolean := false;
BEGIN
  -- Get current level before XP change
  SELECT level_id INTO v_old_level_id
  FROM public.profiles
  WHERE id = p_user_id;

  -- Insert XP event
  INSERT INTO public.xp_events (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);

  -- Update profiles.xp_total atomically
  UPDATE public.profiles
  SET xp_total = xp_total + p_amount
  WHERE id = p_user_id
  RETURNING xp_total INTO v_new_xp_total;

  -- Find the highest level the user qualifies for
  SELECT id INTO v_new_level_id
  FROM public.levels
  WHERE xp_required <= v_new_xp_total
  ORDER BY xp_required DESC
  LIMIT 1;

  -- Default to level 1 if no match
  v_new_level_id := COALESCE(v_new_level_id, 1);

  -- Update level if changed
  IF v_new_level_id IS DISTINCT FROM v_old_level_id THEN
    v_leveled_up := true;

    -- Bypass the protect_role_column trigger's potential interference
    -- by setting only level_id (role is untouched, trigger won't block)
    UPDATE public.profiles
    SET level_id = v_new_level_id
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'new_xp_total', v_new_xp_total,
    'new_level_id', v_new_level_id,
    'leveled_up', v_leveled_up
  );
END;
$$;

-- =============================================================================
-- 5. Trigger functions — auto-award XP on actions
-- =============================================================================

-- 5a. Lesson completed → +50 XP
CREATE OR REPLACE FUNCTION on_lesson_progress_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.increment_xp(
    NEW.user_id,
    50,
    'lesson_completed',
    NEW.lesson_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lesson_progress_xp
  AFTER INSERT ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION on_lesson_progress_insert();

-- 5b. Post created → +10 XP
CREATE OR REPLACE FUNCTION on_post_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.increment_xp(
    NEW.user_id,
    10,
    'post_created',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_xp
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION on_post_insert();

-- 5c. Event RSVP → +20 XP
CREATE OR REPLACE FUNCTION on_event_rsvp_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.increment_xp(
    NEW.user_id,
    20,
    'event_rsvp',
    NEW.event_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_rsvp_xp
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION on_event_rsvp_insert();
