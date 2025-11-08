-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- EMAIL DOMAIN POLICY
-- ============================================================================
-- Table to store email domain policies (blocked, whitelisted, or allowed)
CREATE TABLE IF NOT EXISTS email_domain_policy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'blocked' CHECK (status IN ('blocked', 'whitelisted', 'allowed')),
  reason TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default blocked domains
INSERT INTO email_domain_policy (domain, status, reason) VALUES
  ('gmail.com', 'blocked', 'Public email domain'),
  ('yahoo.com', 'blocked', 'Public email domain'),
  ('outlook.com', 'blocked', 'Public email domain'),
  ('hotmail.com', 'blocked', 'Public email domain'),
  ('icloud.com', 'blocked', 'Public email domain'),
  ('aol.com', 'blocked', 'Public email domain'),
  ('mail.com', 'blocked', 'Public email domain'),
  ('protonmail.com', 'blocked', 'Public email domain'),
  ('yandex.com', 'blocked', 'Public email domain'),
  ('zoho.com', 'blocked', 'Public email domain')
ON CONFLICT (domain) DO NOTHING;

-- Index for status lookups
CREATE INDEX IF NOT EXISTS idx_email_domain_policy_status ON email_domain_policy(status);
CREATE INDEX IF NOT EXISTS idx_email_domain_policy_domain ON email_domain_policy(domain);

-- ============================================================================
-- WAITLIST
-- ============================================================================
-- Table for managing waitlist entries
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invited')),
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  invitation_email_sent_at TIMESTAMPTZ, -- When invitation email was sent
  email_sent_at TIMESTAMPTZ, -- When any email was sent to this waitlist entry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
-- Table for domain-based organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE, -- e.g., 'abcingredients.com'
  name TEXT NOT NULL, -- Company name
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
  logo_url TEXT,
  onboarding_completed_at TIMESTAMPTZ, -- When org onboarding was completed
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for domain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- ============================================================================
-- USER PROFILES
-- ============================================================================
-- Extended user profile information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_pitchivo_admin BOOLEAN NOT NULL DEFAULT FALSE, -- Pitchivo website super admin (not org admin)
  org_role TEXT CHECK (org_role IN ('marketing', 'sales', 'user')), -- User role within organization
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  domain TEXT NOT NULL, -- Extracted from email for quick lookups
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_domain ON user_profiles(domain);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_pitchivo_admin ON user_profiles(is_pitchivo_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_role ON user_profiles(org_role);


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to extract domain from email
CREATE OR REPLACE FUNCTION extract_email_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if email domain is blocked
CREATE OR REPLACE FUNCTION is_email_domain_blocked(email TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_domain_policy
    WHERE domain = extract_email_domain(email)
    AND status = 'blocked'
  );
END;
$$;

-- Function to check if email domain is whitelisted
CREATE OR REPLACE FUNCTION is_email_domain_whitelisted(email TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_domain_policy
    WHERE domain = extract_email_domain(email)
    AND status = 'whitelisted'
  );
END;
$$;

-- Function to get or create organization by domain
CREATE OR REPLACE FUNCTION get_or_create_organization(email TEXT, company_name TEXT DEFAULT NULL)
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
    
    INSERT INTO organizations (domain, name, slug)
    VALUES (org_domain, COALESCE(company_name, org_domain), org_slug)
    RETURNING id INTO org_id;
  END IF;
  
  RETURN org_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_domain_policy_updated_at
  BEFORE UPDATE ON email_domain_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
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
  INSERT INTO user_profiles (id, email, domain, organization_id, full_name, is_pitchivo_admin, org_role)
  VALUES (
    NEW.id,
    NEW.email,
    user_domain,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_pitchivo_admin')::boolean, false),
    COALESCE(NEW.raw_user_meta_data->>'org_role', 'user')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to check if user domain is whitelisted
CREATE OR REPLACE FUNCTION is_user_whitelisted(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_email_domain_whitelisted(email);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to whitelist a domain and update waitlist status
CREATE OR REPLACE FUNCTION whitelist_domain(
  p_domain TEXT,
  p_waitlist_id UUID DEFAULT NULL,
  p_invited_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  policy_id UUID;
BEGIN
  -- Add or update domain policy to whitelisted
  INSERT INTO email_domain_policy (domain, status, reason, invited_by, invited_at)
  VALUES (p_domain, 'whitelisted', p_reason, COALESCE(p_invited_by, auth.uid()), NOW())
  ON CONFLICT (domain) DO UPDATE SET
    status = 'whitelisted',
    reason = COALESCE(EXCLUDED.reason, email_domain_policy.reason),
    invited_by = COALESCE(EXCLUDED.invited_by, email_domain_policy.invited_by),
    invited_at = COALESCE(EXCLUDED.invited_at, email_domain_policy.invited_at),
    updated_at = NOW()
  RETURNING id INTO policy_id;
  
  -- Update waitlist status if waitlist_id provided
  IF p_waitlist_id IS NOT NULL THEN
    UPDATE waitlist
    SET
      status = 'invited',
      invited_at = NOW(),
      invited_by = COALESCE(p_invited_by, auth.uid()),
      invitation_email_sent_at = NOW()
    WHERE id = p_waitlist_id;
  END IF;
  
  RETURN policy_id;
END;
$$;

