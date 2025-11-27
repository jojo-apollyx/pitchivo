-- ============================================================================
-- NOTIFICATION READS TABLE
-- ============================================================================
-- Tracks which notifications users have read
-- Supports both RFQ and campaign notifications

CREATE TABLE IF NOT EXISTS notification_reads (
  read_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification type and ID
  notification_type TEXT NOT NULL CHECK (notification_type IN ('rfq', 'campaign')),
  notification_id TEXT NOT NULL, -- RFQ ID or Campaign ID
  
  -- Timestamps
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique constraint/index for (user_id, notification_type, notification_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_reads_unique 
ON notification_reads(user_id, notification_type, notification_id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_org_id ON notification_reads(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_type_id ON notification_reads(notification_type, notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_type ON notification_reads(user_id, notification_type);

-- Enable RLS
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own read notifications
CREATE POLICY "Users can view their own notification reads"
  ON notification_reads
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own read notifications
CREATE POLICY "Users can mark their own notifications as read"
  ON notification_reads
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own read notifications (to update read_at timestamp)
CREATE POLICY "Users can update their own notification reads"
  ON notification_reads
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own read notifications (for unread functionality if needed)
CREATE POLICY "Users can delete their own notification reads"
  ON notification_reads
  FOR DELETE
  USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE notification_reads IS 'Tracks which notifications (RFQs and campaigns) users have read';
COMMENT ON COLUMN notification_reads.notification_type IS 'Type of notification: rfq or campaign';
COMMENT ON COLUMN notification_reads.notification_id IS 'ID of the RFQ (rfq_id) or Campaign (campaign_id)';

