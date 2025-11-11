-- ============================================================================
-- FIX SLUG GENERATION TO EXCLUDE DOMAIN EXTENSION
-- ============================================================================
-- This migration updates slug generation to extract just the base domain name
-- (e.g., "sweet.com" -> "sweet" instead of "sweet-com")

-- Helper function to extract base domain name (without extension)
CREATE OR REPLACE FUNCTION extract_base_domain_name(domain_or_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base_name TEXT;
BEGIN
  -- If it looks like a domain (contains a dot), extract just the name part
  IF domain_or_name LIKE '%.%' THEN
    -- Extract the part before the first dot
    base_name := SPLIT_PART(domain_or_name, '.', 1);
  ELSE
    -- It's already a name, use it as is
    base_name := domain_or_name;
  END IF;
  
  -- Convert to lowercase and replace non-alphanumeric with hyphens
  base_name := LOWER(REGEXP_REPLACE(base_name, '[^a-z0-9]+', '-', 'g'));
  
  -- Remove leading/trailing hyphens
  base_name := TRIM(BOTH '-' FROM base_name);
  
  -- If empty, return a default
  IF base_name = '' OR base_name IS NULL THEN
    base_name := 'org';
  END IF;
  
  RETURN base_name;
END;
$$;

-- Helper function to generate a clean slug from company name or domain
CREATE OR REPLACE FUNCTION generate_org_slug(company_name TEXT DEFAULT NULL, org_domain TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Prefer company name, fallback to base domain name
  IF company_name IS NOT NULL AND company_name != '' THEN
    base_slug := extract_base_domain_name(company_name);
  ELSIF org_domain IS NOT NULL AND org_domain != '' THEN
    base_slug := extract_base_domain_name(org_domain);
  ELSE
    base_slug := 'org';
  END IF;
  
  -- Start with base slug
  final_slug := base_slug;
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Update get_or_create_organization function to use new slug generation
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

-- Update generate_pitchivo_domain to work with cleaner slugs
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
  -- Slug should already be clean, but sanitize just in case
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

COMMENT ON FUNCTION extract_base_domain_name IS 'Extract base domain name without extension (e.g., "sweet.com" -> "sweet")';
COMMENT ON FUNCTION generate_org_slug IS 'Generate a clean, unique organization slug from company name or domain';
COMMENT ON FUNCTION generate_pitchivo_domain IS 'Generate a unique pitchivo.com subdomain from an organization slug';

