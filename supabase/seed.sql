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
-- INDUSTRIES
-- ============================================================================
-- Insert supported industries for organization setup
INSERT INTO industries (industry_code, industry_name, description, is_enabled) VALUES
  ('supplements_food_ingredients', 'Nutritional Supplements / Food Ingredients', 'Companies producing nutritional supplements, food ingredients, and related products', TRUE),
  ('chemicals_raw_materials', 'Chemicals & Raw Materials', 'Companies producing chemicals, raw materials, and industrial compounds', TRUE),
  ('pharmaceuticals', 'Pharmaceuticals', 'Companies in the pharmaceutical industry producing medicines and healthcare products', TRUE),
  ('cosmetics_personal_care', 'Cosmetics & Personal Care', 'Companies producing cosmetics, personal care products, and beauty items', TRUE),
  ('other', 'Other', 'Other industries not specifically categorized', TRUE)
ON CONFLICT (industry_code) DO NOTHING;

