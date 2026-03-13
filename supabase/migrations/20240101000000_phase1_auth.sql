-- Phase 1: Auth infrastructure — levels, profiles, RLS, auto-creation trigger
-- This migration is applied once per club via `supabase db push`

-- =============================================================================
-- 1. Levels table (must exist before profiles, FK target)
-- =============================================================================

CREATE TABLE levels (
  id              int PRIMARY KEY,
  title           text NOT NULL,
  xp_required     int NOT NULL,
  badge_url       text,
  color           text
);

-- =============================================================================
-- 2. Profiles table
-- =============================================================================

CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name    text,
  first_name      text,
  last_name       text,
  avatar_url      text,
  bio             text,
  phone           text,
  role            text NOT NULL DEFAULT 'member'
                    CHECK (role IN ('member', 'moderator', 'admin')),
  xp_total        int NOT NULL DEFAULT 0,
  level_id        int REFERENCES levels DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. Indexes
-- =============================================================================

CREATE INDEX idx_profiles_role ON profiles (role) WHERE role IN ('admin', 'moderator');

-- =============================================================================
-- 4. RLS policies
-- =============================================================================

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "levels_select_authenticated" ON levels
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_update_owner" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 5. Updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 6. Auto-create profile on sign-up
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NULLIF(NEW.raw_user_meta_data ->> 'name', ''), NULL),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', ''), NULLIF(NEW.raw_user_meta_data ->> 'picture', ''), NULL)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
