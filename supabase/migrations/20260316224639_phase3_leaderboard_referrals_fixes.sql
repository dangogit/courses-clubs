-- Phase 3 fixes: security hardening for leaderboard & referrals
-- Addresses code review findings: auth check, race condition, RLS, constraints

-- =============================================================================
-- 1. Fix record_referral — add authorization + row lock
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
  -- Authorization: caller must be the referred user
  IF (SELECT auth.uid()) IS DISTINCT FROM p_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Look up the invite link with row lock to prevent race condition
  SELECT created_by INTO v_referrer_id
  FROM public.invite_links
  WHERE code = p_invite_code
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  FOR UPDATE;

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
-- 2. Restrict invite_links SELECT to owner only
-- record_referral is SECURITY DEFINER, so it bypasses RLS — no need for
-- a broad SELECT policy that leaks all invite codes.
-- =============================================================================

DROP POLICY "invite_links_select_authenticated" ON invite_links;

CREATE POLICY "invite_links_select_owner" ON invite_links
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = created_by);

-- =============================================================================
-- 3. Add CHECK constraint on discount_percent (0–100)
-- =============================================================================

ALTER TABLE invite_links
  ADD CONSTRAINT invite_links_discount_percent_range
  CHECK (discount_percent BETWEEN 0 AND 100);

-- =============================================================================
-- 4. Make uses_count NOT NULL (default 0, already set — just enforce)
-- =============================================================================

ALTER TABLE invite_links
  ALTER COLUMN uses_count SET NOT NULL;
