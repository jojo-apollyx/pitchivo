# Admin Panel Architecture - Comprehensive Campaign Management

## Overview

This document outlines the complete admin panel architecture for managing Smartlead campaigns with full bi-directional sync and multi-tenant support.

## Multi-Tenant Naming Strategy

### Problem
- Multiple clients use the system
- Each client has multiple users
- Each user can run multiple campaigns
- Need clear naming in Smartlead for tracking

### Solution

**Client-Facing (UI Display):**
```
"Sodium Benzoate Campaign"
"Citric Acid Outreach"
```

**Smartlead-Facing (Internal Tracking):**
```
"[ChemCorp] John Smith - Sodium Benzoate Campaign"
"[PharmaTech] Jane Doe - Citric Acid Outreach"
```

**Naming Pattern:**
```
[{organization_name}] {user_name} - {campaign_name}
```

### Implementation

**Database Schema:**
```typescript
campaigns {
  campaign_id: UUID
  display_name: TEXT           // "Sodium Benzoate Campaign"
  smartlead_name: TEXT         // "[ChemCorp] John - Sodium Benzoate Campaign"
  smartlead_campaign_id: TEXT
  org_id: UUID
  created_by: UUID
}
```

**Generation Logic:**
```typescript
function generateSmartleadCampaignName(
  orgName: string,
  userName: string,
  displayName: string
): string {
  return `[${orgName}] ${userName} - ${displayName}`;
}
```

## Admin Panel UI Structure

### Layout: Tabbed Interface

