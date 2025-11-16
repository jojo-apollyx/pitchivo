-- Function to increment campaign metrics
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
    'emails_clicked',
    'emails_bounced',
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_campaign_metric TO authenticated, service_role;

