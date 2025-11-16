-- Update campaign_activities to support all Brevo event types
-- Add new event types to the activity_type enum

-- First, add new event types to the existing enum
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
  
  -- New Brevo event types
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
  'email_error'
));

-- Add index for faster event type queries
CREATE INDEX IF NOT EXISTS idx_campaign_activities_type_email 
ON campaign_activities(campaign_id, activity_type) 
WHERE activity_type LIKE 'email_%';

-- Create a materialized view for email event summaries per campaign
CREATE MATERIALIZED VIEW IF NOT EXISTS campaign_email_event_summary AS
SELECT 
  campaign_id,
  COUNT(*) FILTER (WHERE activity_type = 'email_sent') as sent_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_delivered') as delivered_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_opened') as opened_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_unique_opened') as unique_opened_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_clicked') as clicked_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_soft_bounced') as soft_bounced_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_hard_bounced') as hard_bounced_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_blocked') as blocked_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_invalid') as invalid_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_complaint') as complaint_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_unsubscribed') as unsubscribed_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_deferred') as deferred_count,
  COUNT(*) FILTER (WHERE activity_type = 'email_error') as error_count,
  MAX(created_at) as last_event_at
FROM campaign_activities
WHERE activity_type LIKE 'email_%'
GROUP BY campaign_id;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_email_summary_campaign 
ON campaign_email_event_summary(campaign_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_campaign_email_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_email_event_summary;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON campaign_email_event_summary TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION refresh_campaign_email_summary TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW campaign_email_event_summary IS 
'Summary of all email events per campaign. Refresh periodically using refresh_campaign_email_summary() function.';

-- Add columns to campaigns table for quick access to key metrics
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS emails_unique_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_soft_bounced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_hard_bounced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_blocked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_invalid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_complaint INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_unsubscribed INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN campaigns.emails_unique_opened IS 'Count of unique email opens (first open per recipient)';
COMMENT ON COLUMN campaigns.emails_soft_bounced IS 'Count of soft bounces (temporary delivery failures)';
COMMENT ON COLUMN campaigns.emails_hard_bounced IS 'Count of hard bounces (permanent delivery failures)';
COMMENT ON COLUMN campaigns.emails_blocked IS 'Count of emails blocked by recipient server';
COMMENT ON COLUMN campaigns.emails_invalid IS 'Count of emails sent to invalid addresses';
COMMENT ON COLUMN campaigns.emails_complaint IS 'Count of spam complaints';
COMMENT ON COLUMN campaigns.emails_unsubscribed IS 'Count of unsubscribes';

-- Update the increment_campaign_metric function to handle new metrics
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

