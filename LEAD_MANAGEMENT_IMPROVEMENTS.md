# Lead Management & Email Tracking Improvements

## Overview
Enhanced the admin campaign management system to support multiple email sends to the same lead and improved event tracking to associate events with specific send actions.

## Implementation Date
November 19, 2025

---

## Key Improvements

### 1. Cancel Scheduled Emails When "Send Now" is Clicked
**Problem**: When a lead had a scheduled email and the admin clicked "Send Now", both the scheduled email and the immediate send would occur, resulting in duplicate emails.

**Solution**: 
- Modified `handleSendNow` function in `campaign-email-management.tsx` to automatically cancel any pending scheduled emails before sending immediately
- Provides user feedback showing how many scheduled emails were cancelled
- Updates local state to reflect cancellations in real-time

**Code Location**: `apps/web/components/admin/campaign-email-management.tsx` (lines 468-552)

---

### 2. Support Multiple Sends to Same Lead
**Problem**: The system could only track one email per lead, making it difficult to manage follow-up emails or resends.

**Solution**:
- Added `send_sequence_number` column to `scheduled_emails` table to track multiple sends (1=first send, 2=second send, etc.)
- Created database function `get_next_send_sequence()` to automatically calculate the next sequence number for each lead
- Added unique index to prevent duplicate sequence numbers per lead/campaign
- Updated all UI components to display and manage multiple sends per lead

**Database Migration**: `supabase/migrations/20251119000002_support_multiple_sends_per_lead.sql`

---

### 3. Enhanced Event History with Send Tracking
**Problem**: When multiple emails were sent to the same lead, events from different sends were mixed together, making it difficult to understand which events belonged to which send action.

**Solution**:
- Added `send_sequence_number` to `email_events` table
- Created database trigger to automatically populate `send_sequence_number` when events are created
- Updated `EmailEventHistory` component to display which send action each event belongs to
- Events are now clearly labeled with "Send #1", "Send #2", etc.

**Code Locations**:
- Database: `supabase/migrations/20251119000002_support_multiple_sends_per_lead.sql`
- UI Component: `apps/web/components/admin/email-event-history.tsx`

---

### 4. User-Friendly Interface for Multiple Sends
**Problem**: The table view couldn't show all sends per lead, making it hard to get a complete picture.

**Solution**:
- Added "View all (X sends)" button in the status column for leads with multiple sends
- Created comprehensive "View All Sends" dialog showing:
  - All email sends grouped by sequence number
  - Status badges for each send (sent, pending, cancelled)
  - Brevo delivery status (delivered, opened, clicked, bounced)
  - Timestamp for each send action
  - Quick access to view event history for each sent email
  - Visual summary cards showing key metrics (delivered, opened, clicked, bounced)

**Code Location**: `apps/web/components/admin/campaign-email-management.tsx` (lines 1181-1326)

---

## Technical Details

### Database Schema Changes

#### New Column: `scheduled_emails.send_sequence_number`
- Type: `INTEGER NOT NULL DEFAULT 1`
- Purpose: Track multiple sends to same lead
- Constraint: Unique per (lead_id, campaign_id, send_sequence_number) for non-cancelled emails

#### New Function: `get_next_send_sequence(p_lead_id, p_campaign_id)`
- Returns: Next sequence number for a lead in a campaign
- Usage: Automatically called when creating new scheduled emails
- Example: If lead has sends #1 and #2, returns 3

#### New Column: `email_events.send_sequence_number`
- Type: `INTEGER`
- Purpose: Link events to specific send actions
- Auto-populated: Trigger copies value from `scheduled_emails` on insert

### API Endpoint Updates

#### `/api/admin/campaigns/send` (POST)
- Now calls `get_next_send_sequence()` to get sequence number
- Includes `send_sequence_number` in scheduled_emails record
- Properly tracks which send action created each email

#### `/api/admin/campaigns/scheduled-emails` (POST)
- Updated to calculate send_sequence_number for batch email creation
- Ensures each lead gets proper sequence numbering

#### `/api/admin/campaigns/email-events/[scheduledEmailId]` (GET)
- Returns events with send_sequence_number
- Allows UI to display which send action each event belongs to

### UI Component Updates

#### CampaignEmailManagement Component
**Key Changes**:
1. Added `scheduledEmails` array to `LeadWithSchedule` interface
2. Updated data fetching to load all scheduled emails per lead
3. Modified `handleSendNow` to cancel pending emails first
4. Added send sequence badges in status column
5. Created "View All Sends" dialog with comprehensive history

