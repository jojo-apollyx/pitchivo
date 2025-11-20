# Final Clarifications: Smartlead + Brevo Architecture

## ✅ Clarifications Implemented

### 1. **"Transactional" = ALL Non-Campaign Emails**

**Updated Definition**:
- ✅ User notifications (orders, updates, alerts)
- ✅ Admin notifications (new signups, bounces, replies)
- ✅ System emails (password resets, welcome, verification)
- ✅ Test emails (admin sends)
- ✅ Support & one-off communications

**NOT just** admin test sends - **ALL emails that aren't marketing campaigns**.

### 2. **Campaign Mapping: Our DB ↔ Smartlead**

**Bidirectional Mapping Maintained**:
```
Our Database:
  campaigns.campaign_id (UUID) ← Primary key
  campaigns.smartlead_campaign_id (TEXT) ← Smartlead's ID

Smartlead:
  campaign_id: "smartlead_camp_123"

Webhook Events Include Both:
  smartlead_email_events.campaign_id ← Our UUID
  smartlead_email_events.smartlead_campaign_id ← Smartlead's ID
```

**How It Works**:
1. User creates campaign → `campaign_id` generated
2. Campaign sent to Smartlead API → `smartlead_campaign_id` returned
3. Both IDs stored in our `campaigns` table
4. Smartlead webhook arrives with `smartlead_campaign_id`
5. We lookup our `campaign_id` using `smartlead_campaign_id`
6. Event stored with our `campaign_id`
7. UI queries using our `campaign_id`

### 3. **Email History Display in UI**

**Source**: `smartlead_email_events` table (populated by webhooks)

**What's Displayed**:
```tsx
// Campaign Activity Feed
<ActivityFeed>
  {events.map(event => (
    <ActivityItem
      icon={getIcon(event.event_type)}  // 📧 ✉️ 🔗 💬
      message={`${event.lead_email} ${getAction(event.event_type)}`}
      timestamp={event.event_timestamp}
      metadata={event.metadata}
    />
  ))}
</ActivityFeed>

// Examples:
// "john@acme.com replied" - 2 minutes ago
// "sarah@tech.com clicked link" - 5 minutes ago
// "mike@industrial.com opened email" - 12 minutes ago
```

**Full Event Types Tracked**:
- ✅ `sent` - Email sent by Smartlead
- ✅ `delivered` - Email delivered to inbox
- ✅ `opened` - Lead opened email
- ✅ `clicked` - Lead clicked link
- ✅ `replied` - Lead replied (stored in `campaign_replies`)
- ✅ `bounced` - Email bounced
- ✅ `unsubscribed` - Lead unsubscribed

**Metadata Captured**:
- Device (Mobile, Desktop, Tablet)
- Location (Country, City)
- User Agent (Browser, Email Client)
- Links Clicked
- Reply Text & Subject

---

## Database Schema Final State

### Campaign Emails (Smartlead)

```sql
-- Events from Smartlead webhooks
CREATE TABLE smartlead_email_events (
  event_id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(campaign_id),  -- OUR campaign ID
  smartlead_campaign_id TEXT,  -- Smartlead's campaign ID
  lead_email TEXT,
  event_type TEXT,
  event_timestamp TIMESTAMPTZ,
  metadata JSONB
);

-- Replies from leads
CREATE TABLE campaign_replies (
  reply_id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(campaign_id),
  lead_email TEXT,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  sentiment TEXT
);

-- Campaign table with mapping
CREATE TABLE campaigns (
  campaign_id UUID PRIMARY KEY,  -- OUR ID
  smartlead_campaign_id TEXT,  -- Smartlead's ID
  campaign_name TEXT,
  emails_sent INTEGER,  -- Updated by Smartlead webhooks
  emails_opened INTEGER,  -- Updated by Smartlead webhooks
  replies_received INTEGER  -- Updated by Smartlead webhooks
);
```

### Transactional Emails (Brevo)

```sql
-- Transactional emails (ALL non-campaign)
CREATE TABLE brevo_transactional_emails (
  brevo_email_id UUID PRIMARY KEY,
  recipient_email TEXT,
  subject TEXT,
  brevo_message_id TEXT,
  brevo_status TEXT,
  email_type TEXT,  -- 'user_notification', 'admin_alert', 'system', 'test'
  metadata JSONB
);

-- Brevo email events
CREATE TABLE email_events (
  event_id UUID PRIMARY KEY,
  brevo_email_id UUID REFERENCES brevo_transactional_emails(brevo_email_id),
  event_type TEXT,
  event_timestamp TIMESTAMPTZ
);
```

---

## UI Data Flow Examples

### Campaign Dashboard

