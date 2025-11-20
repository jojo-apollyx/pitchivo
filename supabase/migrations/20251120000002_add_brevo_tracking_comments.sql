-- Add comments to clarify Brevo-specific tracking columns
-- These columns are used exclusively for Brevo email delivery tracking via webhooks
-- Campaign management is now handled by Smartlead

-- Scheduled emails table - Brevo tracking columns
COMMENT ON COLUMN scheduled_emails.brevo_message_id IS 'Brevo message ID for email tracking via Brevo webhooks. Used for tracking email delivery status from Brevo.';
COMMENT ON COLUMN scheduled_emails.brevo_status IS 'Email delivery status from Brevo webhooks (delivered, opened, clicked, bounced, etc.). Updated automatically via Brevo webhook events.';

-- Email events table - Brevo tracking
COMMENT ON COLUMN email_events.brevo_message_id IS 'Brevo message ID linking to Brevo webhook events. Used to track email events from Brevo.';
COMMENT ON TABLE email_events IS 'Email event tracking from Brevo webhooks. Tracks delivery, opens, clicks, bounces, etc. Events are received via /api/webhooks/brevo endpoint.';

-- Add comment to campaigns table about hybrid approach
COMMENT ON TABLE campaigns IS 'Campaign management table. Campaigns are created and managed via Smartlead (smartlead_campaign_id), while email sending and delivery tracking is handled by Brevo.';

