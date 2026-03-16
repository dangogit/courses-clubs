-- Phase 3: Upgrade protect_role_column → protect_sensitive_columns
-- Now protects: role, xp_total, level_id, tier_level
-- Uses app.bypass_column_protection session variable so SECURITY DEFINER
-- functions (like increment_xp) can bypass when needed.

-- =============================================================================
-- 1. Replace trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION protect_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip protection when system functions set the bypass flag
  IF current_setting('app.bypass_column_protection', true) IS DISTINCT FROM 'true' THEN
    NEW.role := OLD.role;
    NEW.xp_total := OLD.xp_total;
    NEW.level_id := OLD.level_id;
    NEW.tier_level := OLD.tier_level;
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 2. Swap triggers
-- =============================================================================

DROP TRIGGER IF EXISTS profiles_protect_role ON profiles;

CREATE TRIGGER profiles_protect_sensitive_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_sensitive_columns();

-- =============================================================================
-- 3. Clean up old function
-- =============================================================================

DROP FUNCTION IF EXISTS protect_role_column();
