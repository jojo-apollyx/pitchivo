-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for user profile with organization details
CREATE OR REPLACE VIEW user_profile_with_org AS
SELECT
  up.id,
  up.email,
  up.full_name,
  up.avatar_url,
  up.is_pitchivo_admin,
  up.org_role,
  up.domain,
  up.metadata,
  up.created_at,
  up.updated_at,
  o.id AS organization_id,
  o.name AS organization_name,
  o.slug AS organization_slug,
  o.logo_url AS organization_logo_url,
  o.onboarding_completed_at AS organization_onboarding_completed_at,
  o.settings AS organization_settings
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id;

-- View for organization members
CREATE OR REPLACE VIEW organization_members AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.domain AS organization_domain,
  o.onboarding_completed_at AS organization_onboarding_completed_at,
  up.id AS user_id,
  up.email,
  up.full_name,
  up.avatar_url,
  up.is_pitchivo_admin,
  up.org_role AS user_role,
  up.created_at AS member_since
FROM organizations o
INNER JOIN user_profiles up ON up.organization_id = o.id;

-- View for waitlist with approval status
CREATE OR REPLACE VIEW waitlist_status AS
SELECT
  w.id,
  w.email,
  w.full_name,
  w.company,
  w.role,
  w.note,
  w.status,
  w.invited_at,
  w.invitation_email_sent_at,
  w.email_sent_at,
  w.created_at,
  extract_email_domain(w.email) AS domain,
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = w.email) THEN true
    ELSE false
  END AS has_account,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM email_domain_policy
      WHERE domain = extract_email_domain(w.email)
      AND status = 'whitelisted'
    ) THEN true
    ELSE false
  END AS is_whitelisted,
  edp.id AS domain_policy_id,
  edp.invited_by AS domain_invited_by,
  edp.invited_at AS domain_invited_at
FROM waitlist w
LEFT JOIN email_domain_policy edp ON edp.domain = extract_email_domain(w.email) AND edp.status = 'whitelisted';

-- ============================================================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can login (whitelisted and not blocked domain)
CREATE OR REPLACE FUNCTION can_user_login(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if domain is blocked
  IF is_email_domain_blocked(email) THEN
    RETURN false;
  END IF;
  
  -- Check if user is whitelisted
  IF NOT is_user_whitelisted(email) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to mark organization onboarding as complete
CREATE OR REPLACE FUNCTION complete_organization_onboarding(
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET onboarding_completed_at = NOW()
  WHERE id = p_organization_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization members count
CREATE OR REPLACE FUNCTION get_organization_member_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_profiles
    WHERE organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to send invitation email and whitelist domain
-- This function should be called when sending invitation email
CREATE OR REPLACE FUNCTION send_invitation_email(
  p_waitlist_id UUID,
  p_invited_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  waitlist_email TEXT;
  waitlist_domain TEXT;
  policy_id UUID;
BEGIN
  -- Get email from waitlist
  SELECT email INTO waitlist_email
  FROM waitlist
  WHERE id = p_waitlist_id;
  
  IF waitlist_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extract domain from email
  waitlist_domain := extract_email_domain(waitlist_email);
  
  -- Whitelist domain and update waitlist status
  SELECT whitelist_domain(
    waitlist_domain,
    p_waitlist_id,
    p_invited_by,
    'Invited from waitlist'
  ) INTO policy_id;
  
  -- Update email_sent_at timestamp
  UPDATE waitlist
  SET email_sent_at = NOW()
  WHERE id = p_waitlist_id;
  
  RETURN policy_id;
END;
$$ LANGUAGE plpgsql;

