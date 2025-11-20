# Campaign UI Data Mapping

## Overview
This document explains how campaign data is mapped from Smartlead to our UI, ensuring proper display of campaign history, email status, and events.

---

## Campaign Mapping

### Our Database → Smartlead
```
campaigns.campaign_id (UUID) → campaigns.smartlead_campaign_id (TEXT)
```

**Flow**:
1. User creates campaign in our UI
2. Campaign record created in our database with unique `campaign_id`
3. Campaign created in Smartlead via API
4. Smartlead returns `smartlead_campaign_id`
5. We store `smartlead_campaign_id` in our campaigns table
6. Future lookups use `smartlead_campaign_id` to fetch from Smartlead

### Bidirectional Lookup
```sql
-- Find our campaign from Smartlead webhook
SELECT campaign_id, org_id, campaign_name
FROM campaigns
WHERE smartlead_campaign_id = 'smartlead_camp_123';

-- Find Smartlead campaign from our UI
SELECT smartlead_campaign_id
FROM campaigns
WHERE campaign_id = 'uuid-123';
```

---

## Email Event History Display

### Data Source: `smartlead_email_events` table

**Table Structure**:
```sql
smartlead_email_events (
  event_id UUID,
  campaign_id UUID,  -- OUR campaign ID
  lead_id UUID,
  smartlead_campaign_id TEXT,
  smartlead_lead_id TEXT,
  lead_email TEXT,
  event_type TEXT,  -- sent, delivered, opened, clicked, bounced, replied
  event_timestamp TIMESTAMPTZ,
  metadata JSONB  -- device, location, user_agent, link, etc.
)
```

### UI Query for Campaign Email History
```sql
-- Get all email events for a campaign
SELECT 
  event_id,
  lead_email,
  event_type,
  event_timestamp,
  metadata->>'user_agent' as device,
  metadata->>'location' as location,
  metadata->>'link' as clicked_link
FROM smartlead_email_events
WHERE campaign_id = :our_campaign_id
ORDER BY event_timestamp DESC
LIMIT 100;
```

### UI Query for Specific Lead Email History
```sql
-- Get email history for a specific lead
SELECT 
  event_type,
  event_timestamp,
  metadata
FROM smartlead_email_events
WHERE campaign_id = :our_campaign_id
  AND lead_email = :lead_email
ORDER BY event_timestamp DESC;
```

---

## Campaign Status Display

### Real-time Metrics from `campaigns` table

Updated by Smartlead webhooks:
```sql
SELECT 
  campaign_id,
  campaign_name,
  status,
  emails_sent,
  emails_delivered,
  emails_opened,
  emails_clicked,
  emails_bounced,
  replies_received,
  (emails_opened::float / NULLIF(emails_delivered, 0) * 100) as open_rate,
  (emails_clicked::float / NULLIF(emails_delivered, 0) * 100) as click_rate,
  (replies_received::float / NULLIF(emails_sent, 0) * 100) as reply_rate
FROM campaigns
WHERE campaign_id = :our_campaign_id;
```

---

## Email Status Timeline (UI Component)

### Component: Campaign Email Activity Feed

**Data Query**:
```typescript
// Get recent activity for campaign
const { data: events } = await supabase
  .from('smartlead_email_events')
  .select('event_id, lead_email, event_type, event_timestamp, metadata')
  .eq('campaign_id', campaignId)
  .order('event_timestamp', { ascending: false })
  .limit(50);

// Display timeline
events.map(event => ({
  icon: getEventIcon(event.event_type), // 📧 sent, ✉️ opened, 🔗 clicked, 💬 replied
  message: `${event.lead_email} ${getEventAction(event.event_type)}`,
  timestamp: event.event_timestamp,
  metadata: event.metadata
}));
```

**Event Type Icons**:
```typescript
function getEventIcon(eventType: string) {
  switch(eventType) {
    case 'sent': return '📧';
    case 'delivered': return '✅';
    case 'opened': return '✉️';
    case 'clicked': return '🔗';
    case 'replied': return '💬';
    case 'bounced': return '❌';
    case 'unsubscribed': return '🚫';
    default: return '📄';
  }
}

function getEventAction(eventType: string) {
  switch(eventType) {
    case 'sent': return 'was sent an email';
    case 'delivered': return 'received email';
    case 'opened': return 'opened email';
    case 'clicked': return 'clicked link';
    case 'replied': return 'replied';
    case 'bounced': return 'email bounced';
    case 'unsubscribed': return 'unsubscribed';
    default: return eventType;
  }
}
```

---

## Lead Status Display

### Data Source: `leads` + `smartlead_email_events`

