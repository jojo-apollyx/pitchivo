-- Lead Tracking Helper Functions
-- Postgres functions for safely incrementing counters

-- Function to increment lead event counters
CREATE OR REPLACE FUNCTION increment_lead_counter(
  lead_id_param UUID,
  counter_name TEXT
)
RETURNS VOID AS $$
BEGIN
  CASE counter_name
    WHEN 'open_count' THEN
      UPDATE campaign_leads
      SET open_count = COALESCE(open_count, 0) + 1,
          updated_at = NOW()
      WHERE lead_id = lead_id_param;
    
    WHEN 'click_count' THEN
      UPDATE campaign_leads
      SET click_count = COALESCE(click_count, 0) + 1,
          updated_at = NOW()
      WHERE lead_id = lead_id_param;
    
    WHEN 'reply_count' THEN
      UPDATE campaign_leads
      SET reply_count = COALESCE(reply_count, 0) + 1,
          updated_at = NOW()
      WHERE lead_id = lead_id_param;
    
    ELSE
      RAISE EXCEPTION 'Invalid counter name: %', counter_name;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment campaign event counters
CREATE OR REPLACE FUNCTION increment_campaign_counter(
  campaign_id_param UUID,
  counter_name TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  CASE counter_name
    WHEN 'emails_sent' THEN
      UPDATE campaigns
      SET emails_sent = COALESCE(emails_sent, 0) + increment_by,
          updated_at = NOW()
      WHERE campaign_id = campaign_id_param;
    
    WHEN 'emails_delivered' THEN
      UPDATE campaigns
      SET emails_delivered = COALESCE(emails_delivered, 0) + increment_by,
          updated_at = NOW()
      WHERE campaign_id = campaign_id_param;
    
    WHEN 'emails_opened' THEN
      UPDATE campaigns
      SET emails_opened = COALESCE(emails_opened, 0) + increment_by,
          updated_at = NOW()
      WHERE campaign_id = campaign_id_param;
    
    WHEN 'emails_clicked' THEN
      UPDATE campaigns
      SET emails_clicked = COALESCE(emails_clicked, 0) + increment_by,
          updated_at = NOW()
      WHERE campaign_id = campaign_id_param;
    
    WHEN 'emails_bounced' THEN
      UPDATE campaigns
      SET emails_bounced = COALESCE(emails_bounced, 0) + increment_by,
          updated_at = NOW()
      WHERE campaign_id = campaign_id_param;
    
    WHEN 'replies_received' THEN
      UPDATE campaigns
      SET replies_received = COALESCE(replies_received, 0) + increment_by,
          updated_at = NOW()
      WHERE campaign_id = campaign_id_param;
    
    ELSE
      RAISE EXCEPTION 'Invalid counter name: %', counter_name;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION increment_lead_counter IS 'Safely increment lead event counters (open_count, click_count, reply_count)';
COMMENT ON FUNCTION increment_campaign_counter IS 'Safely increment campaign metric counters';

-- Create indexes for better performance on lead_events queries
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_type ON lead_events(lead_id, event_type);
CREATE INDEX IF NOT EXISTS idx_lead_events_campaign_type ON lead_events(campaign_id, event_type);

-- Create view for lead statistics
CREATE OR REPLACE VIEW lead_statistics AS
SELECT 
  cl.lead_id,
  cl.campaign_id,
  cl.email,
  cl.name,
  cl.status,
  cl.last_contacted,
  COUNT(CASE WHEN le.event_type = 'sent' THEN 1 END) as emails_sent,
  COUNT(CASE WHEN le.event_type = 'delivered' THEN 1 END) as emails_delivered,
  COUNT(CASE WHEN le.event_type = 'opened' THEN 1 END) as emails_opened,
  COUNT(CASE WHEN le.event_type = 'clicked' THEN 1 END) as emails_clicked,
  COUNT(CASE WHEN le.event_type = 'replied' THEN 1 END) as emails_replied,
  MAX(le.event_timestamp) as last_activity
FROM campaign_leads cl
LEFT JOIN lead_events le ON cl.lead_id = le.lead_id
GROUP BY cl.lead_id, cl.campaign_id, cl.email, cl.name, cl.status, cl.last_contacted;

COMMENT ON VIEW lead_statistics IS 'Aggregated statistics for each lead';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_lead_counter TO authenticated;
GRANT EXECUTE ON FUNCTION increment_campaign_counter TO authenticated;
GRANT SELECT ON lead_statistics TO authenticated;