```
┌─────────────────────────────────────────────────────────────┐
│  Campaign: [ChemCorp] John - Sodium Benzoate Campaign      │
│  Status: Active  •  Created: Nov 20, 2025  •  Leads: 1,234 │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Leads] [Analytics] [Sequences] [Settings]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  {Tab Content Area}                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Overview

**Quick Stats Cards:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Emails Sent  │ Open Rate    │ Click Rate   │ Reply Rate   │
│    1,234     │    45.2%     │    12.3%     │     8.5%     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Campaign Controls:**
- Pause/Resume button
- Stop campaign button
- Delete campaign button (with confirmation)
- Export campaign data

**Recent Activity Timeline:**
- Last 10 email events
- Recent replies
- Status changes

### Tab 2: Leads Management

**Sections:**

1. **Lead List** (Table with filters)
   - Email, Name, Company, Status, Last Contacted
   - Actions: Pause, Resume, Unsubscribe, Delete, View History
   - Bulk actions: Pause selected, Resume selected, Export

2. **Add Leads** (Form)
   - Single lead form
   - Bulk upload (CSV)
   - Settings: Ignore duplicates, Ignore global block list

3. **Lead Filters**
   - Status: Active, Paused, Unsubscribed, Bounced
   - Category: Interested, Not Interested, etc.
   - Sequence stage: Which email they're on

4. **Lead Actions Panel**
   - Fetch lead by email (lookup)
   - Add to global block list
   - Export all leads (CSV)

### Tab 3: Analytics

**Sections:**

1. **Overview Metrics**
   - Total leads, Sent, Delivered, Opened, Clicked, Replied, Bounced
   - Progress chart over time
   - Deliverability score

2. **Analytics by Date Range**
   - Date picker (max 30 days)
   - Comparison view
   - Export data

3. **Detailed Statistics**
   - Filter by sequence number
   - Filter by status (opened, clicked, replied, etc.)
   - Per-lead breakdown
   - Heat map by day/hour

4. **Funnel Visualization**
   ```
   Sent (1,234) ──→ Opened (557) ──→ Clicked (152) ──→ Replied (105)
                                                    └──→ Interested (45)
   ```

### Tab 4: Sequences

**Sections:**

1. **Sequence List**
   - Email 1, 2, 3, etc.
   - Subject line preview
   - Delay (days)
   - Variants (A/B testing)

2. **Edit Sequence**
   - Rich text editor
   - Subject line
   - Delay settings
   - Add variant button
   - Preview with merge tags

3. **Sequence Settings**
   - Follow-up percentage (0-100%)
   - Thread vs. new email
   - A/B test variants

### Tab 5: Settings

**Grouped Settings:**

1. **Schedule Settings**
   - Timezone selector
   - Days of week (checkboxes)
   - Start/End time
   - Min time between emails
   - Max leads per day
   - Schedule start date

2. **Tracking Settings**
   - Track email opens ✓
   - Track link clicks ✓
   - Track replies ✓
   - Unsubscribe text

3. **Behavior Settings**
   - Stop sending when: Reply / Click / Open
   - Send as plain text ☐
   - Enable AI ESP matching ✓
   - Follow-up percentage: 40%

4. **Email Accounts**
   - List of sender email accounts
   - Health status (colored badge)
   - Add/Remove accounts
   - Warmup settings per account

5. **Client Assignment**
   - Assign to client (dropdown)
   - Client permissions

## Email Account Management

### Separate Admin Page: `/admin/email-accounts`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Email Accounts                                             │
│  [+ Add Email Account]                          [Reconnect] │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ john@chemcorp.com                    [Healthy]  98%   │  │
│  │ Daily sent: 48/100  •  Warmup: Active  •  Rep: 100%  │  │
│  │ [Edit] [Warmup Settings] [View Stats] [Remove]       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ jane@chemcorp.com                    [Warming] 85%    │  │
│  │ Daily sent: 12/50   •  Warmup: Active  •  Rep: 85%   │  │
│  │ [Edit] [Warmup Settings] [View Stats] [Remove]       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Email Account Details Modal:**
- From Name, From Email
- SMTP/IMAP settings
- Daily limit
- Warmup enabled
- Warmup stats (last 7 days chart)

## Lead History & Reply Interface

### Lead Detail View Modal

**Header:**
```
┌─────────────────────────────────────────────────────────────┐
│ john.doe@example.com                         [Interested]   │
│ John Doe • CEO • Example Corp                               │
│ [Pause] [Resume] [Unsubscribe] [Add to Block List]         │
├─────────────────────────────────────────────────────────────┤
```

**Tabs:**
1. **Message History**
   - Timeline of all emails
   - Sent emails (collapsible)
   - Replies (highlighted)
   - Opens and clicks

2. **Lead Info**
   - Contact details
   - Custom fields
   - Category
   - Tags

3. **Reply**
   - Text editor
   - CC/BCC fields
   - Add signature toggle
   - Send button

**Message History Format:**
```
┌─────────────────────────────────────────────────────────────┐
│ ↗ SENT - Nov 20, 2025 10:30 AM                            │
│ Subject: Introduction to our Sodium Benzoate               │
│ [View Email] • Opened 2 times • Clicked 1 link            │
├─────────────────────────────────────────────────────────────┤
│ ↙ REPLY - Nov 21, 2025 9:15 AM                            │
│ Re: Introduction to our Sodium Benzoate                    │
│ "Thanks for reaching out. I'm interested..."               │
│ [View Full] [Reply]                                        │
├─────────────────────────────────────────────────────────────┤
│ ↗ SENT - Nov 22, 2025 10:00 AM                            │
│ Re: Introduction to our Sodium Benzoate                    │
│ [View Email] • Opened 1 time                               │
└─────────────────────────────────────────────────────────────┘
```

## API Routes Structure

### Campaign Management
```
GET    /api/admin/campaigns/:id/overview
GET    /api/admin/campaigns/:id/analytics
POST   /api/admin/campaigns/:id/settings/schedule
POST   /api/admin/campaigns/:id/settings/tracking
POST   /api/admin/campaigns/:id/settings/behavior
POST   /api/admin/campaigns/:id/status (pause/resume/stop)
DELETE /api/admin/campaigns/:id
```

### Lead Management
```
GET    /api/admin/campaigns/:id/leads
POST   /api/admin/campaigns/:id/leads (add)
DELETE /api/admin/campaigns/:id/leads/:leadId
POST   /api/admin/campaigns/:id/leads/:leadId/pause
POST   /api/admin/campaigns/:id/leads/:leadId/resume
POST   /api/admin/campaigns/:id/leads/:leadId/unsubscribe
GET    /api/admin/campaigns/:id/leads/:leadId/history
POST   /api/admin/campaigns/:id/leads/:leadId/reply
GET    /api/admin/campaigns/:id/leads/export
GET    /api/admin/leads/search?email=xxx
POST   /api/admin/leads/block-list
```

### Email Accounts
```
GET    /api/admin/email-accounts
POST   /api/admin/email-accounts (add/update)
GET    /api/admin/email-accounts/:id
DELETE /api/admin/email-accounts/:id
POST   /api/admin/email-accounts/:id/warmup
GET    /api/admin/email-accounts/:id/warmup-stats
POST   /api/admin/email-accounts/reconnect-failed
```

### Sequences
```
GET    /api/admin/campaigns/:id/sequences
POST   /api/admin/campaigns/:id/sequences (save)
```

### Analytics
```
GET    /api/admin/campaigns/:id/analytics
GET    /api/admin/campaigns/:id/analytics-by-date?start=xxx&end=xxx
GET    /api/admin/campaigns/:id/statistics?offset=0&limit=100
```

### Categories
```
GET    /api/admin/categories
```

## Webhook Enhancements

### Lead-Level Events (Already Handled)
- EMAIL_SENT → Update lead.last_contacted
- EMAIL_OPEN → Increment open_count
- EMAIL_CLICK → Increment click_count
- EMAIL_REPLY → Store in campaign_replies
- EMAIL_BOUNCE → Update lead.status = 'bounced'
- LEAD_UNSUBSCRIBED → Update lead.status = 'unsubscribed'
- LEAD_CATEGORY_UPDATED → Update lead.category

### New: Lead Status Sync
When admin pauses/resumes/unsubscribes lead in Smartlead:
- Webhook sends LEAD_STATUS_CHANGE
- Update our database accordingly
- Reflect in UI immediately

### New: Lead Added/Removed
When admin adds/removes lead in Smartlead:
- Webhook sends LEAD_ADDED or LEAD_REMOVED
- Sync to our database
- Update lead count

## Database Schema Additions

### Campaigns Table Updates
```sql
ALTER TABLE campaigns
ADD COLUMN display_name TEXT,
ADD COLUMN smartlead_name TEXT,
ADD COLUMN created_by UUID REFERENCES user_profiles(id);