**Query for Lead Details**:
```sql
SELECT 
  l.lead_id,
  l.email,
  l.name,
  l.company,
  l.status,
  l.last_email_sent_at,
  l.last_opened_at,
  l.last_clicked_at,
  l.last_replied_at,
  -- Count events
  COUNT(DISTINCT CASE WHEN e.event_type = 'opened' THEN e.event_id END) as total_opens,
  COUNT(DISTINCT CASE WHEN e.event_type = 'clicked' THEN e.event_id END) as total_clicks,
  -- Latest activity
  MAX(e.event_timestamp) as last_activity
FROM leads l
LEFT JOIN smartlead_email_events e ON e.lead_id = l.lead_id
WHERE l.campaign_id = :our_campaign_id
GROUP BY l.lead_id
ORDER BY last_activity DESC NULLS LAST;
```

**UI Display**:
```tsx
<LeadCard
  email={lead.email}
  status={lead.status} // active, replied, bounced, unsubscribed
  engagement={{
    opens: lead.total_opens,
    clicks: lead.total_clicks,
    lastActivity: lead.last_activity
  }}
  statusBadge={<StatusBadge status={lead.status} />}
/>
```

---

## Campaign Analytics Display

### Engagement Over Time

**Query**:
```sql
-- Get daily email events for chart
SELECT 
  DATE(event_timestamp) as date,
  event_type,
  COUNT(*) as count
FROM smartlead_email_events
WHERE campaign_id = :our_campaign_id
  AND event_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(event_timestamp), event_type
ORDER BY date, event_type;
```

**UI Chart**:
```typescript
// Transform for chart
const chartData = events.reduce((acc, event) => {
  const date = event.date;
  if (!acc[date]) acc[date] = { date, sent: 0, opened: 0, clicked: 0, replied: 0 };
  acc[date][event.event_type] = event.count;
  return acc;
}, {});

// Display as line/area chart
<AreaChart data={Object.values(chartData)}>
  <Area dataKey="sent" fill="#3b82f6" />
  <Area dataKey="opened" fill="#10b981" />
  <Area dataKey="clicked" fill="#f59e0b" />
  <Area dataKey="replied" fill="#8b5cf6" />
</AreaChart>
```

---

## Reply Display

### Data Source: `campaign_replies` table

**Query for Reply Inbox**:
```sql
SELECT 
  r.reply_id,
  r.lead_email,
  r.reply_subject,
  r.reply_text,
  r.replied_at,
  r.sentiment,
  r.is_read,
  r.admin_notes,
  c.campaign_name,
  l.name as lead_name,
  l.company as lead_company
FROM campaign_replies r
JOIN campaigns c ON c.campaign_id = r.campaign_id
LEFT JOIN leads l ON l.lead_id = r.lead_id
WHERE r.campaign_id = :our_campaign_id
  OR :show_all_campaigns = true
ORDER BY r.is_read ASC, r.replied_at DESC;
```

**UI Display**:
```tsx
<ReplyCard
  from={reply.lead_email}
  subject={reply.reply_subject}
  message={reply.reply_text}
  timestamp={reply.replied_at}
  sentiment={reply.sentiment}
  isRead={reply.is_read}
  campaign={reply.campaign_name}
  onMarkRead={() => markAsRead(reply.reply_id)}
/>
```

---

## Device & Location Analytics

### Data Source: `metadata` field in `smartlead_email_events`

**Query for Device Breakdown**:
```sql
SELECT 
  metadata->>'device' as device,
  COUNT(*) as count
FROM smartlead_email_events
WHERE campaign_id = :our_campaign_id
  AND event_type = 'opened'
  AND metadata->>'device' IS NOT NULL
GROUP BY metadata->>'device'
ORDER BY count DESC;
```

**Query for Location Breakdown**:
```sql
SELECT 
  metadata->>'location' as location,
  COUNT(*) as count
FROM smartlead_email_events
WHERE campaign_id = :our_campaign_id
  AND event_type = 'opened'
  AND metadata->>'location' IS NOT NULL
GROUP BY metadata->>'location'
ORDER BY count DESC
LIMIT 10;
```

---

## Admin Campaign Monitoring

### Real-time Dashboard Query

```sql
-- Get all active campaigns with latest stats
SELECT 
  c.campaign_id,
  c.campaign_name,
  c.status,
  c.smartlead_campaign_id,
  c.emails_sent,
  c.emails_delivered,
  c.emails_opened,
  c.emails_clicked,
  c.replies_received,
  c.created_at,
  c.launched_at,
  -- Latest activity
  (SELECT MAX(event_timestamp) 
   FROM smartlead_email_events 
   WHERE campaign_id = c.campaign_id) as last_activity,
  -- Unread replies count
  (SELECT COUNT(*) 
   FROM campaign_replies 
   WHERE campaign_id = c.campaign_id AND is_read = false) as unread_replies
FROM campaigns c
WHERE c.status IN ('active', 'scheduled', 'paused')
ORDER BY last_activity DESC NULLS LAST;
```

