-- ============================================================================
-- LEADS ENRICHMENT FRAMEWORK
-- ============================================================================
-- General-purpose enrichment framework with multi-provider support
-- All tables use 'leads_' prefix for consistency

-- 1. leads_enrichment_providers
-- Enrichment service providers (Hunter.io, Clearbit, NeverBounce, etc.)
CREATE TABLE IF NOT EXISTS leads_enrichment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'hunter_io', 'clearbit', 'neverbounce', 'openai'
    display_name TEXT NOT NULL, -- 'Hunter.io', 'Clearbit', 'NeverBounce', 'OpenAI'
    description TEXT,
    base_url TEXT, -- API base URL
    documentation_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_enrichment_providers_name ON leads_enrichment_providers(name);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_providers_active ON leads_enrichment_providers(is_active) WHERE is_active = true;

-- 2. leads_enrichment_api_keys
-- API keys (multiple per provider for free tier management and failover)
CREATE TABLE IF NOT EXISTS leads_enrichment_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES leads_enrichment_providers(id) ON DELETE CASCADE,
    
    -- Key management
    key_name TEXT NOT NULL, -- Human-readable name: 'Primary Key', 'Backup Key 1', etc.
    api_key TEXT NOT NULL, -- Encrypted or plain (depending on security requirements)
    is_active BOOLEAN DEFAULT true,
    
    -- Priority for round-robin selection (0 = primary, 1+ = backup)
    priority INTEGER DEFAULT 0,
    
    -- Free tier tracking
    free_tier_limit INTEGER, -- Monthly limit (e.g., 25 for Hunter.io free tier)
    free_tier_reset_date DATE, -- When the free tier resets (usually 1st of month)
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique key names per provider
    UNIQUE(provider_id, key_name)
);

