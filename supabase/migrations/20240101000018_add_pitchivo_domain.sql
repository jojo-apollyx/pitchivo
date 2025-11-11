-- ============================================================================
-- ADD PITCHIVO DOMAIN COLUMN TO ORGANIZATIONS
-- ============================================================================
-- This migration adds a pitchivo_domain column to store the unique subdomain
-- (e.g., xxx.pitchivo.com) for each organization

-- Add pitchivo_domain column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS pitchivo_domain TEXT UNIQUE;

-- Create index for pitchivo_domain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_pitchivo_domain ON organizations(pitchivo_domain);

-- Function to generate a unique pitchivo domain from slug
CREATE OR REPLACE FUNCTION generate_pitchivo_domain(p_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_domain TEXT;
  final_domain TEXT;
  counter INTEGER := 0;
BEGIN
  -- Use slug as base, ensure it's valid for subdomain
  base_domain := LOWER(REGEXP_REPLACE(p_slug, '[^a-z0-9-]', '', 'g'));
  
  -- Remove leading/trailing hyphens and ensure it's not empty
  base_domain := TRIM(BOTH '-' FROM base_domain);
  
  -- If empty after cleaning, use a default
  IF base_domain = '' OR base_domain IS NULL THEN
    base_domain := 'org';
  END IF;
  
  -- Ensure it starts with a letter or number
  IF NOT (base_domain ~ '^[a-z0-9]') THEN
    base_domain := 'org-' || base_domain;
  END IF;
  
  -- Try base domain first
  final_domain := base_domain || '.pitchivo.com';
  
  -- If exists, append counter until unique
  WHILE EXISTS (SELECT 1 FROM organizations WHERE pitchivo_domain = final_domain) LOOP
    counter := counter + 1;
    final_domain := base_domain || '-' || counter::TEXT || '.pitchivo.com';
  END LOOP;
  
  RETURN final_domain;
END;
$$;

-- Update update_user_organization function to generate pitchivo_domain on first completion
DROP FUNCTION IF EXISTS update_user_organization;

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
DECLARE
  org_slug TEXT;
  existing_pitchivo_domain TEXT;
  was_completed BOOLEAN;
BEGIN
  -- Verify that the user belongs to this organization
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to this organization';
  END IF;

  -- Get current onboarding status and pitchivo_domain
  SELECT onboarding_completed_at IS NOT NULL, pitchivo_domain, slug
  INTO was_completed, existing_pitchivo_domain, org_slug
  FROM organizations
  WHERE id = p_org_id;

  -- Generate pitchivo_domain if onboarding is being completed for the first time
  -- and pitchivo_domain doesn't exist yet
  IF p_onboarding_completed_at IS NOT NULL 
     AND NOT was_completed 
     AND (existing_pitchivo_domain IS NULL OR existing_pitchivo_domain = '') THEN
    existing_pitchivo_domain := generate_pitchivo_domain(org_slug);
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
    pitchivo_domain = COALESCE(existing_pitchivo_domain, organizations.pitchivo_domain),
    updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION update_user_organization IS 'Update organization details including color scheme. Generates pitchivo_domain on first onboarding completion. User must belong to the organization.';
COMMENT ON FUNCTION generate_pitchivo_domain IS 'Generate a unique pitchivo.com subdomain from an organization slug';

-- Backfill existing organizations with pitchivo_domain
-- This ensures all existing organizations have a domain assigned
-- Process one at a time to ensure uniqueness
DO $$
DECLARE
  org_record RECORD;
  new_domain TEXT;
BEGIN
  FOR org_record IN 
    SELECT id, slug 
    FROM organizations 
    WHERE pitchivo_domain IS NULL OR pitchivo_domain = ''
    ORDER BY created_at
  LOOP
    -- Generate domain for this organization
    new_domain := generate_pitchivo_domain(org_record.slug);
    
    -- Update the organization
    UPDATE organizations
    SET pitchivo_domain = new_domain
    WHERE id = org_record.id;
  END LOOP;
END $$;

