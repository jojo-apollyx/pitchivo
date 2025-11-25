-- Create compatibility views for the hero-email-form component

-- View: email_domains - maps to email_domain_policy with status translation
-- The code expects status values: 'public', 'blocked', 'allowed'
-- The table has values: 'blocked', 'whitelisted', 'allowed'
CREATE OR REPLACE VIEW email_domains AS
SELECT 
  id,
  domain,
  CASE 
    WHEN status = 'blocked' AND reason = 'Public email domain' THEN 'public'
    WHEN status = 'blocked' THEN 'blocked'
    WHEN status = 'whitelisted' THEN 'allowed'
    ELSE status
  END as status,
  reason,
  created_at,
  updated_at
FROM email_domain_policy;

-- View: invited_emails - users whose domains are whitelisted or who are on the approved waitlist
CREATE OR REPLACE VIEW invited_emails AS
SELECT DISTINCT 
  w.email,
  w.full_name,
  w.company,
  w.created_at
FROM waitlist w
WHERE w.status = 'invited'
UNION
SELECT DISTINCT
  up.email,
  up.full_name,
  '' as company,
  up.created_at
FROM user_profiles up
INNER JOIN email_domain_policy edp ON edp.domain = up.domain
WHERE edp.status = 'whitelisted';

-- Grant access to authenticated and anon users (needed for the public hero form)
GRANT SELECT ON email_domains TO anon, authenticated;
GRANT SELECT ON invited_emails TO anon, authenticated;

-- Add comments
COMMENT ON VIEW email_domains IS 'Compatibility view mapping email_domain_policy to expected frontend format';
COMMENT ON VIEW invited_emails IS 'View of emails that are allowed to sign up (invited from waitlist or whitelisted domain)';

