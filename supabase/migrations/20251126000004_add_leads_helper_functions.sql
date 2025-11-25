-- ============================================================================
-- HELPER FUNCTIONS FOR LEADS SYSTEM
-- ============================================================================
-- Additional utility functions for common operations

-- Function: Batch update cached roles for multiple organizations
CREATE OR REPLACE FUNCTION batch_update_organization_cached_roles(
    org_ids UUID[]
)
RETURNS TABLE(org_id UUID, roles TEXT[]) AS $$
DECLARE
    v_org_id UUID;
    v_roles TEXT[];
BEGIN
    FOREACH v_org_id IN ARRAY org_ids
    LOOP
        PERFORM update_organization_cached_roles(v_org_id);
        
        SELECT cached_roles INTO v_roles
        FROM leads_organizations
        WHERE id = v_org_id;
        
        RETURN QUERY SELECT v_org_id, v_roles;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Get organization statistics
CREATE OR REPLACE FUNCTION get_organization_statistics(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'organization_id', o.id,
        'name', o.name,
        'domain', o.domain,
        'roles', o.cached_roles,
        'business_types', o.business_type,
        'industry_categories', o.industry_categories,
        'signals_count', (
            SELECT COUNT(*) 
            FROM leads_signals 
            WHERE leads_signals.org_id = o.id
        ),
        'contacts_count', (
            SELECT COUNT(*) 
            FROM leads_contacts 
            WHERE leads_contacts.org_id = o.id
        ),
        'buyer_signals', (
            SELECT COUNT(*) 
            FROM leads_signals 
            WHERE leads_signals.org_id = o.id
            AND interaction_type IN ('purchased', 'requested_quote', 'viewed_item', 'added_to_cart')
        ),
        'seller_signals', (
            SELECT COUNT(*) 
            FROM leads_signals 
            WHERE leads_signals.org_id = o.id
            AND interaction_type IN ('sold', 'supplied', 'listed_for_sale', 'advertised')
        ),
        'manufacturer_signals', (
            SELECT COUNT(*) 
            FROM leads_signals 
            WHERE leads_signals.org_id = o.id
            AND interaction_type IN ('manufactured', 'produced')
        )
    ) INTO v_stats
    FROM leads_organizations o
    WHERE o.id = org_id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Function: Resolve market item by name or alias
