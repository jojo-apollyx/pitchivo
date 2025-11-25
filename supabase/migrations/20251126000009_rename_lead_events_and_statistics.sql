-- Rename lead_events to campaign_lead_events
-- Rename lead_statistics view to campaign_lead_statistics
-- This migration handles existing databases that may have the old table/view names

-- Rename table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_events') THEN
    ALTER TABLE lead_events RENAME TO campaign_lead_events;
    RAISE NOTICE 'Renamed table lead_events to campaign_lead_events';
  END IF;
END $$;

-- Rename indexes if they exist
DO $$
BEGIN
  -- Rename index idx_lead_events_lead
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_lead_events_lead') THEN
    ALTER INDEX idx_lead_events_lead RENAME TO idx_campaign_lead_events_lead;
  END IF;
  
  -- Rename index idx_lead_events_campaign
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_lead_events_campaign') THEN
    ALTER INDEX idx_lead_events_campaign RENAME TO idx_campaign_lead_events_campaign;
  END IF;
  
  -- Rename index idx_lead_events_type
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_lead_events_type') THEN
    ALTER INDEX idx_lead_events_type RENAME TO idx_campaign_lead_events_type;
  END IF;
  
  -- Rename index idx_lead_events_timestamp
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_lead_events_timestamp') THEN
    ALTER INDEX idx_lead_events_timestamp RENAME TO idx_campaign_lead_events_timestamp;
  END IF;
  
  -- Rename index idx_lead_events_lead_type
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_lead_events_lead_type') THEN
    ALTER INDEX idx_lead_events_lead_type RENAME TO idx_campaign_lead_events_lead_type;
  END IF;
  
  -- Rename index idx_lead_events_campaign_type
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_lead_events_campaign_type') THEN
    ALTER INDEX idx_lead_events_campaign_type RENAME TO idx_campaign_lead_events_campaign_type;
  END IF;
END $$;

-- Rename view if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'lead_statistics') THEN
    DROP VIEW IF EXISTS lead_statistics;
    RAISE NOTICE 'Dropped old view lead_statistics';
  END IF;
END $$;

-- Recreate the view with new name (using campaign_lead_events)
CREATE OR REPLACE VIEW campaign_lead_statistics AS
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
LEFT JOIN campaign_lead_events le ON cl.lead_id = le.lead_id
GROUP BY cl.lead_id, cl.campaign_id, cl.email, cl.name, cl.status, cl.last_contacted;

COMMENT ON VIEW campaign_lead_statistics IS 'Aggregated statistics for each lead';

-- Grant permissions
GRANT SELECT ON campaign_lead_statistics TO authenticated;

-- Update comments
COMMENT ON TABLE campaign_lead_events IS 'Individual email events per lead for detailed tracking';
COMMENT ON COLUMN campaign_lead_events.metadata IS 'Additional event data (message_id, link_url, etc.)';

