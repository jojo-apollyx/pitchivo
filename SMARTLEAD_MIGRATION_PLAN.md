# Smartlead Migration Plan: Hybrid Approach

## Overview
This document outlines the migration plan for integrating Smartlead for campaign management while keeping Brevo for email sending and tracking.

**Architecture:**
- **Smartlead**: Campaign creation and management (user-facing)
- **Brevo**: Email sending (admin-triggered) + webhook tracking for delivery status
- **Brevo Webhooks**: Track email delivery status (no campaign tags, use other tags for future)
- **Tables**: Rename Brevo-specific tables to indicate they're for Brevo tracking

---

## 🔍 Smartlead API Research Needed

Before starting migration, research Smartlead API:
- [ ] API authentication method (API key, OAuth, etc.)
- [ ] Campaign creation API
- [ ] Campaign management API (pause, resume, analytics)
- [ ] Lead management API (add, remove, list leads)
- [ ] Rate limits and quotas
- [ ] Analytics/metrics API

---

## 📁 Files Requiring Changes

### 1. **Campaign Creation Flow (Smartlead Integration)**

#### 1.1 `apps/web/app/dashboard/campaigns/create/review/page.tsx`
**Current State:** Creates campaign in database
**Changes Required:**
- [ ] After creating campaign in database, create campaign in Smartlead
- [ ] Store Smartlead campaign ID in database
- [ ] Add `smartlead_campaign_id` column to `campaigns` table
- [ ] Handle Smartlead API errors gracefully
- [ ] Keep database campaign creation as primary source

**Key Code Sections:**
- Lines 138-160: Campaign creation logic

---

#### 1.2 Database Migration: Add Smartlead Campaign ID
**File:** Create `supabase/migrations/[timestamp]_add_smartlead_campaign_id.sql`

**Changes Required:**
- [ ] Add `smartlead_campaign_id TEXT` column to `campaigns` table
- [ ] Add index on `smartlead_campaign_id`
- [ ] Add comment explaining it's for Smartlead integration

```sql
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS smartlead_campaign_id TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_smartlead_id 
ON campaigns(smartlead_campaign_id) 
WHERE smartlead_campaign_id IS NOT NULL;

COMMENT ON COLUMN campaigns.smartlead_campaign_id IS 'Smartlead campaign ID for campaign management integration';
```

---

### 2. **Brevo Webhook Tracking (Keep & Update)**