**User Experience**:
- Clear visual indication of send sequence numbers with purple badges
- Easy access to complete send history per lead
- Visual timeline showing all send actions and their outcomes
- Quick access to detailed event history for each send

#### EmailEventHistory Component
**Key Changes**:
1. Added `send_sequence_number` to event and scheduled email interfaces
2. Updated dialog title to show "Send #X" when applicable
3. Added send sequence badge in email details section
4. Displays sent timestamp for better context

### Type Definitions

#### Updated Interface: `ScheduledEmailWithBrevoStatus`
```typescript
export interface ScheduledEmailWithBrevoStatus {
  // ... existing fields
  send_sequence_number?: number // Track multiple sends to same lead
  // ... rest of fields
}
```

---

## User Workflow Examples

### Example 1: Sending Follow-up Email
1. Admin sends email to lead (automatically becomes "Send #1")
2. Lead doesn't respond, admin wants to follow up
3. Admin clicks "Send Now" again
4. Email is sent as "Send #2"
5. Both sends are visible in "View all sends" dialog
6. Each send has its own event history

### Example 2: Changing Mind After Scheduling
1. Admin schedules email for lead (future date)
2. Admin decides to send immediately instead
3. Admin clicks "Send Now"
4. System automatically cancels the scheduled email
5. Sends email immediately as next sequence number
6. User sees notification: "Cancelled 1 pending scheduled email(s)"

### Example 3: Reviewing Lead History
1. Admin wants to check all communication with a lead
2. Clicks "View history (3 sends)" in status column
3. Dialog shows all 3 sends with:
   - Send #1: Delivered, opened, clicked
   - Send #2: Delivered, opened (no click)
   - Send #3: Pending (scheduled for tomorrow)
4. Admin can click "View Events" on any sent email to see detailed timeline

---

## Testing Recommendations

### Database Testing
1. ✅ Run migration: `supabase db push`
2. ✅ Test `get_next_send_sequence()` function returns correct sequence numbers
3. ✅ Verify unique constraint prevents duplicate sequences
4. ✅ Test trigger auto-populates event sequence numbers

### API Testing
1. Send email to same lead multiple times via `/api/admin/campaigns/send`
2. Verify each gets incremented sequence number
3. Test batch scheduling via `/api/admin/campaigns/scheduled-emails`
4. Check events API returns send_sequence_number

### UI Testing
1. **Send Now with Pending Schedule**:
   - Schedule email for lead
   - Click "Send Now" 
   - Verify scheduled email is cancelled
   - Verify notification appears
   
2. **Multiple Sends Display**:
   - Send to same lead 2-3 times
   - Check status column shows "View all (X sends)"
   - Open dialog and verify all sends appear
   - Verify sequence numbers are displayed correctly

3. **Event History**:
   - Send email to lead
   - View event history
   - Verify "Send #X" appears if sequence > 1
   - Check all events have correct timestamps

### Edge Cases
1. ✅ Lead with no previous sends (sequence should be 1)
2. ✅ Lead with cancelled sends (sequence should still increment)
3. ✅ Multiple admins sending to same lead simultaneously
4. ✅ Batch scheduling of emails to leads with existing sends

---

## Benefits

### For Administrators
- **Clear History**: See all communication attempts with each lead
- **No Duplicates**: Automatic cancellation prevents accidental double-sends
- **Better Tracking**: Know exactly which send action generated which events
- **Informed Decisions**: View complete history before sending follow-ups

### For System Performance
- **Scalability**: Supports unlimited resends per lead
- **Data Integrity**: Unique constraints prevent duplicate tracking
- **Automatic Management**: Database functions handle sequence numbering
- **Clean Architecture**: Separation of concerns between sends and events

### For Reporting
- **Accurate Metrics**: Events tied to specific send actions
- **Follow-up Analysis**: Track effectiveness of follow-up emails
- **A/B Testing**: Compare different send strategies per lead
- **Trend Analysis**: Identify patterns in multi-touch campaigns

---

## Database Schema Reference

