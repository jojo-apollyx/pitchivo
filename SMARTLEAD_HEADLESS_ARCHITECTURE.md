# Smartlead Headless Architecture - Complete Design

## Overview

This document outlines the complete architecture for using Smartlead as a headless campaign management system with Brevo for transactional emails only.

## Architecture Principles

1. **Smartlead** = Campaign emails (headless API)
   - Campaign creation via API
   - Lead management via API
   - Email sending via Smartlead's infrastructure
   - Email tracking via Smartlead webhooks
   - Reply management via Smartlead webhooks

2. **Brevo** = Transactional emails ONLY
   - Admin sends to arbitrary email addresses
   - Test emails
   - Delivery tracking via Brevo webhooks

3. **UI Layer** = Custom dashboard
   - Admin monitoring and management
   - User metrics and insights
   - Reply inbox
   - All data from Smartlead webhooks

---

## Database Schema

### New Tables

#### `smartlead_email_events`
Tracks all campaign email events from Smartlead webhooks.

```sql
- event_id (UUID, PK)
- campaign_id (UUID, FK → campaigns)
- lead_id (UUID, FK → leads)
- smartlead_campaign_id (TEXT)
- smartlead_lead_id (TEXT)
- lead_email (TEXT)
- event_type (TEXT) - sent, delivered, opened, clicked, bounced, replied, unsubscribed
- event_timestamp (TIMESTAMPTZ)
- metadata (JSONB) - user_agent, device, location, links, reply text, etc.
- created_at (TIMESTAMPTZ)
```

####`campaign_replies`
Stores replies from leads (populated by Smartlead webhooks).

