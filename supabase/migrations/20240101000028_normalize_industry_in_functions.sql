-- ============================================================================
-- NORMALIZE INDUSTRY VALUES IN DATABASE FUNCTIONS
-- ============================================================================
-- This migration adds industry normalization to convert old industry names
-- to new industry codes automatically in database functions

-- Helper function to normalize industry values (old names -> new codes)
CREATE OR REPLACE FUNCTION normalize_industry_code(industry_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If NULL, return NULL
  IF industry_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- If the value is already a valid industry code, return it as-is
  IF EXISTS (SELECT 1 FROM industries WHERE industry_code = industry_value) THEN
    RETURN industry_value;
  END IF;
  
  -- Convert old industry names to new codes
  RETURN CASE
    WHEN industry_value = 'Food & Supplement Ingredients' THEN 'supplements_food_ingredients'
    WHEN industry_value = 'Chemicals & Raw Materials' THEN 'chemicals_raw_materials'
    WHEN industry_value = 'Pharmaceuticals' THEN 'pharmaceuticals'
    WHEN industry_value = 'Cosmetics & Personal Care' THEN 'cosmetics_personal_care'
    WHEN industry_value = 'Other' THEN 'other'
    ELSE NULL  -- Return NULL if no match (will be caught by FK constraint)
  END;
END;
$$;

COMMENT ON FUNCTION normalize_industry_code IS 'Converts old industry names to new industry codes, or returns the code if already valid. Returns NULL if no match.';

-- Update get_or_create_organization to normalize industry values
CREATE OR REPLACE FUNCTION get_or_create_organization(
  email TEXT, 
  company_name TEXT DEFAULT NULL,
  industry TEXT DEFAULT NULL,
  company_size TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  use_cases TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_domain TEXT;
  org_id UUID;
  org_slug TEXT;
  user_id UUID;
  v_company_name TEXT;
  v_industry TEXT;
  v_company_size TEXT;
  v_description TEXT;
  v_use_cases TEXT[];
BEGIN
  user_id := auth.uid();
  org_domain := extract_email_domain(email);
  
  -- Store parameters in local variables to avoid ambiguity
  v_company_name := company_name;
  v_industry := normalize_industry_code(industry);  -- Normalize industry value
  v_company_size := company_size;
  v_description := description;
  v_use_cases := use_cases;
  
  -- Try to find existing organization
  SELECT id INTO org_id FROM organizations WHERE domain = org_domain;
  
  IF org_id IS NULL THEN
    -- Create new organization with clean slug
    org_slug := generate_org_slug(v_company_name, org_domain);
    
    INSERT INTO organizations (domain, name, slug, industry, company_size, description, use_cases)
    VALUES (
      org_domain, 
      COALESCE(v_company_name, org_domain), 
      org_slug,
      v_industry,
      v_company_size,
      v_description,
      v_use_cases
    )
    RETURNING id INTO org_id;
    
    -- Update user's organization_id if user is authenticated
    IF user_id IS NOT NULL THEN
      UPDATE user_profiles
      SET organization_id = org_id
      WHERE id = user_id;
    END IF;
  ELSE
    -- Update existing organization with new information if provided
    UPDATE organizations AS o
    SET
      name = COALESCE(v_company_name, o.name),
      industry = COALESCE(v_industry, o.industry),
      company_size = COALESCE(v_company_size, o.company_size),
      description = COALESCE(v_description, o.description),
      use_cases = COALESCE(v_use_cases, o.use_cases),
      updated_at = NOW()
    WHERE o.id = org_id;
    
    -- Update user's organization_id if user is authenticated
    IF user_id IS NOT NULL THEN
      UPDATE user_profiles
      SET organization_id = org_id
      WHERE id = user_id;
    END IF;
  END IF;
  
  RETURN org_id;
END;
$$;

-- Update update_user_organization to normalize industry values
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
  v_industry TEXT;
BEGIN
  -- Verify that the user belongs to this organization
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to this organization';
  END IF;

  -- Normalize industry value
  v_industry := normalize_industry_code(p_industry);

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
    industry = COALESCE(v_industry, organizations.industry),  -- Use normalized value
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

