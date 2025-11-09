-- ============================================================================
-- ADD ADMIN POLICIES FOR WAITLIST
-- ============================================================================
-- Allow Pitchivo admins to read all waitlist entries
CREATE POLICY "Pitchivo admins can read all waitlist entries"
  ON waitlist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- Allow Pitchivo admins to update waitlist entries
CREATE POLICY "Pitchivo admins can update waitlist entries"
  ON waitlist
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- ============================================================================
-- ADD ADMIN POLICIES FOR ORGANIZATIONS
-- ============================================================================
-- Allow Pitchivo admins to read all organizations
CREATE POLICY "Pitchivo admins can read all organizations"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- Allow Pitchivo admins to update organizations
CREATE POLICY "Pitchivo admins can update organizations"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- ============================================================================
-- ADD ADMIN POLICIES FOR USER PROFILES
-- ============================================================================
-- Allow Pitchivo admins to read all user profiles
CREATE POLICY "Pitchivo admins can read all user profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

