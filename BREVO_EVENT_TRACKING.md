# Brevo Email Event Tracking Implementation

## Overview
Comprehensive tracking of all Brevo email events with admin/user role-based visibility and detailed tooltips for each status.

## ✅ Features Implemented

### 1. Complete Event Tracking
All Brevo webhook events are now tracked:

#### Primary Events (shown to users)
- ✅ **Sent** - Email successfully sent from server
- ✅ **Delivered** - Email accepted by recipient's server
- ✅ **Opened** - Recipient opened the email
- ✅ **Clicked** - Recipient clicked a link

#### Bounce Events
- ⚠️ **Soft Bounced** - Temporary delivery failure (admin only)
- ❌ **Hard Bounced** - Permanent failure (shown to users)
- 🚫 **Blocked** - Blocked by spam filter (shown to users)
- ⚠️ **Invalid Email** - Malformed address (admin only)

#### Engagement Events (admin only)
- 🎯 **Unique Opened** - First open per recipient
- 🥇 **First Opening** - Very first open timing
- 🔒 **Loaded by Proxy** - Privacy proxy (Apple Mail etc.)

#### Negative Events (shown to users)
- 🚨 **Spam Complaint** - Marked as spam
- 📭 **Unsubscribed** - Clicked unsubscribe

#### System Events (admin only)
- ⏳ **Deferred** - Temporarily delayed
- ❗ **Error** - Processing error

### 2. Role-Based Visibility

#### Users See (Best Practice - 9 statuses):
- Sent
- Delivered
- Opened
- Clicked
- Hard Bounced
- Blocked
- Spam Complaint
- Unsubscribed

#### Admins See (All - 15 statuses):
- All user statuses +
- Soft Bounced
- Invalid Email
- Unique Opened
- First Opening
- Loaded by Proxy
- Deferred
- Error

### 3. Interactive UI Components

#### EmailStatusBadge
- Colored badges with icons
- Hover tooltips with detailed descriptions
- Category-based coloring (success/warning/error/info)
- Responsive sizing (sm/md/lg)

#### EmailEventStats
- Grid display of all event counts
- Role-based filtering
- Summary statistics:
  - Success Rate (delivered/sent)
  - Engagement Rate (opened/delivered)
  - Bounce Rate (bounces/sent)
  - Issue Rate (complaints+blocked/delivered)

#### EmailStatusGroup
- Display multiple status badges
- Show counts for repeated events
- Collapse extra statuses ("+N more")

## 📊 Database Schema

### Updated Tables

#### campaign_activities
```sql
-- New event types added:
'email_delivered'
'email_soft_bounced'
'email_hard_bounced'
'email_blocked'
'email_invalid'
'email_unique_opened'
'email_first_opening'
'email_loaded_by_proxy'
'email_complaint'
'email_unsubscribed'
'email_deferred'
'email_error'
```

#### campaigns (new columns)
```sql
emails_unique_opened INTEGER DEFAULT 0
emails_soft_bounced INTEGER DEFAULT 0
emails_hard_bounced INTEGER DEFAULT 0
emails_blocked INTEGER DEFAULT 0
emails_invalid INTEGER DEFAULT 0
emails_complaint INTEGER DEFAULT 0
emails_unsubscribed INTEGER DEFAULT 0
```

### Materialized View
```sql
campaign_email_event_summary
-- Quick access to event counts per campaign
-- Refresh with: SELECT refresh_campaign_email_summary()
```

## 🔗 API Endpoints

### Webhook Handler
```
POST /api/webhooks/brevo
```
- Receives all Brevo events
- Maps events to our types
- Updates database and metrics
- Handles special events (complaints, unsubscribes)

### Email Statistics
```
GET /api/campaigns/[campaignId]/email-stats
```
- Returns all event counts
- Used by EmailEventStats component
- Merges campaign-level and activity-level data

## 🎨 Component Usage

### EmailStatusBadge
```tsx
import { EmailStatusBadge } from '@/components/email/email-status-badge'
import { EMAIL_EVENT_TYPES } from '@/lib/constants/email-events'

<EmailStatusBadge 
  eventType={EMAIL_EVENT_TYPES.DELIVERED}
  showIcon={true}
  size="md"
/>
```

### EmailEventStats
```tsx
import { EmailEventStats } from '@/components/email/email-event-stats'

// User view (common statuses only)
<EmailEventStats campaignId={campaignId} isAdmin={false} />

// Admin view (all statuses)
<EmailEventStats campaignId={campaignId} isAdmin={true} />
```

### EmailStatusGroup
```tsx
import { EmailStatusGroup } from '@/components/email/email-status-badge'

<EmailStatusGroup
  events={[
    { eventType: 'delivered', count: 1 },
    { eventType: 'opened', count: 3 },
    { eventType: 'clicked', count: 1 }
  ]}
  maxVisible={5}
  showIcon={true}
  size="sm"
/>
```

