-- ============================================================================
-- FIX AMBIGUOUS COLUMN REFERENCE IN get_or_create_organization
-- ============================================================================
-- This migration fixes the ambiguous column reference error in the
-- get_or_create_organization function by using local variables to avoid
-- conflicts between function parameters and table column names.

-- Fix get_or_create_organization function to use local variables
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
SET search_path = public
AS $$
DECLARE
  org_domain TEXT;
  org_id UUID;
  org_slug TEXT;
  v_industry TEXT := industry;
  v_company_size TEXT := company_size;
  v_description TEXT := description;
  v_use_cases TEXT[] := use_cases;
BEGIN
  org_domain := extract_email_domain(email);
  
  -- Try to find existing organization
  SELECT id INTO org_id FROM organizations WHERE domain = org_domain;
  
  IF org_id IS NULL THEN
    -- Create new organization
    org_slug := LOWER(REGEXP_REPLACE(COALESCE(company_name, org_domain), '[^a-z0-9]+', '-', 'g'));
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
      org_slug := org_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
    INSERT INTO organizations (domain, name, slug, industry, company_size, description, use_cases)
    VALUES (
      org_domain, 
      COALESCE(company_name, org_domain), 
      org_slug,
      v_industry,
      v_company_size,
      v_description,
      v_use_cases
    )
    RETURNING id INTO org_id;
  ELSE
    -- Update existing organization with new information if provided
    UPDATE organizations o
    SET
      name = COALESCE(company_name, o.name),
      industry = COALESCE(v_industry, o.industry),
      company_size = COALESCE(v_company_size, o.company_size),
      description = COALESCE(v_description, o.description),
      use_cases = COALESCE(v_use_cases, o.use_cases),
      updated_at = NOW()
    WHERE o.id = org_id;
  END IF;
  
  RETURN org_id;
END;
$$;