```sql
- reply_id (UUID, PK)
- campaign_id (UUID, FK → campaigns)
- lead_id (UUID, FK → leads)
- lead_email (TEXT)
- reply_subject (TEXT)
- reply_text (TEXT)
- replied_at (TIMESTAMPTZ)
- sentiment (TEXT) - positive, neutral, negative
- is_read (BOOLEAN)
- admin_notes (TEXT)
- responded_at (TIMESTAMPTZ)
- responded_by (UUID, FK → user_profiles)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Renamed Tables

#### `brevo_transactional_emails` (formerly `scheduled_emails`)
ONLY for Brevo transactional emails (admin sends to arbitrary addresses).

```sql
- brevo_email_id (UUID, PK) - formerly scheduled_email_id
- campaign_id (UUID, FK, nullable) - for context only
- recipient_email (TEXT)
- brevo_message_id (TEXT)
- brevo_status (TEXT)
- delivered_at, opened_at, clicked_at, bounced_at, etc.
```

#### `email_events` 
Updated to reference `brevo_transactional_emails`.

```sql
- event_id (UUID, PK)
- brevo_email_id (UUID, FK) - formerly scheduled_email_id
- campaign_id (UUID, FK, nullable)
- event_type (TEXT)
- event_timestamp (TIMESTAMPTZ)
- recipient_email (TEXT)
- brevo_message_id (TEXT)
- metadata (JSONB)
```

### Updated Columns in `campaigns`

```sql
- smartlead_campaign_id (TEXT) - Smartlead campaign ID
- replies_received (INTEGER) - Total replies from Smartlead
- emails_sent (INTEGER) - From Smartlead webhooks
- emails_delivered (INTEGER) - From Smartlead webhooks
- emails_opened (INTEGER) - From Smartlead webhooks
- emails_clicked (INTEGER) - From Smartlead webhooks
- emails_bounced (INTEGER) - From Smartlead webhooks
```

**Legacy/Deprecated columns** (kept for backwards compatibility):
- `sender_email` - Campaign emails sent via Smartlead accounts
- `sender_subdomains` - Only for Brevo transactional emails
- `sender_health` - Managed by Smartlead

### Updated Columns in `leads`

Add tracking columns:
```sql
- smartlead_lead_id (TEXT) - Smartlead's lead ID
- last_email_sent_at (TIMESTAMPTZ)
- last_opened_at (TIMESTAMPTZ)
- last_clicked_at (TIMESTAMPTZ)
- last_replied_at (TIMESTAMPTZ)
- status (TEXT) - active, replied, bounced, unsubscribed
- unsubscribed_at (TIMESTAMPTZ)
```

---

## API Endpoints

### Smartlead Webhook
**Endpoint**: `POST /api/webhooks/smartlead`

**Events Handled**:
- `sent` - Email sent by Smartlead
- `delivered` - Email delivered to inbox
- `opened` - Lead opened email
- `clicked` - Lead clicked link in email
- `bounced` - Email bounced (hard/soft)
- `replied` - Lead replied to email ⭐
- `unsubscribed` - Lead unsubscribed

**Actions**:
1. Record event in `smartlead_email_events`
2. Update campaign metrics
3. Update lead status
4. If reply: store in `campaign_replies`
5. If unsubscribe: update lead status

### Brevo Webhook (Updated)
**Endpoint**: `POST /api/webhooks/brevo`

**Scope**: TRANSACTIONAL EMAILS ONLY

**Events Handled**:
- Delivered, opened, clicked, bounced, etc.
- For admin-sent emails to arbitrary addresses

**Actions**:
1. Record event in `email_events`
2. Update `brevo_transactional_emails` status

### Smartlead Campaign Management
**Endpoints**:
- `POST /api/smartlead/campaigns` - Create campaign
- `GET /api/smartlead/campaigns?campaign_id=xxx` - Get campaign details
- `POST /api/smartlead/campaigns/[id]/pause` - Pause campaign
- `POST /api/smartlead/campaigns/[id]/resume` - Resume campaign
- `GET /api/smartlead/campaigns/[id]/analytics` - Get real-time analytics
- `POST /api/smartlead/campaigns/[id]/leads` - Add leads
- `DELETE /api/smartlead/campaigns/[id]/leads?email=xxx` - Remove lead

### Campaign Replies API (New)
**Endpoints**:
- `GET /api/admin/campaigns/[id]/replies` - Get all replies for campaign
- `PATCH /api/admin/campaigns/[id]/replies/[replyId]` - Mark as read, add notes
- `GET /api/admin/replies/unread` - Get all unread replies across campaigns
- `GET /api/admin/replies/sentiment?type=positive|neutral|negative` - Filter by sentiment

---

## Admin UI Design

### 1. Campaign Overview Dashboard (`/admin/campaigns`)

**Key Metrics (Top Cards)**:
```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│  Active Campaigns   │   Total Leads       │   Emails Sent       │   Reply Rate        │
│        24           │      15,234         │      45,678         │      12.3%          │
│    (+3 this week)   │   (+1,234 today)    │  (+2,345 today)     │   (+1.2% ↑)         │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

**Campaign List Table**:
| Campaign Name | Status | Leads | Sent | Delivered | Opened | Clicked | Replied | Actions |
|---------------|--------|-------|------|-----------|--------|---------|---------|---------|
| Q4 Chemical Sale | 🟢 Active | 1,234 | 2,456 | 2,401 (97.8%) | 1,567 (65.2%) | 234 (9.7%) | 89 (3.7%) | [Pause][View][Analytics] |
| H2 Polymer Promo | ⏸ Paused | 856 | 1,234 | 1,198 (97.1%) | 789 (65.8%) | 145 (12.1%) | 34 (2.8%) | [Resume][View][Analytics] |

**Features**:
- Real-time status updates (from Smartlead webhooks)
- Filter by status (active, paused, completed)
- Sort by metrics (reply rate, open rate, etc.)
- Quick actions (pause, resume, view)
- Search campaigns

### 2. Campaign Detail Page (`/admin/campaigns/[id]`)

**Tabs**:

