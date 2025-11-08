-- ============================================================================
-- REMOVE REDUNDANT VIEWS
-- ============================================================================
-- Remove unused views: user_profile_with_org and organization_members
-- We'll use direct joins from user_profiles to organizations instead

DROP VIEW IF EXISTS user_profile_with_org;
DROP VIEW IF EXISTS organization_members;
DROP VIEW IF EXISTS waitlist_status;