-- Rename existing campaign_name to display_name
UPDATE campaigns SET display_name = campaign_name;
```

### Lead Events Table (New)
```sql
CREATE TABLE lead_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES campaign_leads(lead_id),
  campaign_id UUID REFERENCES campaigns(campaign_id),
  event_type TEXT NOT NULL, -- sent, opened, clicked, replied, bounced
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_events_lead ON lead_events(lead_id);
CREATE INDEX idx_lead_events_campaign ON lead_events(campaign_id);
CREATE INDEX idx_lead_events_type ON lead_events(event_type);
```

### Email Accounts Table (If not exists)
```sql
CREATE TABLE email_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smartlead_account_id INTEGER,
  org_id UUID REFERENCES organizations(id),
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  smtp_host TEXT,
  smtp_port INTEGER,
  imap_host TEXT,
  imap_port INTEGER,
  daily_limit INTEGER DEFAULT 100,
  daily_sent INTEGER DEFAULT 0,
  is_smtp_success BOOLEAN DEFAULT false,
  warmup_enabled BOOLEAN DEFAULT false,
  warmup_reputation INTEGER DEFAULT 0,
  warmup_status TEXT DEFAULT 'inactive',
  health_status TEXT DEFAULT 'unknown',
  delivery_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## UI Component Structure

```
apps/web/app/admin/
├── campaigns/
│   └── [campaignId]/
│       ├── page.tsx (Main campaign page with tabs)
│       ├── components/
│       │   ├── OverviewTab.tsx
│       │   ├── LeadsTab.tsx
│       │   ├── AnalyticsTab.tsx
│       │   ├── SequencesTab.tsx
│       │   └── SettingsTab.tsx
│       └── layout.tsx
├── email-accounts/
│   ├── page.tsx
│   └── components/
│       ├── EmailAccountCard.tsx
│       ├── AddAccountModal.tsx
│       └── WarmupSettingsModal.tsx
└── leads/
    └── [leadId]/
        ├── page.tsx (Lead detail modal)
        └── components/
            ├── MessageHistory.tsx
            ├── LeadInfo.tsx
            └── ReplyForm.tsx
```

## Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
1. Multi-tenant naming strategy
2. Database schema updates
3. API route scaffolding
4. Webhook enhancements

### Phase 2: Campaign Management (Week 2)
1. Campaign overview tab
2. Settings tab (schedule, tracking, behavior)
3. Status controls (pause/resume/stop)
4. Campaign analytics display

### Phase 3: Lead Management (Week 3)
1. Leads tab with table
2. Add/remove leads
3. Pause/resume/unsubscribe
4. Lead detail view
5. Message history

### Phase 4: Advanced Features (Week 4)
1. Sequence management
2. Email account management
3. Reply interface
4. Export functionality
5. Analytics dashboard

### Phase 5: Polish & Testing (Week 5)
1. UI polish and consistency
2. Error handling
3. Loading states
4. End-to-end testing
5. Documentation

## Design System

### Color Coding
- **Healthy**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)
- **Neutral**: Gray (#6b7280)

### Status Badges
- Active: Green
- Paused: Yellow
- Stopped: Orange
- Completed: Blue
- Deleted: Red

### Icons (Lucide React)
- Send: `Send`
- Open: `Mail`
- Click: `MousePointerClick`
- Reply: `MessageSquare`
- Bounce: `Ban`
- Settings: `Settings`
- Analytics: `BarChart3`
- Leads: `Users`
- Sequence: `List`

---

**Next Steps**: Start with Phase 1 - Multi-tenant naming and database updates

