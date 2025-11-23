-- Add Smartlead-specific activity types to campaign_activities
-- These are needed for tracking email replies and lead category updates

ALTER TABLE campaign_activities 
DROP CONSTRAINT IF EXISTS campaign_activities_activity_type_check;

ALTER TABLE campaign_activities
ADD CONSTRAINT campaign_activities_activity_type_check 
CHECK (activity_type IN (
  -- Existing types
  'email_sent',
  'email_opened', 
  'email_clicked',
  'email_bounced',
  'product_viewed',
  'rfq_submitted',
  
  -- Brevo event types
  'email_delivered',
  'email_soft_bounced',
  'email_hard_bounced',
  'email_blocked',
  'email_invalid',
  'email_unique_opened',
  'email_first_opening',
  'email_loaded_by_proxy',
  'email_complaint',
  'email_unsubscribed',
  'email_deferred',
  'email_error',
  
  -- Smartlead-specific event types
  'email_replied',
  'lead_category_updated'
));

-- Add replies_received metric to campaigns table if it doesn't exist
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS replies_received INTEGER DEFAULT 0;

COMMENT ON COLUMN campaigns.replies_received IS 'Count of email replies received from leads via Smartlead campaigns';

-- Update the increment_campaign_metric function to include replies_received
CREATE OR REPLACE FUNCTION increment_campaign_metric(
  p_campaign_id UUID,
  p_metric TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS void AS $$
BEGIN
  -- Validate metric name
  IF p_metric NOT IN (
    'emails_sent',
    'emails_delivered',
    'emails_opened',
    'emails_unique_opened',
    'emails_clicked',
    'emails_bounced',
    'emails_soft_bounced',
    'emails_hard_bounced',
    'emails_blocked',
    'emails_invalid',
    'emails_complaint',
    'emails_unsubscribed',
    'replies_received',
    'rfqs_received'
  ) THEN
    RAISE EXCEPTION 'Invalid metric name: %', p_metric;
  END IF;

  -- Update the metric using dynamic SQL
  EXECUTE format(
    'UPDATE campaigns SET %I = GREATEST(%I + $1, 0), updated_at = NOW() WHERE campaign_id = $2',
    p_metric,
    p_metric
  ) USING p_increment, p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

