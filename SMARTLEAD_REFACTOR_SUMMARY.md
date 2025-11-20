# Smartlead Refactor Summary

## What Was Done

Based on your requirements, I've refactored the system to use **Smartlead for campaigns** (headless API) and **Brevo for transactional emails only**.

## Key Changes

### 1. **Smartlead Webhook Integration** ✅
- Created `/api/webhooks/smartlead/route.ts`
- Handles: sent, delivered, opened, clicked, bounced, replied, unsubscribed
- Records events in `smartlead_email_events` table
- Updates campaign metrics in real-time
- Stores replies in `campaign_replies` table

### 2. **Database Schema Updates** ✅

**New Tables**:
- `smartlead_email_events` - Tracks all campaign email events from Smartlead
- `campaign_replies` - Stores lead replies with sentiment analysis

**Renamed Tables**:
- `scheduled_emails` → `brevo_transactional_emails` (admin sends only)
- Updated `email_events` to reference `brevo_transactional_emails`

**Updated Tables**:
- `campaigns` - Added `replies_received`, clarified column usage
- `leads` - Need to add tracking columns (see migrations)

### 3. **Brevo Scope: ALL Non-Campaign Emails** ✅
- Updated webhook handler (`/api/webhooks/brevo/route.ts`)
- Handles ALL transactional emails:
  - User notifications (order confirmations, product updates, campaign status)
  - Admin notifications (alerts, new signups, high bounce rates, new replies)
  - System emails (password resets, welcome emails, email verification)
  - Test emails (admin sends to arbitrary addresses)
  - One-off communications (support, partnerships)
- All references updated to `brevo_transactional_emails`
- Clear separation: **Smartlead = marketing campaigns**, **Brevo = everything else**

### 4. **Database Migrations Created** ✅
- `20251120000003_create_smartlead_email_events.sql`
- `20251120000004_create_campaign_replies.sql`
- `20251120000005_update_campaigns_for_smartlead.sql`
- `20251120000006_rename_scheduled_emails_to_brevo_transactional.sql`

## Architecture

```
User Creates Campaign
        ↓
   Database (campaigns)
        ↓
   Smartlead API (create campaign)
        ↓
   Store smartlead_campaign_id
        ↓
Smartlead Sends Emails
        ↓
Smartlead Webhooks → /api/webhooks/smartlead
        ↓
Record in smartlead_email_events
        ↓
Update campaign metrics
        ↓
If reply → campaign_replies table


Admin Sends Test Email
        ↓
   Brevo API
        ↓
   brevo_transactional_emails table
        ↓
   Brevo Webhooks → /api/webhooks/brevo
        ↓
   Record in email_events
```

## UI Design (See SMARTLEAD_HEADLESS_ARCHITECTURE.md)

### Admin Needs:
1. **Campaign Overview Dashboard**
   - Active campaigns list
   - Real-time metrics
   - Quick pause/resume actions

2. **Campaign Detail Page**
   - Tabs: Overview, Leads, Replies, Analytics, Settings
   - Lead management (add/remove via Smartlead API)
   - Reply inbox with sentiment
   - Performance charts

3. **Reply Inbox**
   - Global view of all replies
   - Filter by sentiment
   - Mark as read/unread
   - Add admin notes

### User Needs:
1. **Campaigns Dashboard**
   - Campaign cards with metrics
   - Engagement charts
   - Activity feed

2. **Campaign Detail**
   - Performance metrics
   - Lead engagement breakdown
   - Reply summary

3. **Lead Insights**
   - Engagement levels
   - Individual lead timelines

## What You Need to Do

### 1. Run Database Migrations
```bash
cd /Users/therealjojo/PycharmProjects/pitchivo
supabase db push
```

### 2. Update Smartlead API Client
File: `apps/web/lib/smartlead/client.ts`

- Update `baseUrl` with actual Smartlead API URL
- Update authentication method (API key, OAuth, etc.)
- Update endpoint paths based on Smartlead API docs
- Test API calls

### 3. Configure Smartlead Webhook
In Smartlead dashboard:
- Add webhook URL: `https://yourdomain.com/api/webhooks/smartlead`
- Select events: sent, delivered, opened, clicked, bounced, replied, unsubscribed
- Add webhook secret (if available)

### 4. Update Environment Variables
```bash
# Add to .env.local and production
SMARTLEAD_API_KEY=your_smartlead_api_key
# Note: No webhook secret needed - Smartlead doesn't provide signatures

# Keep existing Brevo
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=info@pitchivo.com
BREVO_SENDER_NAME=Pitchivo
```

### 5. Build Admin UIs
See `SMARTLEAD_HEADLESS_ARCHITECTURE.md` for detailed designs:
- Campaign monitoring dashboard
- Reply inbox
- Analytics views