#### Tab 1: Overview
```
Campaign: Q4 Chemical Sale                               Status: 🟢 Active
Product: Sodium Chloride Powder                          [Pause Campaign][Sync from Smartlead]

┌─── Performance Metrics ─────────────────────────────────────────────────────┐
│  Leads: 1,234     Sent: 2,456 (100%)                                         │
│  Delivered: 2,401 (97.8%)    Opened: 1,567 (65.2%)    Clicked: 234 (9.7%)   │
│  Bounced: 55 (2.2%)          Replied: 89 (3.7%)       Unsubscribed: 12      │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Email Performance Chart (Last 30 Days) ──────────────────────────────────┐
│  [Line chart showing: Sent, Delivered, Opened, Clicked over time]           │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Recent Activity ─────────────────────────────────────────────────────────┐
│  • john@acme.com replied 2 minutes ago - "Interested in bulk pricing..."    │
│  • sarah@techcorp.com clicked link 5 minutes ago                             │
│  • mike@industrial.com opened email 12 minutes ago                           │
│  • [View All Activity]                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 2: Leads
```
Total Leads: 1,234    Active: 1,145    Replied: 67    Bounced: 15    Unsubscribed: 7

[Search leads...] [Filter: All | Active | Replied | Bounced] [Add Leads][Export]

| Lead Email        | Name        | Company    | Status    | Last Activity        | Actions    |
|-------------------|-------------|------------|-----------|---------------------|------------|
| john@acme.com     | John Smith  | Acme Corp  | 💬 Replied | Replied 2 mins ago  | [View Reply][Remove] |
| sarah@tech.com    | Sarah Lee   | TechCorp   | ✉️ Opened  | Opened 5 mins ago   | [View Events][Remove] |
| mike@indust.com   | Mike Brown  | Industrial | 📧 Sent    | Sent 1 hour ago     | [View Events][Remove] |
```

**Features**:
- Add leads (single or bulk CSV upload)
- Remove leads from campaign (via Smartlead API)
- View lead history (all events from `smartlead_email_events`)
- Filter and search
- Export to CSV

#### Tab 3: Replies 💬
```
Total Replies: 89    Unread: 12    Positive: 34    Neutral: 45    Negative: 10

[Filter: All | Unread | Positive | Neutral | Negative] [Search replies...]

┌─── Reply: john@acme.com ────────────────────────────────────────────────────┐
│  From: john@acme.com (John Smith - Acme Corp)                                │
│  Subject: Re: Your Chemical Supply Needs                                     │
│  Received: 2 minutes ago                                                      │
│  Sentiment: 🟢 Positive                                                       │
│                                                                               │
│  "Hi, I'm interested in bulk pricing for Sodium Chloride. Can you send       │
│   me a quote for 10,000 kg per month? We're looking to establish a           │
│   long-term supplier relationship."                                           │
│                                                                               │
│  Admin Notes: [                                                    ]          │
│  [Mark as Read] [Respond in Smartlead] [Add to CRM]                          │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Features**:
- View all replies in one place
- Filter by sentiment (AI-detected or manual)
- Mark as read/unread
- Add admin notes
- Link to respond in Smartlead (opens Smartlead inbox)
- Search replies by keyword

#### Tab 4: Analytics
```
┌─── Engagement Metrics ──────────────────────────────────────────────────────┐
│  Open Rate: 65.2%     (Industry Avg: 45%)  ↑ 20.2%                           │
│  Click Rate: 9.7%     (Industry Avg: 5%)   ↑ 4.7%                            │
│  Reply Rate: 3.7%     (Industry Avg: 1.5%) ↑ 2.2%                            │
│  Bounce Rate: 2.2%    (Industry Avg: 3%)   ↓ 0.8%                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Engagement Over Time ────────────────────────────────────────────────────┐
│  [Multi-line chart: Opens, Clicks, Replies by day]                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Device Breakdown ────────────────────────────────────────────────────────┐
│  📱 Mobile: 45%    💻 Desktop: 50%    📧 Webmail: 5%                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Location Insights ───────────────────────────────────────────────────────┐
│  [Map showing engagement by country/region]                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 5: Settings (Keep existing)
- Send test email (Brevo transactional)
- Email quality checker
- Template management
- Sender domain selection (for Brevo)

### 3. Reply Inbox (`/admin/replies`)

**Global reply management across all campaigns**:

```
Reply Inbox                                    [Mark All as Read] [Export]

