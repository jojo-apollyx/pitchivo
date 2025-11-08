-- ============================================================================
-- FIX RLS INFINITE RECURSION
-- ============================================================================
-- This migration fixes the infinite recursion issue in user_profiles RLS policy

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Organization members can read each other's profiles" ON user_profiles;

-- Create a SECURITY DEFINER function to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM user_profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy using the function
CREATE POLICY "Organization members can read each other's profiles"
  ON user_profiles
  FOR SELECT
  USING (
    organization_id IS NOT NULL AND
    organization_id = get_user_organization_id(auth.uid())
  );

-- Also fix the organizations policy that has the same issue
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;
DROP POLICY IF EXISTS "Organization members can read organization" ON organizations;

-- Recreate with simpler approach
CREATE POLICY "Users can read own organization"
  ON organizations
  FOR SELECT
  USING (
    id = get_user_organization_id(auth.uid())
  );