CREATE INDEX IF NOT EXISTS idx_leads_enrichment_api_keys_provider_id ON leads_enrichment_api_keys(provider_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_api_keys_active ON leads_enrichment_api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_api_keys_priority ON leads_enrichment_api_keys(provider_id, priority);

-- 3. leads_enrichment_api_usage
-- API usage tracking for free tier management
CREATE TABLE IF NOT EXISTS leads_enrichment_api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES leads_enrichment_providers(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES leads_enrichment_api_keys(id) ON DELETE CASCADE,
    
    -- Usage tracking
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER DEFAULT 0, -- Number of API calls made
    success_count INTEGER DEFAULT 0, -- Successful API calls
    error_count INTEGER DEFAULT 0, -- Failed API calls
    
    -- Cost tracking (if applicable)
    cost_amount DECIMAL(10, 4) DEFAULT 0, -- Cost in USD
    cost_currency TEXT DEFAULT 'USD',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One record per provider/key/date
    UNIQUE(provider_id, api_key_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_leads_enrichment_api_usage_provider_id ON leads_enrichment_api_usage(provider_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_api_usage_api_key_id ON leads_enrichment_api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_api_usage_date ON leads_enrichment_api_usage(usage_date);

-- 4. leads_enrichment_steps
-- Enrichment pipeline steps configuration
CREATE TABLE IF NOT EXISTS leads_enrichment_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES leads_enrichment_providers(id) ON DELETE CASCADE,
    
    -- Step configuration
    step_name TEXT NOT NULL, -- 'validate_domain', 'enrich_company', 'validate_email', etc.
    step_order INTEGER NOT NULL, -- Order in pipeline (1, 2, 3, ...)
    entity_type TEXT NOT NULL CHECK (entity_type IN ('organization', 'contact', 'item')),
    
    -- Execution settings
    is_active BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false, -- If false, can skip on error
    retry_count INTEGER DEFAULT 0, -- Number of retries on failure
    
    -- Configuration (provider-specific settings)
    config JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique step order per entity type
    UNIQUE(entity_type, step_order)
);

CREATE INDEX IF NOT EXISTS idx_leads_enrichment_steps_provider_id ON leads_enrichment_steps(provider_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_steps_entity_type ON leads_enrichment_steps(entity_type);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_steps_active ON leads_enrichment_steps(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_steps_order ON leads_enrichment_steps(entity_type, step_order);

-- 5. leads_enrichment_executions
-- Execution logs for enrichment operations
CREATE TABLE IF NOT EXISTS leads_enrichment_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES leads_enrichment_steps(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES leads_enrichment_providers(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES leads_enrichment_api_keys(id) ON DELETE SET NULL,
    
    -- Entity being enriched
    entity_type TEXT NOT NULL CHECK (entity_type IN ('organization', 'contact', 'item')),
    entity_id UUID NOT NULL, -- References leads_organizations(id), leads_contacts(id), or leads_market_items(id)
    
    -- Execution status
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    error_message TEXT,
    
    -- Results
    result_data JSONB DEFAULT '{}'::jsonb, -- Enrichment results
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_enrichment_executions_step_id ON leads_enrichment_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_executions_provider_id ON leads_enrichment_executions(provider_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_executions_api_key_id ON leads_enrichment_executions(api_key_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_executions_entity ON leads_enrichment_executions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_executions_status ON leads_enrichment_executions(status);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_executions_created_at ON leads_enrichment_executions(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get available API key for a provider (round-robin selection)
CREATE OR REPLACE FUNCTION get_available_api_key(provider_id UUID)
RETURNS UUID AS $$
DECLARE
    v_key_id UUID;
    v_current_date DATE := CURRENT_DATE;
BEGIN
    -- Select active key with lowest priority that hasn't exceeded free tier
    SELECT ak.id INTO v_key_id
    FROM leads_enrichment_api_keys ak
    LEFT JOIN leads_enrichment_api_usage au 
        ON au.api_key_id = ak.id 
        AND au.usage_date = v_current_date
    WHERE ak.provider_id = get_available_api_key.provider_id
        AND ak.is_active = true
        AND (
            -- Check if free tier is available
            ak.free_tier_limit IS NULL 
            OR ak.free_tier_reset_date IS NULL
            OR ak.free_tier_reset_date < v_current_date
            OR COALESCE(au.request_count, 0) < ak.free_tier_limit
        )
    ORDER BY ak.priority ASC, ak.created_at ASC
    LIMIT 1;
    
    RETURN v_key_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if free tier is available for a key
CREATE OR REPLACE FUNCTION check_free_tier_available(provider_id UUID, key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_key_record RECORD;
    v_usage_record RECORD;
    v_current_date DATE := CURRENT_DATE;
BEGIN
    -- Get API key info
    SELECT * INTO v_key_record
    FROM leads_enrichment_api_keys
    WHERE id = key_id AND provider_id = check_free_tier_available.provider_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- If no free tier limit, always available
    IF v_key_record.free_tier_limit IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if reset date has passed
    IF v_key_record.free_tier_reset_date IS NOT NULL 
       AND v_key_record.free_tier_reset_date < v_current_date THEN
        -- Reset date passed, update it to next month
        UPDATE leads_enrichment_api_keys
        SET free_tier_reset_date = (v_current_date + INTERVAL '1 month')::DATE
        WHERE id = key_id;
        RETURN true;
    END IF;
    
    -- Get today's usage
    SELECT * INTO v_usage_record
    FROM leads_enrichment_api_usage
    WHERE api_key_id = key_id 
      AND usage_date = v_current_date;
    
    -- Check if usage is below limit
    IF v_usage_record.request_count IS NULL THEN
        RETURN true; -- No usage today
    END IF;
    
    RETURN v_usage_record.request_count < v_key_record.free_tier_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Record API usage
CREATE OR REPLACE FUNCTION record_api_usage(
    p_provider_id UUID,
    p_api_key_id UUID,
    p_success BOOLEAN DEFAULT true,
    p_cost_amount DECIMAL DEFAULT 0
)
RETURNS void AS $$
DECLARE
    v_current_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO leads_enrichment_api_usage (
        provider_id,
        api_key_id,
        usage_date,
        request_count,
        success_count,
        error_count,
        cost_amount
    )
    VALUES (
        p_provider_id,
        p_api_key_id,
        v_current_date,
        1,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        p_cost_amount
    )
    ON CONFLICT (provider_id, api_key_id, usage_date)
    DO UPDATE SET
        request_count = leads_enrichment_api_usage.request_count + 1,
        success_count = leads_enrichment_api_usage.success_count + 
            CASE WHEN p_success THEN 1 ELSE 0 END,
        error_count = leads_enrichment_api_usage.error_count + 
            CASE WHEN p_success THEN 0 ELSE 1 END,
        cost_amount = leads_enrichment_api_usage.cost_amount + p_cost_amount,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for providers
CREATE OR REPLACE FUNCTION leads_enrichment_providers_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_enrichment_providers_update_timestamp_trigger
    BEFORE UPDATE ON leads_enrichment_providers
    FOR EACH ROW
    EXECUTE FUNCTION leads_enrichment_providers_update_timestamp();

-- Auto-update updated_at for API keys
CREATE OR REPLACE FUNCTION leads_enrichment_api_keys_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_enrichment_api_keys_update_timestamp_trigger
    BEFORE UPDATE ON leads_enrichment_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION leads_enrichment_api_keys_update_timestamp();

-- Auto-update updated_at for steps
CREATE OR REPLACE FUNCTION leads_enrichment_steps_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_enrichment_steps_update_timestamp_trigger
    BEFORE UPDATE ON leads_enrichment_steps
    FOR EACH ROW
    EXECUTE FUNCTION leads_enrichment_steps_update_timestamp();

-- Auto-update updated_at for usage
CREATE OR REPLACE FUNCTION leads_enrichment_api_usage_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_enrichment_api_usage_update_timestamp_trigger
    BEFORE UPDATE ON leads_enrichment_api_usage
    FOR EACH ROW
    EXECUTE FUNCTION leads_enrichment_api_usage_update_timestamp();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE leads_enrichment_providers IS 'Enrichment service providers (Hunter.io, Clearbit, etc.)';
COMMENT ON TABLE leads_enrichment_api_keys IS 'API keys for enrichment providers (multiple per provider for free tier management)';
COMMENT ON TABLE leads_enrichment_api_usage IS 'API usage tracking for free tier management';
COMMENT ON TABLE leads_enrichment_steps IS 'Enrichment pipeline steps configuration';
COMMENT ON TABLE leads_enrichment_executions IS 'Execution logs for enrichment operations';
COMMENT ON FUNCTION get_available_api_key(UUID) IS 'Returns available API key for provider using round-robin selection';
COMMENT ON FUNCTION check_free_tier_available(UUID, UUID) IS 'Checks if free tier is available for a specific API key';
COMMENT ON FUNCTION record_api_usage(UUID, UUID, BOOLEAN, DECIMAL) IS 'Records API usage for tracking and free tier management';