Filters: [All (89)] [Unread (12)] [Positive (34)] [Neutral (45)] [Negative (10)]
Sort by: [Newest] [Oldest] [Campaign]

┌─── Unread Replies ──────────────────────────────────────────────────────────┐
│  💬 john@acme.com - Q4 Chemical Sale                         2 minutes ago   │
│     "Interested in bulk pricing..."                                          │
│     [View Full Reply] [Mark as Read]                                         │
│                                                                               │
│  💬 sarah@tech.com - H2 Polymer Promo                        1 hour ago       │
│     "Can you send technical specifications?"                                 │
│     [View Full Reply] [Mark as Read]                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Read Replies ────────────────────────────────────────────────────────────┐
│  ✓ mike@industrial.com - Q4 Chemical Sale                   Yesterday        │
│    "Thanks for the information. We'll review and get back..."                │
│    Admin notes: "Follow up next week"                                        │
│    [View Full Reply]                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4. Campaign Creation Flow (Updated)

**Step 4 (Review & Launch)**: After database creation, also create in Smartlead
- Create campaign in DB ✅
- Create campaign in Smartlead via API ✅
- Store `smartlead_campaign_id` ✅
- Add initial leads to Smartlead via API ✅
- Show success/error messages

**Note**: Actual email sending happens through Smartlead, not our system.

---

## User UI Design

### 1. Campaigns Dashboard (`/dashboard/campaigns`)

**Key Metrics (Top Cards)**:
```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│  Active Campaigns   │   Total Sent        │   Open Rate         │   Reply Rate        │
│         3           │      5,678          │      68.4%          │      4.2%           │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

**Campaign Cards**:
```
┌──── Q4 Chemical Sale ─────────────────────────────────────────────────────┐
│  Sodium Chloride Powder                                     Status: Active │
│                                                                             │
│  📊 Performance                                                             │
│  Leads: 1,234    Sent: 2,456    Delivered: 2,401 (97.8%)                   │
│  Opened: 1,567 (65.2%)    Clicked: 234 (9.7%)    Replied: 89 (3.7%)        │
│                                                                             │
│  📈 [Engagement chart]                                                      │
│                                                                             │
│  [View Details] [View Leads] [View Replies]                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Campaign Detail Page (`/dashboard/campaigns/[id]`)

**Overview Section**:
```
Campaign: Q4 Chemical Sale
Product: Sodium Chloride Powder
Status: 🟢 Active    Started: Oct 15, 2025    Duration: 30 days

┌─── Key Metrics ─────────────────────────────────────────────────────────────┐
│  Total Leads: 1,234                                                          │
│  Emails Sent: 2,456 / 2,500 (98.2%)                                          │
│  Open Rate: 65.2%          Click Rate: 9.7%          Reply Rate: 3.7%       │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Engagement Timeline ─────────────────────────────────────────────────────┐
│  [Area chart showing opens, clicks, replies over campaign duration]          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Lead Engagement ─────────────────────────────────────────────────────────┐
│  • 🟢 Highly Engaged (67) - Opened multiple times, clicked links             │
│  • 🟡 Moderately Engaged (456) - Opened email                                │
│  • ⚪ Not Engaged (700) - Email sent, not opened                             │
│  • 💬 Replied (89) - Interested leads                                        │
│  • 🔴 Bounced/Unsubscribed (27)                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Recent Activity Feed**:
```
┌─── Recent Activity ─────────────────────────────────────────────────────────┐
│  💬 john@acme.com replied                                   2 minutes ago    │
│  🔗 sarah@techcorp.com clicked product link                 5 minutes ago    │
│  ✉️ mike@industrial.com opened email                        12 minutes ago   │
│  📧 150 emails sent                                          1 hour ago       │
│  [Load More]                                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3. Lead Insights (`/dashboard/campaigns/[id]/leads`)

**Lead engagement breakdown**:
- List of all leads with status
- Filter by engagement level
- View individual lead timeline
- Export engaged leads

### 4. Reply Summary (`/dashboard/campaigns/[id]/replies`)

