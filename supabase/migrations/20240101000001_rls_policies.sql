-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE email_domain_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EMAIL DOMAIN POLICY POLICIES
-- ============================================================================
-- Everyone can read domain policies (needed for validation)
CREATE POLICY "Anyone can read email domain policies"
  ON email_domain_policy
  FOR SELECT
  USING (true);

-- Only service role and Pitchivo admins can modify domain policies
CREATE POLICY "Service role can manage email domain policies"
  ON email_domain_policy
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Pitchivo admins can manage email domain policies
CREATE POLICY "Pitchivo admins can manage email domain policies"
  ON email_domain_policy
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- ============================================================================
-- WAITLIST POLICIES
-- ============================================================================
-- Anyone can insert into waitlist (public signup)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Users can read their own waitlist entry
CREATE POLICY "Users can read own waitlist entry"
  ON waitlist
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only service role can update waitlist (admin approval)
CREATE POLICY "Service role can update waitlist"
  ON waitlist
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Only service role can read all waitlist entries
CREATE POLICY "Service role can read all waitlist entries"
  ON waitlist
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================
-- Users can read their own organization
CREATE POLICY "Users can read own organization"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Users in the same organization can read the organization
CREATE POLICY "Organization members can read organization"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM user_profiles
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Only service role can create/update organizations
CREATE POLICY "Service role can manage organizations"
  ON organizations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users in the same organization can read each other's profiles
CREATE POLICY "Organization members can read each other's profiles"
  ON user_profiles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Only service role can create/delete profiles
CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');


