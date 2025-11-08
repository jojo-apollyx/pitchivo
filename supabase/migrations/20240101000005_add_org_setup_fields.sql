-- ============================================================================
-- ADD ORGANIZATION SETUP FIELDS
-- ============================================================================
-- This migration adds fields needed for the organization setup form

-- Add missing fields to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (company_size IN ('1-5', '6-20', '21-100', '100+')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS use_cases TEXT[] DEFAULT '{}'::TEXT[];

-- Add index for industry filtering
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);

-- Add index for company_size filtering
CREATE INDEX IF NOT EXISTS idx_organizations_company_size ON organizations(company_size);

-- Update get_or_create_organization function to accept more parameters
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
      industry,
      company_size,
      description,
      use_cases
    )
    RETURNING id INTO org_id;
  ELSE
    -- Update existing organization with new information if provided
    UPDATE organizations
    SET
      name = COALESCE(company_name, organizations.name),
      industry = COALESCE(industry, organizations.industry),
      company_size = COALESCE(company_size, organizations.company_size),
      description = COALESCE(description, organizations.description),
      use_cases = COALESCE(use_cases, organizations.use_cases),
      updated_at = NOW()
    WHERE id = org_id;
  END IF;
  
  RETURN org_id;
END;
$$;

-- Function to complete organization onboarding
CREATE OR REPLACE FUNCTION complete_organization_setup(
  p_org_id UUID,
  p_industry TEXT DEFAULT NULL,
  p_company_size TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_use_cases TEXT[] DEFAULT '{}'::TEXT[],
  p_logo_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE organizations
  SET
    industry = COALESCE(p_industry, industry),
    company_size = COALESCE(p_company_size, company_size),
    description = COALESCE(p_description, description),
    use_cases = COALESCE(p_use_cases, use_cases),
    logo_url = COALESCE(p_logo_url, logo_url),
    onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
    updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN FOUND;
END;
$$;

