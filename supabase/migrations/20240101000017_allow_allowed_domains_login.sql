-- ============================================================================
-- ALLOW DOMAINS WITH STATUS 'allowed' TO LOGIN
-- ============================================================================
-- Update can_user_login function to allow domains with status 'allowed'
-- in addition to 'whitelisted' domains

CREATE OR REPLACE FUNCTION can_user_login(email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  domain_status TEXT;
BEGIN
  -- Check if domain is blocked
  IF is_email_domain_blocked(email) THEN
    RETURN false;
  END IF;
  
  -- Check domain status in email_domain_policy
  SELECT status INTO domain_status
  FROM email_domain_policy
  WHERE domain = extract_email_domain(email)
  LIMIT 1;
  
  -- Allow login if domain is whitelisted OR allowed
  IF domain_status IN ('whitelisted', 'allowed') THEN
    RETURN true;
  END IF;
  
  -- If no policy entry exists, require whitelisting (backward compatibility)
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