#### 2.1 `apps/web/app/api/webhooks/brevo/route.ts`
**Current State:** Processes Brevo webhook events with campaign tags
**Changes Required:**
- [ ] **KEEP FILE** (don't rename)
- [ ] Remove campaign tag extraction logic (lines 116-131)
- [ ] Use other tags for future tracking (e.g., `email_id`, `scheduled_email_id`)
- [ ] Update to track emails by `scheduled_email_id` or `email_id` instead of campaign
- [ ] Keep all Brevo event processing logic
- [ ] Update comments to clarify it's for Brevo tracking only

**Key Code Sections:**
- Lines 116-131: Tag extraction (REMOVE campaign tag logic)
- Lines 286-362: `recordEmailEvent` function (keep, update tag logic)
- Lines 364-438: `updateScheduledEmailStatus` (keep as-is)

---

#### 2.2 Database Migration: Rename Brevo-Specific Tables/Columns
**File:** Create `supabase/migrations/[timestamp]_rename_brevo_tables.sql`

**Changes Required:**
- [ ] Rename `scheduled_emails.brevo_message_id` → `brevo_message_id` (keep name, add comment)
- [ ] Rename `scheduled_emails.brevo_status` → `brevo_status` (keep name, add comment)
- [ ] Rename `email_events.brevo_message_id` → `brevo_message_id` (keep name, add comment)
- [ ] Add table comments indicating these are for Brevo tracking
- [ ] **OR** Create new tables: `brevo_email_tracking`, `brevo_email_events` (if separation needed)

**Option 1: Keep existing tables, add comments:**
```sql
-- Add comments to indicate Brevo-specific tracking
COMMENT ON COLUMN scheduled_emails.brevo_message_id IS 'Brevo message ID for email tracking via Brevo webhooks';
COMMENT ON COLUMN scheduled_emails.brevo_status IS 'Email delivery status from Brevo webhooks (delivered, opened, clicked, bounced, etc.)';
COMMENT ON COLUMN email_events.brevo_message_id IS 'Brevo message ID linking to Brevo webhook events';
COMMENT ON TABLE email_events IS 'Email event tracking from Brevo webhooks. Tracks delivery, opens, clicks, bounces, etc.';
```

**Option 2: Create separate Brevo tracking tables:**
```sql
-- Create Brevo-specific email tracking table
CREATE TABLE IF NOT EXISTS brevo_email_tracking (
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_email_id UUID REFERENCES scheduled_emails(scheduled_email_id),
  brevo_message_id TEXT NOT NULL,
  brevo_status TEXT,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brevo_tracking_message_id 
ON brevo_email_tracking(brevo_message_id);

CREATE INDEX IF NOT EXISTS idx_brevo_tracking_scheduled_email 
ON brevo_email_tracking(scheduled_email_id);
```

---

### 3. **Admin Campaign Dashboard (Remove Batch Sending, Keep Other Features)**

#### 3.1 `apps/web/app/admin/campaigns/[campaignId]/page.tsx` or similar
**Current State:** Admin campaign management page
**Changes Required:**
- [ ] **REMOVE** batch email sending triggers for leads
- [ ] **REMOVE** "Send to all leads" or "Send batch" buttons
- [ ] **KEEP** pause/resume campaign functionality
- [ ] **KEEP** analytics viewing
- [ ] **KEEP** send to arbitrary email functionality
- [ ] **KEEP** email quality check
- [ ] **KEEP** template management
- [ ] **KEEP** lead list viewing
- [ ] **KEEP** add lead manually
- [ ] **KEEP** search leads from database

**Files to Review:**
- `apps/web/app/admin/campaigns/page.tsx`
- `apps/web/app/admin/campaigns/[campaignId]/settings/page.tsx`
- `apps/web/components/admin/campaign-email-management.tsx`

---

#### 3.2 `apps/web/app/api/admin/campaigns/send/route.ts`
**Current State:** Sends email to arbitrary address
**Changes Required:**
- [ ] **KEEP** as-is (sends to arbitrary email)
- [ ] Add sender domain selection (use Brevo sender domains)
- [ ] Add dropdown/selector for choosing sender domain
- [ ] Update payload to use selected sender domain

**Key Code Sections:**
- Lines 225-261: Email sending logic
- Add sender domain selection before sending

---

#### 3.3 `apps/web/components/admin/campaign-email-management.tsx`
**Current State:** Campaign email management component
**Changes Required:**
- [ ] **REMOVE** batch sending UI elements
- [ ] **REMOVE** "Send to all leads" buttons
- [ ] **KEEP** individual email sending (arbitrary email)
- [ ] **KEEP** lead list display
- [ ] **KEEP** email status tracking (Brevo status)
- [ ] **KEEP** add lead functionality
- [ ] **KEEP** search leads functionality

---

### 4. **Sender Domain Selection (Brevo Only)**

#### 4.1 Create Brevo Sender Domains Constant
**File:** `apps/web/lib/constants/brevo-sender-domains.ts` (NEW FILE)

**Changes Required:**
- [ ] Create constant array of 4 sender domains
- [ ] Export for use in send email UI

```typescript
// Brevo sender domains for email sending
// These domains are authenticated in Brevo and can be selected when sending emails
export const BREVO_SENDER_DOMAINS = [
  { value: 'news', label: 'news@pitchivo.com', description: 'News and updates' },
  { value: 'updates', label: 'updates@pitchivo.com', description: 'Product updates' },
  { value: 'info', label: 'info@pitchivo.com', description: 'General information' },
  { value: 'alerts', label: 'alerts@pitchivo.com', description: 'Important alerts' }
] as const

export type BrevoSenderDomain = typeof BREVO_SENDER_DOMAINS[number]['value']
```

---

#### 4.2 Update Send Email UI to Include Sender Domain Selection
**File:** `apps/web/app/admin/campaigns/[campaignId]/settings/page.tsx` or send email component

**Changes Required:**
- [ ] Add sender domain dropdown/selector in "Send Email" tab
- [ ] Default to first domain
- [ ] Pass selected domain to send email API
- [ ] Update API to use selected domain

**UI Location:** In the "Send Email" tab, add before recipient email field:
```tsx
<Select value={selectedSenderDomain} onValueChange={setSelectedSenderDomain}>
  <SelectTrigger>
    <SelectValue placeholder="Select sender domain" />
  </SelectTrigger>
  <SelectContent>
    {BREVO_SENDER_DOMAINS.map(domain => (
      <SelectItem key={domain.value} value={domain.value}>
        {domain.label} - {domain.description}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

#### 4.3 Update Send Email API to Use Selected Domain
**File:** `apps/web/app/api/admin/campaigns/send/route.ts`

**Changes Required:**
- [ ] Accept `senderDomain` in request body
- [ ] Construct sender email from selected domain
- [ ] Use in email payload

**Key Code Sections:**
- Line 49-58: Request body parsing (add `senderDomain`)
- Line 228: Email payload construction (use selected domain)

---

### 5. **User Frontend Campaign Management (Keep As-Is)**

#### 5.1 `apps/web/app/dashboard/campaigns/page.tsx`
**Current State:** User campaign list and details
**Changes Required:**
- [ ] **NO CHANGES** - Keep showing detailed email status
- [ ] **KEEP** mock data functionality
- [ ] Continue showing Brevo delivery status
- [ ] Continue showing email event history

---

#### 5.2 `apps/web/components/dashboard/campaign-details.tsx` or similar
**Current State:** Shows campaign details with email status
**Changes Required:**
- [ ] **NO CHANGES** - Keep displaying email delivery status
- [ ] **KEEP** Brevo status badges
- [ ] **KEEP** email event history

---

### 6. **Database Schema Updates**

#### 6.1 Migration: Add Smartlead Campaign ID
**File:** `supabase/migrations/[timestamp]_add_smartlead_campaign_id.sql`

```sql
-- Add Smartlead campaign ID to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS smartlead_campaign_id TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_smartlead_id 
ON campaigns(smartlead_campaign_id) 
WHERE smartlead_campaign_id IS NOT NULL;

COMMENT ON COLUMN campaigns.smartlead_campaign_id IS 'Smartlead campaign ID for campaign management integration';
```

---

#### 6.2 Migration: Add Comments to Brevo Tracking Columns
**File:** `supabase/migrations/[timestamp]_add_brevo_tracking_comments.sql`

```sql
-- Add comments to indicate Brevo-specific tracking
COMMENT ON COLUMN scheduled_emails.brevo_message_id IS 'Brevo message ID for email tracking via Brevo webhooks. Used for tracking email delivery status from Brevo.';
COMMENT ON COLUMN scheduled_emails.brevo_status IS 'Email delivery status from Brevo webhooks (delivered, opened, clicked, bounced, etc.). Updated automatically via Brevo webhook events.';
COMMENT ON COLUMN email_events.brevo_message_id IS 'Brevo message ID linking to Brevo webhook events. Used to track email events from Brevo.';
COMMENT ON TABLE email_events IS 'Email event tracking from Brevo webhooks. Tracks delivery, opens, clicks, bounces, etc. Events are received via /api/webhooks/brevo endpoint.';
```

---

### 7. **Smartlead API Integration**

#### 7.1 Create Smartlead Client
**File:** `apps/web/lib/smartlead/client.ts` (NEW FILE)

**Changes Required:**
- [ ] Create Smartlead API client
- [ ] Implement campaign creation
- [ ] Implement campaign pause/resume
- [ ] Implement campaign analytics
- [ ] Implement lead management (add, list, remove)

```typescript
export class SmartleadClient {
  private apiKey: string
  private baseUrl: string = 'https://api.smartlead.ai/v1' // Update with actual URL

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async createCampaign(data: CreateCampaignData): Promise<SmartleadCampaign> {
    // Implement campaign creation
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    // Implement pause
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    // Implement resume
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    // Implement analytics
  }

  async addLead(campaignId: string, lead: LeadData): Promise<void> {
    // Implement add lead
  }

  async listLeads(campaignId: string): Promise<Lead[]> {
    // Implement list leads
  }
}
```

---

#### 7.2 Create Smartlead API Routes
**File:** `apps/web/app/api/smartlead/campaigns/route.ts` (NEW FILE)

**Changes Required:**
- [ ] Create campaign in Smartlead
- [ ] Pause/resume campaign
- [ ] Get campaign analytics
- [ ] Add/remove leads

---

### 8. **Remove Batch Sending Features**

#### 8.1 Remove Batch Sending API Endpoints
**Files to Review/Remove:**
- [ ] `apps/web/app/api/admin/campaigns/schedule/route.ts` - Review, may remove or disable
- [ ] `apps/web/app/api/admin/campaigns/auto-schedule/route.ts` - Review, may remove or disable
- [ ] `apps/web/app/api/admin/campaigns/send-scheduled/route.ts` - Review, may remove or disable

**Decision:** Either remove these endpoints or disable them (return error saying batch sending is disabled)

---

#### 8.2 Remove Batch Sending UI
**Files to Update:**
- [ ] `apps/web/components/admin/campaign-email-management.tsx` - Remove batch sending buttons
- [ ] `apps/web/app/admin/campaigns/[campaignId]/settings/page.tsx` - Remove batch sending tabs/buttons

---

## 📋 Migration Checklist

### Phase 1: Database & Schema
- [ ] Create migration for `smartlead_campaign_id` column
- [ ] Create migration for Brevo tracking comments
- [ ] Test migrations on development database
- [ ] Update TypeScript database types

### Phase 2: Smartlead Integration
- [ ] Research Smartlead API
- [ ] Create Smartlead client library
- [ ] Create Smartlead API routes
- [ ] Integrate campaign creation with Smartlead
- [ ] Test campaign creation flow

### Phase 3: Brevo Webhook Updates
- [ ] Update webhook to remove campaign tag extraction
- [ ] Update to use other tags (email_id, scheduled_email_id)
- [ ] Test webhook with new tag structure
- [ ] Update webhook documentation

### Phase 4: Admin Dashboard Updates
- [ ] Remove batch sending UI elements
- [ ] Remove batch sending API endpoints (or disable)
- [ ] Add sender domain selection to send email UI
- [ ] Update send email API to use selected domain
- [ ] Test send email with domain selection

### Phase 5: Frontend (User Dashboard)
- [ ] Verify user campaign management still works
- [ ] Verify email status display still works
- [ ] Test with mock data
- [ ] No changes needed (keep as-is)

### Phase 6: Testing & Documentation
- [ ] Test complete campaign creation flow
- [ ] Test admin send email with domain selection
- [ ] Test Brevo webhook tracking
- [ ] Test pause/resume campaign
- [ ] Test analytics viewing
- [ ] Test lead management
- [ ] Update documentation

---

## ⚠️ Important Notes

1. **Brevo Webhooks**: Keep using Brevo webhooks for email tracking, but remove campaign tag dependency. Use other tags like `email_id` or `scheduled_email_id` for tracking.

2. **Sender Domains**: The 4 sender domains (news, updates, info, alerts) should be:
   - Defined as constants
   - Selectable in send email UI
   - Only used for Brevo email sending
   - Not deleted from database/config

3. **Batch Sending**: Remove all batch sending functionality from admin dashboard. Campaigns will be managed through Smartlead, not triggered from admin panel.

4. **User Frontend**: Keep all user-facing campaign management features as-is. Users should still see detailed email status, delivery tracking, etc.

5. **Mock Data**: Keep mock data functionality - it's irrelevant to the migration.

---

## 📊 Summary

**Files to Create:**
- `apps/web/lib/constants/brevo-sender-domains.ts` - Sender domain constants
- `apps/web/lib/smartlead/client.ts` - Smartlead API client
- `apps/web/app/api/smartlead/campaigns/route.ts` - Smartlead API routes
- Migration files for database changes

**Files to Update:**
- Campaign creation flow (add Smartlead integration)
- Admin dashboard (remove batch sending, add sender domain selection)
- Brevo webhook (remove campaign tag, use other tags)
- Send email API (add sender domain selection)

**Files to Keep As-Is:**
- User frontend campaign management
- Mock data functionality
- Email status display components

**Files to Remove/Disable:**
- Batch sending API endpoints (or disable)
- Batch sending UI elements