## 🔧 Configuration

### Event Definitions
File: `/apps/web/lib/constants/email-events.ts`

Each event has:
- **label**: Display name
- **description**: Tooltip text
- **category**: Color coding (success/warning/error/info)
- **icon**: Emoji icon
- **isCommonForUser**: Show to regular users
- **priority**: Sort order

### Brevo Event Mapping
```typescript
BREVO_EVENT_MAP = {
  'request': 'sent',
  'delivered': 'delivered',
  'opened': 'opened',
  'click': 'clicked',
  'soft_bounce': 'soft_bounced',
  'hard_bounce': 'hard_bounced',
  // ... etc
}
```

## 📍 Integration Points

### Admin Campaign Page
File: `/apps/web/app/admin/campaigns/page.tsx`
- Shows **all** email event statuses
- Detailed breakdown with counts
- Summary statistics

### User Campaign Page
File: `/apps/web/app/dashboard/campaigns/[campaignId]/page.tsx`
- Shows **common** email event statuses only
- Simplified view focusing on key metrics
- Success/engagement rates

## 🎯 Event Categories & Colors

| Category | Color | Events |
|----------|-------|--------|
| Success | Green | Delivered, Opened, Clicked |
| Warning | Yellow | Soft Bounced, Unsubscribed, Deferred |
| Error | Red | Hard Bounced, Blocked, Complaint, Invalid, Error |
| Info | Blue | Sent, Unique Opened, First Opening, Loaded by Proxy |

## 📈 Metrics Calculated

### Success Rate
```
(Delivered / Sent) × 100%
```

### Engagement Rate
```
(Opened / Delivered) × 100%
```

### Bounce Rate
```
((Soft Bounced + Hard Bounced) / Sent) × 100%
```

### Issue Rate
```
((Complaints + Blocked + Invalid) / Delivered) × 100%
```

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
npx supabase db push
```

### 2. Configure Brevo Webhook
In Brevo Dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/brevo`
3. Enable all event types
4. Include tags in webhooks

### 3. Test Webhook
```bash
curl -X POST https://yourdomain.com/api/webhooks/brevo \
  -H "Content-Type: application/json" \
  -d '{
    "event": "delivered",
    "email": "test@example.com",
    "message-id": "test-123",
    "tags": ["campaign_your-campaign-id"]
  }'
```

## 🧪 Testing

### Test Each Event Type
```typescript
const testEvents = [
  'sent', 'delivered', 'opened', 'clicked',
  'soft_bounced', 'hard_bounced', 'blocked',
  'complaint', 'unsubscribed'
]

testEvents.forEach(event => {
  // Send test webhook with each event type
  // Verify it appears in UI with correct status
  // Check tooltip shows correct description
})
```

### Verify Role-Based Visibility
- Log in as regular user → see 9 common statuses
- Log in as admin → see all 15 statuses
- Hover over each status → tooltip appears

## 📝 Event Descriptions (Tooltips)

All descriptions are user-friendly and explain:
1. What the event means
2. Why it occurred
3. What action (if any) is needed

Example:
> **Hard Bounced**: Email permanently bounced because the email address doesn't exist or the domain is invalid. Email will not be retried.

## 🔒 Security

- Webhook endpoint is public (required by Brevo)
- Campaign access verified via RLS policies
- Admin-only events hidden from regular users
- Service role used for webhook writes

## 📚 References

- **Brevo Webhooks**: https://developers.brevo.com/docs/webhooks-events
- **Email Best Practices**: Industry standards for deliverability
- **Event Categories**: Based on email service provider conventions

## 🎉 Benefits

### For Users
- ✅ Clear understanding of email performance
- ✅ Focus on actionable metrics
- ✅ Easy-to-understand status indicators
- ✅ Hover tooltips explain everything

### For Admins
- ✅ Complete visibility into all events
- ✅ Debug delivery issues
- ✅ Identify spam filter problems
- ✅ Track detailed engagement metrics
- ✅ Monitor sender reputation

## 🔄 Future Enhancements

1. **Real-time Updates**
   - WebSocket connection for live event streaming
   - Toast notifications for important events

2. **Event Timeline**
   - Visual timeline of events per recipient
   - Show event flow: sent → delivered → opened → clicked

3. **Alerts**
   - High bounce rate warnings
   - Spam complaint notifications
   - Deliverability issue alerts

4. **Analytics**
   - Event trends over time
   - Best sending times based on open rates
   - A/B testing based on event data

---

**Status**: ✅ Production Ready
**Last Updated**: 2024