**User view of replies** (read-only):
```
Replies Received: 89

Sentiment Breakdown:
• 🟢 Positive (Interested): 34
• 🟡 Neutral (Informational): 45
• 🔴 Negative (Not interested): 10

Recent Replies:
• john@acme.com - "Interested in bulk pricing..."
• sarah@tech.com - "Can you send specifications?"
[View All in Admin Panel]
```

---

## Implementation Checklist

### Phase 1: Database & Backend ✅
- [x] Create `smartlead_email_events` table
- [x] Create `campaign_replies` table
- [x] Rename `scheduled_emails` → `brevo_transactional_emails`
- [x] Update `email_events` to reference `brevo_transactional_emails`
- [x] Update `campaigns` table columns
- [x] Add tracking columns to `leads` table
- [x] Create Smartlead webhook endpoint
- [x] Update Brevo webhook for transactional only

### Phase 2: API & Integration
- [ ] Update database types
- [ ] Test Smartlead webhook with sample data
- [ ] Test Brevo webhook with transactional emails
- [ ] Update Smartlead client with actual API endpoints
- [ ] Test campaign creation flow with Smartlead
- [ ] Test lead management (add/remove)

### Phase 3: Admin UI
- [ ] Create campaign overview dashboard
- [ ] Create campaign detail page with tabs
- [ ] Create lead management UI
- [ ] Create reply inbox UI
- [ ] Create analytics visualizations
- [ ] Update campaign creation flow

### Phase 4: User UI
- [ ] Update campaigns dashboard with Smartlead data
- [ ] Update campaign detail page
- [ ] Create lead insights page
- [ ] Create reply summary page

### Phase 5: Testing & Deployment
- [ ] End-to-end testing
- [ ] Webhook testing
- [ ] Load testing
- [ ] Deploy migrations
- [ ] Monitor Smartlead webhooks
- [ ] Monitor metrics

---

## Key Differences from Previous Implementation

### What Changed:
1. **Email Sending**: Now via Smartlead (was Brevo)
2. **Email Tracking**: Now via Smartlead webhooks (was Brevo)
3. **Reply Management**: New feature via Smartlead webhooks
4. **Brevo Role**: Transactional only (was campaigns + transactional)
5. **Database**: New tables for Smartlead events and replies

### What Stayed:
1. **Campaign Creation**: Still in our database
2. **Lead Storage**: Still in our database
3. **Brevo**: Still used for admin test emails
4. **UI**: Updated to show Smartlead data

---

## Environment Variables

```bash
# Smartlead Configuration
SMARTLEAD_API_KEY=your_smartlead_api_key
SMARTLEAD_WEBHOOK_SECRET=your_webhook_secret

# Brevo Configuration (Transactional only)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=info@pitchivo.com
BREVO_SENDER_NAME=Pitchivo
```

---

## Monitoring & Alerts

### Key Metrics to Monitor:
1. **Smartlead Webhook Health**
   - Webhook success rate
   - Event processing time
   - Failed events

2. **Campaign Performance**
   - Open rates trending down?
   - High bounce rates?
   - Reply rates

3. **System Health**
   - Database performance
   - API response times
   - Webhook queue depth

### Alerts to Set Up:
- Webhook failures
- High bounce rates (> 5%)
- Low open rates (< 30%)
- Unread replies older than 24 hours
- Campaign creation failures

---

## Next Steps

1. **Run Migrations**: Apply all database migrations
2. **Update Smartlead Client**: Add actual API endpoints from Smartlead docs
3. **Configure Webhooks**: Set up Smartlead webhook in their dashboard
4. **Test Flow**: Create test campaign, add leads, send emails
5. **Build UIs**: Implement admin and user UIs per design
6. **Deploy**: Push to production with monitoring

---

This architecture gives you:
- ✅ Full control over campaign data
- ✅ Real-time email tracking via Smartlead
- ✅ Reply management and inbox
- ✅ Comprehensive analytics
- ✅ Separation of concerns (Smartlead = campaigns, Brevo = transactional)
- ✅ Scalable infrastructure