---

## User Campaign Dashboard

### User-Facing Campaign List

```sql
-- Get campaigns for user's organization
SELECT 
  c.campaign_id,
  c.campaign_name,
  c.status,
  c.emails_sent,
  c.emails_opened,
  c.replies_received,
  c.launched_at,
  p.product_name,
  -- Calculate rates
  (c.emails_opened::float / NULLIF(c.emails_delivered, 0) * 100) as open_rate,
  (c.replies_received::float / NULLIF(c.emails_sent, 0) * 100) as reply_rate,
  -- Latest activity timestamp
  (SELECT MAX(event_timestamp) 
   FROM smartlead_email_events 
   WHERE campaign_id = c.campaign_id) as last_activity
FROM campaigns c
JOIN products p ON p.product_id = c.product_id
JOIN user_profiles u ON u.organization_id = c.org_id
WHERE u.id = :user_id
ORDER BY c.launched_at DESC;
```

---

## API Response Examples

### GET /api/campaigns/:id/events

```json
{
  "campaign_id": "uuid-123",
  "campaign_name": "Q4 Chemical Sale",
  "smartlead_campaign_id": "smartlead_123",
  "events": [
    {
      "event_id": "evt-001",
      "lead_email": "john@acme.com",
      "event_type": "replied",
      "event_timestamp": "2025-11-20T10:30:00Z",
      "metadata": {
        "reply_text": "Interested in pricing...",
        "device": "Desktop",
        "location": "United States"
      }
    },
    {
      "event_id": "evt-002",
      "lead_email": "sarah@tech.com",
      "event_type": "clicked",
      "event_timestamp": "2025-11-20T10:25:00Z",
      "metadata": {
        "link": "https://pitchivo.com/product/123",
        "device": "Mobile",
        "location": "Canada"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 2456
  }
}
```

### GET /api/campaigns/:id/analytics

```json
{
  "campaign_id": "uuid-123",
  "smartlead_campaign_id": "smartlead_123",
  "metrics": {
    "emails_sent": 2456,
    "emails_delivered": 2401,
    "emails_opened": 1567,
    "emails_clicked": 234,
    "replies_received": 89,
    "emails_bounced": 55,
    "unsubscribed": 12
  },
  "rates": {
    "delivery_rate": 97.8,
    "open_rate": 65.2,
    "click_rate": 9.7,
    "reply_rate": 3.7,
    "bounce_rate": 2.2
  },
  "timeline": [
    {
      "date": "2025-11-20",
      "sent": 150,
      "delivered": 147,
      "opened": 98,
      "clicked": 15,
      "replied": 6
    }
  ],
  "devices": {
    "mobile": 45,
    "desktop": 50,
    "tablet": 5
  },
  "locations": {
    "United States": 678,
    "Canada": 234,
    "United Kingdom": 123
  }
}
```

---

## Webhook Event Processing Flow

### Smartlead Webhook → Database → UI

```
1. Smartlead sends webhook event
   POST /api/webhooks/smartlead
   {
     "event_type": "opened",
     "campaign_id": "smartlead_123",
     "lead_email": "john@acme.com",
     "timestamp": "2025-11-20T10:30:00Z"
   }

2. Webhook handler processes event
   - Lookup: campaigns.smartlead_campaign_id = "smartlead_123"
   - Find: campaigns.campaign_id = "uuid-123"
   - Insert: smartlead_email_events with campaign_id = "uuid-123"
   - Update: campaigns.emails_opened += 1

3. UI queries updated data
   SELECT * FROM smartlead_email_events 
   WHERE campaign_id = "uuid-123"
   ORDER BY event_timestamp DESC;

4. UI displays in real-time
   - Activity feed updated
   - Metrics updated
   - Charts updated
```

---

## Summary

### ✅ Campaign Mapping
- `campaign_id` (our UUID) ↔ `smartlead_campaign_id` (Smartlead's ID)
- Bidirectional lookup via campaigns table
- All webhook events include both IDs

### ✅ Email History Display
- Source: `smartlead_email_events` table
- Queryable by campaign, lead, email, date range
- Includes full metadata (device, location, links)

### ✅ Campaign Status Display
- Source: `campaigns` table metrics
- Updated in real-time by webhooks
- Calculated rates (open rate, reply rate, etc.)

### ✅ Reply Management
- Source: `campaign_replies` table
- Linked to campaigns and leads
- Sentiment analysis, read status, admin notes

### ✅ Analytics
- Aggregated from `smartlead_email_events`
- Time series data for charts
- Device and location breakdowns
- Engagement metrics

---

All campaign data flows through our database, ensuring complete control over UI display while Smartlead handles email infrastructure.