**Query**:
```sql
-- Get campaign with Smartlead data
SELECT 
  c.campaign_id,
  c.campaign_name,
  c.smartlead_campaign_id,
  c.emails_sent,
  c.emails_opened,
  c.replies_received,
  (c.emails_opened::float / NULLIF(c.emails_sent, 0) * 100) as open_rate,
  COUNT(DISTINCT e.event_id) FILTER (WHERE e.event_type = 'clicked') as total_clicks
FROM campaigns c
LEFT JOIN smartlead_email_events e ON e.campaign_id = c.campaign_id
WHERE c.campaign_id = :campaign_id
GROUP BY c.campaign_id;
```

**UI Component**:
```tsx
<CampaignCard
  name={campaign.campaign_name}
  status="Active"
  metrics={{
    sent: campaign.emails_sent,
    opened: campaign.emails_opened,
    openRate: campaign.open_rate,
    replies: campaign.replies_received
  }}
  smartleadId={campaign.smartlead_campaign_id}
/>
```

### Campaign Activity Timeline

**Query**:
```sql
-- Get recent events for timeline
SELECT 
  event_id,
  lead_email,
  event_type,
  event_timestamp,
  metadata->>'device' as device,
  metadata->>'location' as location
FROM smartlead_email_events
WHERE campaign_id = :campaign_id
ORDER BY event_timestamp DESC
LIMIT 50;
```

**UI Component**:
```tsx
<Timeline>
  {events.map(event => (
    <TimelineItem
      icon={<Icon type={event.event_type} />}
      title={`${event.lead_email} ${getAction(event.event_type)}`}
      timestamp={event.event_timestamp}
      metadata={{
        device: event.device,
        location: event.location
      }}
    />
  ))}
</Timeline>
```

### Lead Email History

**Query**:
```sql
-- Get all events for specific lead
SELECT 
  event_type,
  event_timestamp,
  metadata
FROM smartlead_email_events
WHERE campaign_id = :campaign_id
  AND lead_email = :lead_email
ORDER BY event_timestamp ASC;
```

**UI Component**:
```tsx
<LeadTimeline email={leadEmail}>
  {events.map(event => (
    <Event
      type={event.event_type}
      timestamp={event.event_timestamp}
      details={event.metadata}
    />
  ))}
</LeadTimeline>

// Example output:
// ✅ Email sent - Nov 20, 10:00 AM
// ✉️ Email opened - Nov 20, 10:15 AM (Desktop, United States)
// 🔗 Link clicked - Nov 20, 10:16 AM (Product page)
// 💬 Replied - Nov 20, 10:30 AM "Interested in bulk pricing..."
```

### Reply Inbox

**Query**:
```sql
-- Get all replies across campaigns
SELECT 
  r.reply_id,
  r.lead_email,
  r.reply_text,
  r.replied_at,
  r.sentiment,
  r.is_read,
  c.campaign_name,
  c.campaign_id
FROM campaign_replies r
JOIN campaigns c ON c.campaign_id = r.campaign_id
WHERE r.is_read = false
ORDER BY r.replied_at DESC;
```

**UI Component**:
```tsx
<ReplyInbox>
  {replies.map(reply => (
    <ReplyCard
      from={reply.lead_email}
      message={reply.reply_text}
      timestamp={reply.replied_at}
      campaign={reply.campaign_name}
      sentiment={reply.sentiment}
      isRead={reply.is_read}
      onMarkRead={() => markAsRead(reply.reply_id)}
    />
  ))}
</ReplyInbox>
```

---

## Webhook Processing Flow

### Smartlead Webhook → Database → UI

```
1. Lead opens email in Smartlead campaign
   ↓
2. Smartlead sends webhook event
   POST /api/webhooks/smartlead
   {
     "event_type": "opened",
     "campaign_id": "smartlead_camp_123",  ← Smartlead's ID
     "lead_email": "john@acme.com",
     "timestamp": "2025-11-20T10:30:00Z",
     "metadata": {
       "device": "Desktop",
       "location": "United States"
     }
   }
   ↓
3. Webhook handler processes
   - Lookup: campaigns WHERE smartlead_campaign_id = 'smartlead_camp_123'
   - Find: campaigns.campaign_id = 'uuid-123'  ← Our ID
   - Insert into smartlead_email_events:
     {
       campaign_id: 'uuid-123',  ← Our ID
       smartlead_campaign_id: 'smartlead_camp_123',
       lead_email: 'john@acme.com',
       event_type: 'opened',
       event_timestamp: '2025-11-20T10:30:00Z',
       metadata: { device: 'Desktop', location: 'United States' }
     }
   - Update: campaigns.emails_opened += 1
   ↓
4. UI fetches updated data
   SELECT * FROM smartlead_email_events
   WHERE campaign_id = 'uuid-123'
   ORDER BY event_timestamp DESC;
   ↓
5. Activity feed updates in real-time
   "john@acme.com opened email - just now"
```

