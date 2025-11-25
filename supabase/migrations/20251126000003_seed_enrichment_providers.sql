-- ============================================================================
-- SEED ENRICHMENT PROVIDERS
-- ============================================================================
-- Initial data for enrichment providers and their API keys
-- Note: API keys should be added via environment variables or admin interface

-- Insert enrichment providers
INSERT INTO leads_enrichment_providers (name, display_name, description, base_url, documentation_url, is_active) VALUES
    ('hunter_io', 'Hunter.io', 'Email finder and verifier', 'https://api.hunter.io/v2', 'https://hunter.io/api-documentation', true),
    ('clearbit', 'Clearbit', 'Company and contact enrichment', 'https://person.clearbit.com', 'https://clearbit.com/docs', true),
    ('neverbounce', 'NeverBounce', 'Email validation service', 'https://api.neverbounce.com/v4', 'https://developers.neverbounce.com', true),
    ('openai', 'OpenAI', 'AI-powered data normalization and enrichment', 'https://api.openai.com/v1', 'https://platform.openai.com/docs', true)
ON CONFLICT (name) DO NOTHING;

-- Insert enrichment steps for organizations
-- Step 1: Validate domain (Hunter.io)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'validate_domain',
    1,
    'organization',
    true,
    false,
    'Validate organization domain using Hunter.io',
    '{"endpoint": "/domain-search"}'
FROM leads_enrichment_providers
WHERE name = 'hunter_io'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Step 2: Basic enrichment (Hunter.io)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'enrich_company_basic',
    2,
    'organization',
    true,
    false,
    'Basic company enrichment using Hunter.io',
    '{"endpoint": "/domain-search"}'
FROM leads_enrichment_providers
WHERE name = 'hunter_io'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Step 3: Detailed enrichment (Clearbit)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'enrich_company_detailed',
    3,
    'organization',
    true,
    false,
    'Detailed company enrichment using Clearbit',
    '{"endpoint": "/v2/companies/find"}'
FROM leads_enrichment_providers
WHERE name = 'clearbit'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Insert enrichment steps for contacts
-- Step 1: Validate email (NeverBounce)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'validate_email',
    1,
    'contact',
    true,
    false,
    'Validate email address using NeverBounce',
    '{"endpoint": "/single/check"}'
FROM leads_enrichment_providers
WHERE name = 'neverbounce'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Step 2: Basic contact data (Hunter.io)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'enrich_contact_basic',
    2,
    'contact',
    true,
    false,
    'Basic contact enrichment using Hunter.io',
    '{"endpoint": "/email-finder"}'
FROM leads_enrichment_providers
WHERE name = 'hunter_io'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Step 3: Detailed contact data (Clearbit)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'enrich_contact_detailed',
    3,
    'contact',
    true,
    false,
    'Detailed contact enrichment using Clearbit',
    '{"endpoint": "/v2/people/find"}'
FROM leads_enrichment_providers
WHERE name = 'clearbit'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Step 4: Normalize title (OpenAI)
INSERT INTO leads_enrichment_steps (provider_id, step_name, step_order, entity_type, is_active, is_required, description, config) 
SELECT 
    id,
    'normalize_title',
    4,
    'contact',
    true,
    false,
    'Normalize job title using OpenAI',
    '{"model": "gpt-4", "endpoint": "/chat/completions"}'
FROM leads_enrichment_providers
WHERE name = 'openai'
ON CONFLICT (entity_type, step_order) DO NOTHING;

-- Note: API keys should be inserted via admin interface or environment variables
-- Example structure:
-- INSERT INTO leads_enrichment_api_keys (provider_id, key_name, api_key, is_active, priority, free_tier_limit, free_tier_reset_date)
-- SELECT id, 'Primary Key', 'your-api-key-here', true, 0, 25, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
-- FROM leads_enrichment_providers WHERE name = 'hunter_io';