CREATE OR REPLACE FUNCTION resolve_market_item(
    p_name TEXT,
    p_aliases TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_item_id UUID;
    v_normalized_name TEXT;
BEGIN
    v_normalized_name := lower(trim(p_name));
    
    -- Try exact normalized name match
    SELECT id INTO v_item_id
    FROM leads_market_items
    WHERE normalized_name = v_normalized_name
    LIMIT 1;
    
    IF v_item_id IS NOT NULL THEN
        RETURN v_item_id;
    END IF;
    
    -- Try aliases match
    IF p_aliases IS NOT NULL AND array_length(p_aliases, 1) > 0 THEN
        SELECT id INTO v_item_id
        FROM leads_market_items
        WHERE aliases && p_aliases
        LIMIT 1;
        
        IF v_item_id IS NOT NULL THEN
            RETURN v_item_id;
        END IF;
    END IF;
    
    -- No match found, return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Get enrichment provider statistics
CREATE OR REPLACE FUNCTION get_enrichment_provider_stats(
    p_provider_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    provider_id UUID,
    provider_name TEXT,
    total_requests BIGINT,
    successful_requests BIGINT,
    failed_requests BIGINT,
    total_cost DECIMAL,
    avg_daily_requests NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        COALESCE(SUM(au.request_count), 0)::BIGINT,
        COALESCE(SUM(au.success_count), 0)::BIGINT,
        COALESCE(SUM(au.error_count), 0)::BIGINT,
        COALESCE(SUM(au.cost_amount), 0),
        COALESCE(AVG(au.request_count), 0)::NUMERIC
    FROM leads_enrichment_providers p
    LEFT JOIN leads_enrichment_api_usage au ON au.provider_id = p.id
        AND au.usage_date BETWEEN p_start_date AND p_end_date
    WHERE (p_provider_id IS NULL OR p.id = p_provider_id)
    GROUP BY p.id, p.name
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- View: Enrichment execution summary
CREATE OR REPLACE VIEW v_enrichment_execution_summary AS
SELECT 
    e.id,
    e.entity_type,
    e.entity_id,
    s.step_name,
    p.name AS provider_name,
    e.status,
    e.error_message,
    e.started_at,
    e.completed_at,
    CASE 
        WHEN e.completed_at IS NOT NULL AND e.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (e.completed_at - e.started_at))
        ELSE NULL
    END AS duration_seconds,
    e.created_at
FROM leads_enrichment_executions e
JOIN leads_enrichment_steps s ON s.id = e.step_id
JOIN leads_enrichment_providers p ON p.id = e.provider_id;

-- View: Organizations needing enrichment
CREATE OR REPLACE VIEW v_organizations_needing_enrichment AS
SELECT 
    o.id,
    o.name,
    o.domain,
    o.created_at,
    CASE 
        WHEN o.profile_data->>'enriched_at' IS NULL THEN true
        WHEN (o.profile_data->>'enriched_at')::TIMESTAMPTZ < NOW() - INTERVAL '90 days' THEN true
        ELSE false
    END AS needs_enrichment,
    o.profile_data->>'enriched_at' AS last_enriched_at
FROM leads_organizations o
WHERE o.domain IS NOT NULL
    AND (
        o.profile_data->>'enriched_at' IS NULL
        OR (o.profile_data->>'enriched_at')::TIMESTAMPTZ < NOW() - INTERVAL '90 days'
    )
ORDER BY o.created_at DESC;

-- View: Contacts needing enrichment
CREATE OR REPLACE VIEW v_contacts_needing_enrichment AS
SELECT 
    c.id,
    c.email,
    c.title,
    c.org_id,
    o.name AS organization_name,
    c.email_status,
    c.created_at,
    CASE 
        WHEN c.attributes->>'enriched_at' IS NULL THEN true
        WHEN (c.attributes->>'enriched_at')::TIMESTAMPTZ < NOW() - INTERVAL '90 days' THEN true
        ELSE false
    END AS needs_enrichment,
    c.attributes->>'enriched_at' AS last_enriched_at
FROM leads_contacts c
LEFT JOIN leads_organizations o ON o.id = c.org_id
WHERE c.email IS NOT NULL
    AND (
        c.attributes->>'enriched_at' IS NULL
        OR (c.attributes->>'enriched_at')::TIMESTAMPTZ < NOW() - INTERVAL '90 days'
    )
ORDER BY c.created_at DESC;

-- Index for better performance on enrichment views
-- Note: Cannot use NOW() in index predicate (must be immutable), so we index on
-- the basic conditions and let the time-based filtering happen at query time
CREATE INDEX IF NOT EXISTS idx_leads_organizations_enrichment_check 
    ON leads_organizations(domain) 
    WHERE domain IS NOT NULL 
    AND profile_data->>'enriched_at' IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_organizations_enrichment_stale 
    ON leads_organizations((profile_data->>'enriched_at'))
    WHERE domain IS NOT NULL 
    AND profile_data->>'enriched_at' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_contacts_enrichment_check 
    ON leads_contacts(email) 
    WHERE email IS NOT NULL 
    AND attributes->>'enriched_at' IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_contacts_enrichment_stale 
    ON leads_contacts((attributes->>'enriched_at'))
    WHERE email IS NOT NULL 
    AND attributes->>'enriched_at' IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION batch_update_organization_cached_roles(UUID[]) IS 'Batch update cached roles for multiple organizations';
COMMENT ON FUNCTION get_organization_statistics(UUID) IS 'Get comprehensive statistics for an organization';
COMMENT ON FUNCTION resolve_market_item(TEXT, TEXT[]) IS 'Resolve market item by name or aliases, returns NULL if not found';
COMMENT ON FUNCTION get_enrichment_provider_stats(UUID, DATE, DATE) IS 'Get enrichment provider usage statistics';
COMMENT ON VIEW v_enrichment_execution_summary IS 'Summary view of enrichment executions with timing information';
COMMENT ON VIEW v_organizations_needing_enrichment IS 'View of organizations that need enrichment (never enriched or stale)';
COMMENT ON VIEW v_contacts_needing_enrichment IS 'View of contacts that need enrichment (never enriched or stale)';

