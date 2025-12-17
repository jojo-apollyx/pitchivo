-- ============================================================================
-- CREATE SIGNAL EXCLUSIONS TABLE
-- ============================================================================
-- Soft delete mechanism for leads_signals
-- When a signal is "deleted" by admin, it's marked as excluded
-- This preserves audit trail and allows undo functionality

CREATE TABLE IF NOT EXISTS leads_signal_exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to the excluded signal
    signal_id UUID REFERENCES leads_signals(id) ON DELETE CASCADE,
    
    -- Also store org_id and item_id for efficient querying
    org_id UUID REFERENCES leads_organizations(id) ON DELETE CASCADE,
    item_id UUID REFERENCES leads_market_items(id) ON DELETE CASCADE,
    
    -- Exclusion reason
    exclusion_reason TEXT DEFAULT 'admin_deleted', -- 'admin_deleted', 'duplicate', 'incorrect', etc.
    
    -- Who excluded it
    excluded_by UUID REFERENCES auth.users(id),
    excluded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_signal_exclusions_signal_id ON leads_signal_exclusions(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_exclusions_org_id ON leads_signal_exclusions(org_id);
CREATE INDEX IF NOT EXISTS idx_signal_exclusions_item_id ON leads_signal_exclusions(item_id);
CREATE INDEX IF NOT EXISTS idx_signal_exclusions_org_item ON leads_signal_exclusions(org_id, item_id);
CREATE INDEX IF NOT EXISTS idx_signal_exclusions_excluded_at ON leads_signal_exclusions(excluded_at DESC);

COMMENT ON TABLE leads_signal_exclusions IS 'Soft delete mechanism for leads_signals. Excluded signals will not appear in campaign generation.';
COMMENT ON COLUMN leads_signal_exclusions.exclusion_reason IS 'Reason for exclusion: admin_deleted, duplicate, incorrect, etc.';
COMMENT ON COLUMN leads_signal_exclusions.excluded_by IS 'User who excluded the signal (admin)';

