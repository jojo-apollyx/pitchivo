# Email Status Tracking Fix

## Summary

Fixed critical email tracking issues and added comprehensive event history tracking for campaign emails:

1. **Tags not being sent to Brevo** - Fixed the `send-email` edge function to pass campaign tags to Brevo API
2. **No event recording** - Created `email_events` table to track all email events (sent, delivered, opened, clicked, etc.)
3. **Email status mixing issue** - Each email now has unique tracking via `brevo_message_id` and `scheduled_email_id`
4. **Event history UI** - Added admin interface to view complete timeline of events for each email

---

## Issues Identified

### 1. Tags Not Being Passed to Brevo

**Problem:** The webhook was failing with "No campaign tag" error because the `send-email` edge function wasn't passing tags to Brevo API.

**Root Cause:** In `/supabase/functions/send-email/index.ts`:
- The `BrevoEmailPayload` interface didn't include `tags` field
- Tags from the request payload were not being added to the Brevo API call

**Impact:** Webhooks couldn't identify which campaign an email belonged to, so all tracking failed.

### 2. No Event History

**Problem:** No systematic way to track the complete lifecycle of an email (sent → delivered → opened → clicked).

**Root Cause:** While the `scheduled_emails` table had timestamp columns (`delivered_at`, `opened_at`, etc.), there was no table to store multiple events or a complete event timeline.

**Impact:** Admins couldn't see when an email was opened multiple times, couldn't track click events, and had no visibility into email journey.

### 3. Email Threading/Status Mixing

**Problem:** Two separate emails appeared to have mixed status, possibly due to email threading in Gmail.

**Root Cause:** Insufficient unique tracking per email. While `brevo_message_id` was stored, event recording wasn't properly using it to differentiate between emails.

**Impact:** Confusion when viewing email status, especially for multiple emails sent to the same recipient.

---

## Solutions Implemented

### 1. Fixed Tag Passing in Edge Function

**File:** `/supabase/functions/send-email/index.ts`

**Changes:**
- Added `tags` field to `BrevoEmailPayload` interface
- Added code to pass tags to Brevo API if provided

```typescript
// Add tags if provided (CRITICAL for webhook tracking)
if (emailData.tags && emailData.tags.length > 0) {
  brevoPayload.tags = emailData.tags
}
```

**Result:** Campaign tags are now included in every email sent via Brevo, allowing webhooks to identify the campaign.

### 2. Created Email Events Table

**File:** `/supabase/migrations/20251119000002_create_email_events_table.sql`

