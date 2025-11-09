-- ============================================================================
-- ADD is_public_domain COLUMN TO email_domain_policy
-- ============================================================================

-- Add is_public_domain column to indicate if domain is a public email provider
ALTER TABLE email_domain_policy
ADD COLUMN IF NOT EXISTS is_public_domain BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_domain_policy_is_public_domain 
ON email_domain_policy(is_public_domain) 
WHERE is_public_domain = true;

-- Update existing public email domains to mark them as public
UPDATE email_domain_policy
SET is_public_domain = true
WHERE domain IN (
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'yandex.com',
  'zoho.com'
)
AND status = 'blocked';

-- If any of the public domains don't exist yet, insert them
INSERT INTO email_domain_policy (domain, status, reason, is_public_domain)
VALUES
  ('gmail.com', 'blocked', 'Public email domain', true),
  ('yahoo.com', 'blocked', 'Public email domain', true),
  ('outlook.com', 'blocked', 'Public email domain', true),
  ('hotmail.com', 'blocked', 'Public email domain', true),
  ('icloud.com', 'blocked', 'Public email domain', true),
  ('aol.com', 'blocked', 'Public email domain', true),
  ('mail.com', 'blocked', 'Public email domain', true),
  ('protonmail.com', 'blocked', 'Public email domain', true),
  ('yandex.com', 'blocked', 'Public email domain', true),
  ('zoho.com', 'blocked', 'Public email domain', true)
ON CONFLICT (domain) DO UPDATE 
SET is_public_domain = true;

