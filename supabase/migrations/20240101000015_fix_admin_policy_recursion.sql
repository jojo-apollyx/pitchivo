-- ============================================================================
-- FIX INFINITE RECURSION IN ADMIN POLICIES
-- ============================================================================

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Pitchivo admins can read all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Pitchivo admins can read all waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Pitchivo admins can update waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Pitchivo admins can read all organizations" ON organizations;
DROP POLICY IF EXISTS "Pitchivo admins can update organizations" ON organizations;

-- Also drop the old problematic waitlist policy that queries auth.users
DROP POLICY IF EXISTS "Users can read own waitlist entry" ON waitlist;

-- ============================================================================
-- CREATE SECURITY DEFINER FUNCTION TO CHECK ADMIN STATUS
-- ============================================================================
-- This function bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION is_pitchivo_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_pitchivo_admin = true
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_pitchivo_admin() TO authenticated;

-- ============================================================================
-- RECREATE ADMIN POLICIES USING THE SECURITY DEFINER FUNCTION
-- ============================================================================

-- Waitlist policies
CREATE POLICY "Pitchivo admins can read all waitlist entries"
  ON waitlist
  FOR SELECT
  USING (is_pitchivo_admin());

CREATE POLICY "Pitchivo admins can update waitlist entries"
  ON waitlist
  FOR UPDATE
  USING (is_pitchivo_admin());

-- Recreate the user's own waitlist entry policy without querying auth.users
-- Users can only see their own waitlist entry by matching email in user_profiles
CREATE POLICY "Users can read own waitlist entry"
  ON waitlist
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    email IN (
      SELECT email FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Organizations policies
CREATE POLICY "Pitchivo admins can read all organizations"
  ON organizations
  FOR SELECT
  USING (is_pitchivo_admin());

CREATE POLICY "Pitchivo admins can update organizations"
  ON organizations
  FOR UPDATE
  USING (is_pitchivo_admin());

-- User profiles policies
CREATE POLICY "Pitchivo admins can read all user profiles"
  ON user_profiles
  FOR SELECT
  USING (is_pitchivo_admin());

-- Grant admins ability to update user profiles
CREATE POLICY "Pitchivo admins can update user profiles"
  ON user_profiles
  FOR UPDATE
  USING (is_pitchivo_admin());

