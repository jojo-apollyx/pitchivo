-- ============================================================================
-- SEED leads_sources TABLE
-- ============================================================================
-- Create initial source entries for data tracking

-- Insert MongoDB Migration source (if it doesn't exist)
INSERT INTO leads_sources (name, description, trust_score, is_active)
VALUES (
  'MongoDB Migration',
  'Data migrated from legacy MongoDB database',
  0.8, -- High trust score for migrated data
  true
)
ON CONFLICT (name) DO NOTHING;

-- Insert other common sources (optional, can be added later)
INSERT INTO leads_sources (name, description, trust_score, is_active)
VALUES 
  ('Website Marketplace', 'Data from website marketplace interactions', 0.7, true),
  ('Email Campaign', 'Data from email campaign responses', 0.6, true),
  ('Manual Entry', 'Data entered manually by users', 0.9, true),
  ('API Integration', 'Data from external API integrations', 0.7, true),
  ('Web Scraping', 'Data from web scraping', 0.5, true)
ON CONFLICT (name) DO NOTHING;

