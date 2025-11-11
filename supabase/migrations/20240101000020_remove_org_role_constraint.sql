-- ============================================================================
-- REMOVE ORG_ROLE CONSTRAINT TO ALLOW ANY TEXT
-- ============================================================================
-- This migration removes the CHECK constraint on org_role to allow storing
-- full role titles (e.g., "Sales Manager", "Founder") instead of just categories

-- Drop the existing constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_org_role_check;

-- org_role can now store any text value (role titles)
COMMENT ON COLUMN user_profiles.org_role IS 'User role/title within organization (e.g., "Sales Manager", "Founder", "CEO")';

