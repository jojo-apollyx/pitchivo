-- ============================================================================
-- ALLOW USERS TO UPDATE THEIR OWN ORGANIZATION
-- ============================================================================
-- This migration adds SECURITY DEFINER functions that allow users to create
-- and update their own organization, bypassing RLS restrictions

-- Update get_or_create_organization to use SECURITY DEFINER
-- This allows users to create organizations for their domain
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
  v_industry := industry;
  v_company_size := company_size;
  v_description := description;
  v_use_cases := use_cases;
  
  -- Try to find existing organization
  SELECT id INTO org_id FROM organizations WHERE domain = org_domain;
  
  IF org_id IS NULL THEN
    -- Create new organization
    org_slug := LOWER(REGEXP_REPLACE(COALESCE(v_company_name, org_domain), '[^a-z0-9]+', '-', 'g'));
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
      org_slug := org_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
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
    -- Use table alias to avoid ambiguous column references
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

-- Function to allow users to update their own organization
CREATE OR REPLACE FUNCTION update_user_organization(
  p_org_id UUID,
  p_name TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_company_size TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_use_cases TEXT[] DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_onboarding_completed_at TIMESTAMPTZ DEFAULT NULL
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
    updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN FOUND;
END;
$$;