**Schema:**
```sql
CREATE TABLE email_events (
  event_id UUID PRIMARY KEY,
  scheduled_email_id UUID REFERENCES scheduled_emails,
  campaign_id UUID REFERENCES campaigns,
  event_type TEXT CHECK (event_type IN (
    'sent', 'delivered', 'opened', 'unique_opened', 'first_opening',
    'clicked', 'hard_bounced', 'soft_bounced', 'blocked', 'invalid',
    'complaint', 'unsubscribed', 'deferred', 'error', 'loaded_by_proxy'
  )),
  event_timestamp TIMESTAMPTZ NOT NULL,
  recipient_email TEXT NOT NULL,
  brevo_message_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- Complete timeline of all events for each email
- Stores metadata (IP, user agent, device, links clicked, etc.)
- Indexed for efficient queries
- Never overwrites previous events (append-only)

### 3. Updated Webhook Handler

**File:** `/apps/web/app/api/webhooks/brevo/route.ts`

**Changes:**
- Added `recordEmailEvent()` function to insert events into `email_events` table
- Called after updating scheduled_emails status
- Extracts comprehensive metadata from Brevo webhooks

```typescript
async function recordEmailEvent(campaignId, email, messageId, eventType, eventData) {
  // Find scheduled_email_id
  // Extract metadata (device, IP, user agent, links, etc.)
  // Insert event into email_events table
}
```

**Result:** Every webhook event is now recorded with full details and timestamp.

### 4. Created Event History API

**File:** `/apps/web/app/api/admin/campaigns/email-events/[scheduledEmailId]/route.ts`

**Endpoint:** `GET /api/admin/campaigns/email-events/{scheduledEmailId}`

**Response:**
```json
{
  "success": true,
  "scheduledEmail": { ... },
  "events": [
    {
      "event_id": "...",
      "event_type": "sent",
      "event_timestamp": "2025-11-19T04:19:17.88Z",
      "metadata": { ... }
    },
    {
      "event_type": "delivered",
      "event_timestamp": "2025-11-19T04:19:19Z",
      ...
    },
    {
      "event_type": "unique_opened",
      "event_timestamp": "2025-11-19T04:20:08Z",
      "metadata": {
        "device_used": "DESKTOP",
        "user_agent": "...",
        "ip": "..."
      }
    }
  ],
  "eventCount": 3
}
```

### 5. Created Event History UI Component

**File:** `/apps/web/components/admin/email-event-history.tsx`

**Features:**
- Beautiful timeline view of all email events
- Shows relative time ("2 hours ago") and absolute time
- Event-specific icons and colors
- Displays metadata (device, IP, links, reasons)
- Modal/dialog interface for easy viewing

**Event Types Supported:**
- ✉️ Sent (blue)
- ✅ Delivered (green)
- 👁️ Opened / Unique Opened / First Opening (purple)
- 🖱️ Clicked (indigo)
- ❌ Hard/Soft Bounced (red/orange)
- 🚫 Blocked, Spam Report (red)
- 🔕 Unsubscribed (gray)
- ⏸️ Deferred (yellow)

### 6. Integrated into Admin UI

**File:** `/apps/web/components/admin/campaign-email-management.tsx`

**Changes:**
- Added "View Event History" action to dropdown menu for sent emails
- Opens modal showing complete event timeline
- Added state management for event history dialog

**User Flow:**
1. Admin goes to campaign management
2. Clicks "..." menu on a sent email
3. Selects "View Event History"
4. Sees beautiful timeline with all events

---

## Event Tracking Flow

### Sending Email

```
1. Admin clicks "Send Now"
   ↓
2. API creates scheduled_emails record
   ↓
3. Calls sendEmail() with tags: [`campaign_{id}`]
   ↓
4. Edge function passes tags to Brevo API
   ↓
5. Brevo sends email with campaign tag
   ↓
6. scheduled_emails updated with brevo_message_id
```

### Receiving Webhooks

```
1. Brevo sends webhook event
   ↓
2. Webhook extracts campaign_id from tag
   ↓
3. Updates campaign_activities (aggregate stats)
   ↓
4. Updates scheduled_emails (status + timestamps)
   ↓
5. Records event in email_events (complete history)
   ↓
6. Handles special events (bounces, spam, etc.)
```

### Viewing History

```
1. Admin clicks "View Event History"
   ↓
2. API fetches scheduled_email details
   ↓
3. API fetches all events for that email
   ↓
4. UI displays timeline with all events
   ↓
