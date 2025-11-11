-- ============================================================================
-- FIX NEW USER ORG_ROLE DEFAULT
-- ============================================================================
-- This migration updates handle_new_user to not set a default org_role
-- New users should have NULL org_role until they complete the setup form

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_domain TEXT;
  org_id UUID;
BEGIN
  user_domain := extract_email_domain(NEW.email);
  
  -- Get or create organization for this domain
  org_id := get_or_create_organization(NEW.email);
  
  -- Create user profile
  -- org_role is set to NULL by default - user must complete setup form to set their role
  INSERT INTO user_profiles (id, email, domain, organization_id, full_name, is_pitchivo_admin, org_role)
  VALUES (
    NEW.id,
    NEW.email,
    user_domain,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_pitchivo_admin')::boolean, false),
    NEW.raw_user_meta_data->>'org_role' -- Only set if explicitly provided, otherwise NULL
  );
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 'Create user profile on signup. org_role is NULL by default until user completes setup form.';

