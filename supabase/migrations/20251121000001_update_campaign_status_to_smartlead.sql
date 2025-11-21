-- ============================================================================
-- UPDATE CAMPAIGN STATUS TO MATCH SMARTLEAD STATUSES
-- ============================================================================
-- Update campaigns.status to match Smartlead API statuses exactly
-- Smartlead statuses: DRAFTED, ACTIVE, PAUSED, COMPLETED, STOPPED
-- Remove: 'scheduled', 'cancelled' (not used by Smartlead)
-- Add: 'drafted', 'stopped' (matching Smartlead)

-- First, drop the old constraint to allow data updates
ALTER TABLE campaigns 
DROP CONSTRAINT IF EXISTS campaigns_status_check;

-- Update existing data to map old statuses to new ones
UPDATE campaigns 
SET status = CASE 
  WHEN status = 'cancelled' THEN 'stopped'
  WHEN status = 'scheduled' THEN 'drafted'  -- Scheduled campaigns become drafted (matching Smartlead DRAFTED)
  WHEN status = 'draft' THEN 'drafted'  -- Old 'draft' becomes 'drafted' to match Smartlead
  WHEN status = 'drafted' THEN 'drafted'  -- Already correct, keep as is
  WHEN status = 'active' THEN 'active'  -- Keep as is
  WHEN status = 'paused' THEN 'paused'  -- Keep as is
  WHEN status = 'completed' THEN 'completed'  -- Keep as is
  WHEN status = 'stopped' THEN 'stopped'  -- Keep as is
  ELSE 'drafted'  -- Default unknown statuses to drafted
END;

-- Now add the new constraint to match Smartlead statuses
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('drafted', 'active', 'paused', 'completed', 'stopped'));

-- Update default to 'drafted' (matching Smartlead's DRAFTED)
ALTER TABLE campaigns 
ALTER COLUMN status SET DEFAULT 'drafted';

-- Add comment
COMMENT ON COLUMN campaigns.status IS 'Campaign status matching Smartlead API: drafted, active, paused, completed, stopped';