5. Shows metadata (device, IP, links, etc.)
```

---

## Database Schema Changes

### New Table: `email_events`

**Purpose:** Store complete timeline of all email events

**Key Features:**
- Append-only (never updates, always inserts)
- One row per event (multiple opens = multiple rows)
- Comprehensive metadata storage
- Indexed for fast queries

**Indexes:**
- `idx_email_events_scheduled_email` - Query events by email
- `idx_email_events_campaign` - Query events by campaign
- `idx_email_events_type` - Filter by event type
- `idx_email_events_timestamp` - Sort by time (DESC)
- `idx_email_events_brevo_message` - Find by Brevo message ID

**RLS Policies:**
- Authenticated users can read events
- Service role can insert events (webhooks)

---

## Testing & Verification

### How to Test

1. **Send a test email:**
   ```
   - Go to campaign management
   - Add a lead
   - Click "Send Now"
   ```

2. **Check webhook logs:**
   ```
   - Watch console logs for webhook events
   - Should see: "📝 Recording event in email_events history..."
   - Should see: "✅ Email event recorded successfully"
   ```

3. **View event history:**
   ```
   - Click "..." menu on sent email
   - Select "View Event History"
   - Should see timeline with events
   ```

4. **Verify events in database:**
   ```sql
   SELECT * FROM email_events 
   WHERE scheduled_email_id = 'YOUR_EMAIL_ID'
   ORDER BY event_timestamp ASC;
   ```

### Expected Events Timeline

For a successful email delivery and open:

```
1. sent          (when email leaves our system)
2. request       (Brevo receives send request) 
3. delivered     (recipient's mail server accepted)
4. unique_opened (first time recipient opens)
5. opened        (any subsequent opens)
6. clicked       (if recipient clicks a link)
```

---

## Migration Steps

### Local Development

```bash
# Reset database to apply new migration
npx supabase db reset --local

# Or push migration only
npx supabase db push --local
```

### Production

```bash
# Push migration to production
npx supabase db push --linked

# Or create migration file and push via dashboard
```

---

## Troubleshooting

### Issue: "No campaign tag" error in webhooks

**Cause:** Tags not being sent to Brevo
**Solution:** 
1. Check that tags are included in email payload
2. Verify edge function is passing tags to Brevo
3. Test by sending email and checking Brevo API logs

### Issue: Events not appearing in history

**Cause:** Events not being recorded in database
**Solution:**
1. Check webhook logs for "Recording event" message
2. Verify email_events table exists
3. Check RLS policies allow service role to insert
4. Query database directly to verify events

### Issue: Event history shows no events

**Cause:** Events recorded but not found by API
**Solution:**
1. Verify scheduled_email_id is correct
2. Check that events exist in database
3. Verify API endpoint is working
4. Check browser console for errors

---

## Benefits

### For Admins

✅ **Complete Visibility:** See every event for every email
✅ **Better Debugging:** Identify delivery issues quickly
✅ **Proof of Engagement:** Know exactly when emails are opened/clicked
✅ **Audit Trail:** Complete history for compliance/reporting

### For System

✅ **Reliable Tracking:** No more missed events
✅ **Unique Identification:** Each email tracked independently
✅ **Scalable:** Efficient queries with proper indexing
✅ **Extensible:** Easy to add new event types

### For Users

✅ **Accurate Status:** Real-time email status updates
✅ **Clear Timeline:** Understand email journey
✅ **Better Insights:** See which emails perform best

---

## Future Enhancements

1. **Email Analytics Dashboard:**
   - Aggregate metrics across all campaigns
   - Open rate trends over time
   - Best performing send times

2. **Smart Alerts:**
   - Notify admin when email bounces
   - Alert on spam complaints
   - Track unsubscribe trends

3. **Advanced Filtering:**
   - Filter events by type
   - Search by recipient
   - Export event data

4. **Email Heatmap:**
   - Visualize when emails are opened
   - Identify best send times
   - Track engagement patterns

---

## Files Modified

1. `/supabase/functions/send-email/index.ts` - Added tag passing
2. `/apps/web/app/api/webhooks/brevo/route.ts` - Added event recording
3. `/apps/web/components/admin/campaign-email-management.tsx` - Added history UI
4. `/apps/web/components/admin/email-event-history.tsx` - New component
5. `/apps/web/app/api/admin/campaigns/email-events/[scheduledEmailId]/route.ts` - New API
6. `/supabase/migrations/20251119000002_create_email_events_table.sql` - New table

---

## Conclusion

Email tracking is now fully functional with:

✅ Tags properly sent to Brevo
✅ All webhook events recorded
✅ Complete event history stored
✅ Beautiful admin UI for viewing events
✅ Unique tracking per email (no mixing)
✅ Comprehensive metadata captured

The system now provides complete visibility into the email lifecycle from send to open to click, with a beautiful timeline interface for admins to track engagement and debug issues.