---

## Example: Complete Campaign Journey

### Step 1: Create Campaign
```typescript
// User creates campaign in UI
const campaign = await createCampaign({
  name: 'Q4 Chemical Sale',
  product_id: 'prod-123'
});
// campaign_id = 'campaign-uuid-123'

// Sync to Smartlead
const smartleadResult = await createSmartleadCampaign({
  campaign_id: 'campaign-uuid-123',
  campaign_name: 'Q4 Chemical Sale'
});
// smartlead_campaign_id = 'smartlead_camp_456'

// Update database
await updateCampaign('campaign-uuid-123', {
  smartlead_campaign_id: 'smartlead_camp_456'
});
```

### Step 2: Add Leads
```typescript
// Add leads to Smartlead
await addLeadsToSmartlead('smartlead_camp_456', [
  { email: 'john@acme.com', first_name: 'John', company: 'Acme' }
]);

// Also stored in our database
await insertLeads('campaign-uuid-123', [
  { email: 'john@acme.com', name: 'John Smith', company: 'Acme' }
]);
```

### Step 3: Smartlead Sends Emails
(Automatic - handled by Smartlead)

### Step 4: Webhooks Update Our Database
```typescript
// Smartlead webhook: email sent
→ smartlead_email_events: { campaign_id: 'campaign-uuid-123', event_type: 'sent' }
→ campaigns: emails_sent += 1

// Smartlead webhook: email opened
→ smartlead_email_events: { campaign_id: 'campaign-uuid-123', event_type: 'opened' }
→ campaigns: emails_opened += 1

// Smartlead webhook: lead replied
→ smartlead_email_events: { campaign_id: 'campaign-uuid-123', event_type: 'replied' }
→ campaign_replies: { campaign_id: 'campaign-uuid-123', reply_text: '...' }
→ campaigns: replies_received += 1
```

### Step 5: UI Displays Everything
```typescript
// User views campaign dashboard
const events = await getEmailEvents('campaign-uuid-123');
const replies = await getReplies('campaign-uuid-123');
const metrics = await getCampaignMetrics('campaign-uuid-123');

// All data comes from OUR database
// UI shows:
// - Email activity timeline
// - Reply inbox
// - Engagement metrics
// - Lead breakdown
```

---

## Transactional Email Examples

### User Notification: Product Approved
```typescript
await sendBrevoEmail({
  to: user.email,
  subject: 'Your product has been approved!',
  template: 'product_approved',
  params: {
    product_name: 'Sodium Chloride',
    product_url: 'https://...'
  }
});

// Stored in: brevo_transactional_emails
// Type: 'user_notification'
```

### Admin Alert: New Reply
```typescript
await sendBrevoEmail({
  to: 'admin@pitchivo.com',
  subject: '💬 New Reply in Campaign',
  template: 'admin_new_reply',
  params: {
    lead_email: 'john@acme.com',
    campaign_name: 'Q4 Sale',
    reply_preview: 'Interested in pricing...'
  }
});

// Stored in: brevo_transactional_emails
// Type: 'admin_alert'
```

### System Email: Password Reset
```typescript
await sendBrevoEmail({
  to: user.email,
  subject: 'Reset your password',
  template: 'password_reset',
  params: {
    reset_url: resetUrl
  }
});

// Stored in: brevo_transactional_emails
// Type: 'system'
```

---

## Summary

### ✅ What's Clarified:

1. **"Transactional" = ALL non-campaign emails**
   - User notifications
   - Admin alerts
   - System emails
   - Test sends
   - Support communications

2. **Campaign mapping is bidirectional**
   - `campaign_id` (ours) ↔ `smartlead_campaign_id` (Smartlead's)
   - Webhooks include both IDs
   - UI always uses our `campaign_id`

3. **Email history is fully captured**
   - All events stored in `smartlead_email_events`
   - Queryable by campaign, lead, date, event type
   - Full metadata (device, location, links)
   - Displayed in UI activity feeds

4. **UI components can display everything**
   - Campaign metrics (from `campaigns` table)
   - Email events (from `smartlead_email_events`)
   - Replies (from `campaign_replies`)
   - Lead engagement (aggregated from events)

---

**Result**: Complete control over campaign data and UI display, while Smartlead handles email infrastructure. All email history is preserved in our database and accessible for UI display.

## See Also

- **`EMAIL_ROUTING_GUIDE.md`** - Detailed guide on when to use Smartlead vs Brevo
- **`CAMPAIGN_UI_DATA_MAPPING.md`** - Complete UI query examples
- **`SMARTLEAD_HEADLESS_ARCHITECTURE.md`** - Full architecture documentation