### 6. Build User UIs
See `SMARTLEAD_HEADLESS_ARCHITECTURE.md` for detailed designs:
- Campaign dashboard with Smartlead metrics
- Lead engagement insights
- Reply summaries

### 7. Test End-to-End
1. Create test campaign
2. Verify Smartlead campaign created
3. Add test leads
4. Send test emails through Smartlead
5. Verify webhooks received
6. Check data in `smartlead_email_events`
7. Reply to email (simulate)
8. Verify reply in `campaign_replies`

## Files Created/Modified

### Created:
- `apps/web/app/api/webhooks/smartlead/route.ts` - Smartlead webhook handler
- `apps/web/lib/constants/brevo-sender-domains.ts` - Brevo sender domains
- `apps/web/lib/smartlead/` - Smartlead client library
- `apps/web/app/api/smartlead/` - Smartlead API routes
- `supabase/migrations/20251120000003_*.sql` - smartlead_email_events table
- `supabase/migrations/20251120000004_*.sql` - campaign_replies table
- `supabase/migrations/20251120000005_*.sql` - Update campaigns table
- `supabase/migrations/20251120000006_*.sql` - Rename scheduled_emails
- `SMARTLEAD_HEADLESS_ARCHITECTURE.md` - Complete architecture doc

### Modified:
- `apps/web/app/api/webhooks/brevo/route.ts` - Updated for transactional only
- `apps/web/app/dashboard/campaigns/create/review/page.tsx` - Smartlead integration
- `apps/web/app/admin/campaigns/[campaignId]/settings/page.tsx` - Removed batch sending, added sender domain
- `apps/web/app/api/admin/campaigns/send/route.ts` - Added sender domain support
- `apps/web/lib/database.types.ts` - Added smartlead_campaign_id
- Disabled batch sending APIs (schedule, auto-schedule, send-scheduled)

## Database Columns to Update

### `leads` table (add these):
```sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS smartlead_lead_id TEXT,
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Update status values to include replied, bounced, unsubscribed
-- Current: active, contacted
-- Add: replied, bounced, unsubscribed
```

## Monitoring

### Key Metrics:
1. **Smartlead webhook success rate** - Should be > 99%
2. **Event processing time** - Should be < 500ms
3. **Campaign open rates** - Track trends
4. **Reply rates** - Track trends
5. **Unread replies** - Alert if > 24 hours old

### Logs to Watch:
- Smartlead webhook errors
- Campaign creation failures
- Lead sync errors
- Reply processing errors

## Breaking Changes

### Code Updates Needed:
1. Any code referencing `scheduled_emails` → Update to `brevo_transactional_emails`
2. Any code referencing `scheduled_email_id` → Update to `brevo_email_id`
3. Campaign metric updates now come from Smartlead webhooks, not Brevo
4. Email sending for campaigns happens in Smartlead, not our system

### Data Migration:
- Existing `scheduled_emails` data will be renamed to `brevo_transactional_emails`
- No data loss
- Old campaign emails (if any) will remain in `brevo_transactional_emails`
- New campaign emails go through Smartlead

## Benefits

✅ **Real-time tracking**: Smartlead webhooks provide instant updates  
✅ **Reply management**: Capture and manage lead replies  
✅ **Better deliverability**: Smartlead manages sender infrastructure  
✅ **Scalability**: Smartlead handles email sending infrastructure  
✅ **Separation of concerns**: Campaigns (Smartlead) vs Transactional (Brevo)  
✅ **Rich analytics**: Device, location, user agent data from Smartlead  
✅ **Sentiment analysis**: AI-powered reply classification  

## Questions Answered

1. ✅ **Smartlead API Authentication**: API key as query parameter `?api_key=yourApiKey`
2. ✅ **Smartlead Webhook Secret**: NO - Smartlead doesn't provide webhook signatures (see SMARTLEAD_WEBHOOK_SECURITY.md)
3. **Lead Sync**: Should we sync leads bidirectionally or push-only?
4. **Reply Responses**: How should admins respond to replies? (Via Smartlead UI or API?)
5. **Sentiment Analysis**: Should we use AI service or manual tagging?

## Next Steps Priority

1. **CRITICAL**: Run database migrations
2. **CRITICAL**: Update Smartlead API client with real endpoints
3. **CRITICAL**: Configure Smartlead webhook
4. **HIGH**: Test campaign creation flow
5. **HIGH**: Test webhook reception
6. **MEDIUM**: Build reply inbox UI
7. **MEDIUM**: Build admin monitoring dashboard
8. **LOW**: Build user campaign insights

---

**See `SMARTLEAD_HEADLESS_ARCHITECTURE.md` for complete UI designs and implementation details.**

