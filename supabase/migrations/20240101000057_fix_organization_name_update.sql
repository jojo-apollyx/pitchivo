-- ============================================================================
-- FIX ORGANIZATION NAME UPDATE
-- ============================================================================
-- Fix get_or_create_organization to properly update company name when provided
-- even if organization already exists with domain name

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
    -- IMPORTANT: If company_name is provided and not empty, always update the name
    -- This fixes the issue where organizations created with domain name can't be updated
    UPDATE organizations AS o
    SET
      name = CASE 
        WHEN v_company_name IS NOT NULL AND TRIM(v_company_name) != '' THEN v_company_name
        ELSE o.name
      END,
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

COMMENT ON FUNCTION get_or_create_organization IS 'Get or create organization. Now properly updates company name when provided, even if organization already exists with domain name.';

