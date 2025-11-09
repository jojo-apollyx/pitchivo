-- ============================================================================
-- ADD COLOR PARAMETERS TO update_user_organization FUNCTION
-- ============================================================================
-- This migration updates the function to accept color scheme parameters

-- Drop existing function
DROP FUNCTION IF EXISTS update_user_organization;

-- Recreate with color parameters
CREATE OR REPLACE FUNCTION update_user_organization(
  p_org_id UUID,
  p_name TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_company_size TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_use_cases TEXT[] DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_onboarding_completed_at TIMESTAMPTZ DEFAULT NULL,
  p_primary_color TEXT DEFAULT NULL,
  p_secondary_color TEXT DEFAULT NULL,
  p_accent_color TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the user belongs to this organization
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to this organization';
  END IF;

  -- Update the organization
  UPDATE organizations
  SET
    name = COALESCE(p_name, organizations.name),
    industry = COALESCE(p_industry, organizations.industry),
    company_size = COALESCE(p_company_size, organizations.company_size),
    description = COALESCE(p_description, organizations.description),
    use_cases = COALESCE(p_use_cases, organizations.use_cases),
    logo_url = COALESCE(p_logo_url, organizations.logo_url),
    onboarding_completed_at = COALESCE(p_onboarding_completed_at, organizations.onboarding_completed_at),
    primary_color = COALESCE(p_primary_color, organizations.primary_color),
    secondary_color = COALESCE(p_secondary_color, organizations.secondary_color),
    accent_color = COALESCE(p_accent_color, organizations.accent_color),
    updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION update_user_organization IS 'Update organization details including color scheme. User must belong to the organization.';

