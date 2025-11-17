-- ============================================================================
-- SEED DATA
-- ============================================================================
-- This file seeds the database with initial data for blocked/whitelisted email domains

-- Insert blocked public email domains
INSERT INTO email_domain_policy (domain, status, reason) VALUES
  ('gmail.com', 'blocked', 'Public email domain'),
  ('yahoo.com', 'blocked', 'Public email domain'),
  ('outlook.com', 'blocked', 'Public email domain'),
  ('hotmail.com', 'blocked', 'Public email domain'),
  ('icloud.com', 'blocked', 'Public email domain'),
  ('aol.com', 'blocked', 'Public email domain'),
  ('protonmail.com', 'blocked', 'Public email domain'),
  ('mail.com', 'blocked', 'Public email domain'),
  ('yandex.com', 'blocked', 'Public email domain'),
  ('zoho.com', 'blocked', 'Public email domain'),
  ('qq.com', 'blocked', 'Public email domain'),
  ('163.com', 'blocked', 'Public email domain'),
  ('126.com', 'blocked', 'Public email domain'),
  ('sina.com', 'blocked', 'Public email domain'),
  ('live.com', 'blocked', 'Public email domain'),
  ('msn.com', 'blocked', 'Public email domain')
ON CONFLICT (domain) DO NOTHING;

-- Whitelist Pitchivo company domain
INSERT INTO email_domain_policy (domain, status, reason) VALUES
  ('pitchivo.com', 'whitelisted', 'Pitchivo company domain')
ON CONFLICT (domain) DO NOTHING;

-- ============================================================================
-- DEFAULT EMAIL TEMPLATES
-- ============================================================================
-- Note: Default "reach out" email templates are automatically created for new campaigns
-- via the trigger_create_default_email_template() function (see migration 20240101000056).
-- 
-- To create a default template for an existing campaign, you can call:
-- SELECT create_default_email_template('campaign_id_here');
--
-- The default template includes:
-- - Name: "Default Reach Out"
-- - Subject: "Introducing {{product_name}} - Premium Solution for Your Business"
-- - Content: Professional reach-out email with placeholders for personalization
-- - is_default: true

