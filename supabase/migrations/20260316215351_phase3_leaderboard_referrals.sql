-- Phase 3: Leaderboard RPCs + invite_links & referrals tables
-- Wires leaderboard view to real xp_events data, adds referral system

-- =============================================================================
-- 1. Leaderboard RPC — get_leaderboard(period)
-- Returns top 50 users ranked by XP within a time window
-- =============================================================================

CREATE OR REPLACE FUNCTION get_leaderboard(p_period text DEFAULT 'alltime')
RETURNS TABLE (
  rank        bigint,
  user_id     uuid,
  display_name text,
  avatar_url  text,
  points      bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_since timestamptz;
BEGIN
  -- Determine time window
  CASE p_period
    WHEN 'weekly'  THEN v_since := date_trunc('week', now());
    WHEN 'monthly' THEN v_since := date_trunc('month', now());
    ELSE v_since := NULL; -- alltime
  END CASE;

  RETURN QUERY
  SELECT
    row_number() OVER (ORDER BY sum(xe.amount) DESC) AS rank,
    xe.user_id,
    p.display_name,
    p.avatar_url,
    sum(xe.amount)::bigint AS points
  FROM public.xp_events xe
  JOIN public.profiles p ON p.id = xe.user_id
  WHERE (v_since IS NULL OR xe.created_at >= v_since)
  GROUP BY xe.user_id, p.display_name, p.avatar_url
  ORDER BY points DESC
  LIMIT 50;
END;
$$;

-- =============================================================================
-- 2. get_user_rank RPC — current user's rank + XP for a given period
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_rank(p_period text DEFAULT 'alltime')
RETURNS TABLE (
  rank   bigint,
  points bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_since   timestamptz;
  v_user_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  CASE p_period
    WHEN 'weekly'  THEN v_since := date_trunc('week', now());
    WHEN 'monthly' THEN v_since := date_trunc('month', now());
    ELSE v_since := NULL;
  END CASE;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      xe.user_id,
      sum(xe.amount)::bigint AS total_points,
      row_number() OVER (ORDER BY sum(xe.amount) DESC) AS user_rank
    FROM public.xp_events xe
    WHERE (v_since IS NULL OR xe.created_at >= v_since)
    GROUP BY xe.user_id
  )
  SELECT r.user_rank AS rank, r.total_points AS points
  FROM ranked r
  WHERE r.user_id = v_user_id;
END;
$$;

-- =============================================================================
-- 3. invite_links table
-- =============================================================================

CREATE TABLE invite_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE NOT NULL,
  created_by      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  discount_percent int DEFAULT 0,
  max_uses        int,           -- NULL = unlimited
  uses_count      int DEFAULT 0,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- FK index (CASCADE + queries by creator)
CREATE INDEX idx_invite_links_created_by ON invite_links (created_by);

-- =============================================================================
-- 4. referrals table
-- =============================================================================

CREATE TABLE referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  referred_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  invite_code     text REFERENCES invite_links (code),
  reward_xp       int NOT NULL DEFAULT 50,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id),                              -- one referrer per signup
  CHECK (referrer_id != referred_id)                 -- no self-referrals
);

-- FK indexes for JOINs and CASCADE
CREATE INDEX idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX idx_referrals_referred ON referrals (referred_id);
CREATE INDEX idx_referrals_invite_code ON referrals (invite_code) WHERE invite_code IS NOT NULL;

-- =============================================================================
-- 5. RLS — invite_links
-- =============================================================================

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read invite links (needed for signup validation)
CREATE POLICY "invite_links_select_authenticated" ON invite_links
  FOR SELECT TO authenticated
  USING (true);

-- Users can create their own invite links
CREATE POLICY "invite_links_insert_owner" ON invite_links
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- No client UPDATE (uses_count managed by trigger)
CREATE POLICY "invite_links_update_none" ON invite_links
  FOR UPDATE TO authenticated
  USING (false);

-- Owner can delete their own invite links
CREATE POLICY "invite_links_delete_owner" ON invite_links
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = created_by);

-- =============================================================================
-- 6. RLS — referrals
-- =============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see their own referrals
CREATE POLICY "referrals_select_referrer" ON referrals
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = referrer_id);

-- No direct client writes — managed by SECURITY DEFINER function
CREATE POLICY "referrals_insert_none" ON referrals
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "referrals_update_none" ON referrals
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "referrals_delete_none" ON referrals
  FOR DELETE TO authenticated
  USING (false);

-- =============================================================================
-- 7. record_referral RPC — SECURITY DEFINER
-- Called during signup when a user signs up with an invite code.
-- Records the referral, awards XP to referrer, increments uses_count.
-- =============================================================================

CREATE OR REPLACE FUNCTION record_referral(
  p_referred_id  uuid,
  p_invite_code  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_referrer_id   uuid;
  v_reward_xp     int := 50;
  v_xp_result     jsonb;
BEGIN
  -- Look up the invite link
  SELECT created_by INTO v_referrer_id
  FROM public.invite_links
  WHERE code = p_invite_code
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;

  -- Record the referral
  INSERT INTO public.referrals (referrer_id, referred_id, invite_code, reward_xp)
  VALUES (v_referrer_id, p_referred_id, p_invite_code, v_reward_xp);

  -- Increment uses_count on the invite link
  UPDATE public.invite_links
  SET uses_count = uses_count + 1
  WHERE code = p_invite_code;

  -- Award XP to the referrer
  v_xp_result := public.increment_xp(
    v_referrer_id,
    v_reward_xp,
    'referral',
    p_referred_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'reward_xp', v_reward_xp,
    'xp_result', v_xp_result
  );
END;
$$;

-- =============================================================================
-- 8. Auto-generate invite code on profile creation
-- =============================================================================

CREATE OR REPLACE FUNCTION on_profile_create_invite_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.invite_links (code, created_by)
  VALUES (encode(gen_random_bytes(6), 'hex'), NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_invite_link
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_profile_create_invite_link();

-- =============================================================================
-- 9. get_top_inviters RPC — for the invite page leaderboard
-- =============================================================================

CREATE OR REPLACE FUNCTION get_top_inviters(p_limit int DEFAULT 10)
RETURNS TABLE (
  user_id      uuid,
  display_name text,
  avatar_url   text,
  referral_count bigint,
  total_xp     bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.referrer_id AS user_id,
    p.display_name,
    p.avatar_url,
    count(*)::bigint AS referral_count,
    sum(r.reward_xp)::bigint AS total_xp
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_id
  GROUP BY r.referrer_id, p.display_name, p.avatar_url
  ORDER BY referral_count DESC
  LIMIT p_limit;
END;
$$;