### scheduled_emails Table (Updated)
```sql
CREATE TABLE scheduled_emails (
  scheduled_email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  lead_id UUID REFERENCES campaign_leads(lead_id),
  send_sequence_number INTEGER NOT NULL DEFAULT 1, -- NEW
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_title TEXT,
  recipient_company TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  brevo_message_id TEXT,
  brevo_status TEXT,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  spam_reported_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for send sequences
CREATE UNIQUE INDEX idx_scheduled_emails_lead_campaign_sequence 
ON scheduled_emails(lead_id, campaign_id, send_sequence_number) 
WHERE lead_id IS NOT NULL AND status != 'cancelled';
```

### email_events Table (Updated)
```sql
CREATE TABLE email_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_email_id UUID NOT NULL REFERENCES scheduled_emails(scheduled_email_id),
  campaign_id UUID NOT NULL,
  send_sequence_number INTEGER, -- NEW (auto-populated by trigger)
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  recipient_email TEXT NOT NULL,
  brevo_message_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Helper Function
```sql
CREATE OR REPLACE FUNCTION get_next_send_sequence(p_lead_id UUID, p_campaign_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(send_sequence_number), 0) + 1
  INTO v_next_sequence
  FROM scheduled_emails
  WHERE lead_id = p_lead_id 
    AND campaign_id = p_campaign_id;
  
  RETURN v_next_sequence;
END;
$$ LANGUAGE plpgsql;
```

---

## Files Modified

### Database
- ✅ `supabase/migrations/20251119000002_support_multiple_sends_per_lead.sql` (NEW)

### Components
- ✅ `apps/web/components/admin/campaign-email-management.tsx`
- ✅ `apps/web/components/admin/email-event-history.tsx`

### API Routes
- ✅ `apps/web/app/api/admin/campaigns/send/route.ts`
- ✅ `apps/web/app/api/admin/campaigns/scheduled-emails/route.ts`

### Type Definitions
- ✅ `apps/web/lib/mock-data/leads.ts`

---

## Migration Instructions

### Step 1: Apply Database Migration
```bash
cd supabase
supabase db push
```

### Step 2: Verify Migration
```sql
-- Check that send_sequence_number column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'scheduled_emails' 
AND column_name = 'send_sequence_number';

-- Test the function
SELECT get_next_send_sequence(
  'some-lead-id'::uuid, 
  'some-campaign-id'::uuid
);
```

### Step 3: Deploy Application
```bash
# No additional deployment steps needed
# TypeScript changes are backward compatible
```

### Step 4: Test in Production
1. Navigate to Admin > Campaigns > [Campaign] > Settings > Manage Leads
2. Send email to a test lead
3. Send another email to the same lead
4. Click "View all (2 sends)" to verify both appear
5. Click "View Events" on each send to verify events are tracked separately

---

## Future Enhancements

### Potential Additions
1. **Bulk Actions**: Select multiple leads and send to all at once
2. **Send Templates**: Save common follow-up sequences
3. **Auto-scheduling**: Automatic follow-ups after X days
4. **Response Detection**: Automatically track if lead replied
5. **A/B Testing**: Test different subject lines across send sequences
6. **Send Analytics**: Compare effectiveness of 1st vs 2nd vs 3rd sends
7. **Smart Timing**: Suggest best time to send based on previous opens

### Performance Optimizations
1. Index optimization for queries filtering by send_sequence_number
2. Caching of send history for frequently accessed leads
3. Pagination for leads with many sends (10+)

---

## Support & Troubleshooting

### Common Issues

**Issue**: Sequence numbers not incrementing
- **Solution**: Verify `get_next_send_sequence()` function exists and is working
- **Check**: Run `SELECT * FROM pg_proc WHERE proname = 'get_next_send_sequence'`

**Issue**: Events not showing send sequence
- **Solution**: Check that trigger `email_events_populate_sequence_trigger` is active
- **Check**: Run `SELECT * FROM pg_trigger WHERE tgname LIKE 'email_events%'`

**Issue**: "View all sends" shows wrong count
- **Solution**: Clear browser cache and reload data
- **Check**: Verify database has correct count with `SELECT COUNT(*) FROM scheduled_emails WHERE lead_id = 'xxx'`

---

## Conclusion

These improvements provide a robust system for managing multiple email sends to the same lead while maintaining clear tracking of all events associated with each send action. The implementation is scalable, maintains data integrity, and provides an excellent user experience for campaign administrators.

The automatic cancellation of pending scheduled emails when "Send Now" is clicked prevents duplicate sends and confusion, while the enhanced event tracking ensures that administrators always know which events belong to which send action.

