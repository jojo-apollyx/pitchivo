# Pitchivo Project Documentation

**Last Updated:** November 22, 2025

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Smartlead Integration](#smartlead-integration)
4. [Database Schema](#database-schema)
5. [Admin Panel](#admin-panel)
6. [Campaign Management](#campaign-management)
7. [Development Guide](#development-guide)

---

## Project Overview

Pitchivo is a B2B chemical marketplace platform with integrated email campaign management.

### Tech Stack
- **Frontend**: Next.js 14+, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Email**: Smartlead (campaigns), Brevo (transactional)
- **Monorepo**: Turborepo

### Repository Structure
```
pitchivo/
├── apps/
│   └── web/              # Main Next.js application
│       ├── app/          # Next.js App Router
│       ├── components/   # React components
│       └── lib/          # Utilities and clients
├── packages/
│   └── ui/               # Shared UI components
└── supabase/
    └── migrations/       # Database migrations
```

---

## Architecture

### Email System Architecture

**Smartlead** (Campaign Emails):
- Handles all marketing campaign emails
- Provides webhooks for email tracking
- Manages lead lifecycle
- Reply management

**Brevo** (Transactional Emails):
- User notifications (orders, updates, alerts)
- Admin notifications
- System emails (password resets, verification)
- Test emails

### Data Flow

```
Campaign Creation:
User → Supabase (campaigns) → Smartlead API → Store smartlead_campaign_id

Email Tracking:
Smartlead → Webhook → Database (smartlead_email_events) → UI Display

Campaign Metrics:
Webhooks update counters → Cached in campaigns table → UI displays
```

---

## Smartlead Integration

### API Configuration

**Base URL:** `https://server.smartlead.ai/api/v1`  
**Authentication:** API key as query parameter

### Key API Endpoints Implemented

**Campaigns** (9 methods):
- Create, read, update, delete campaigns
- Update schedule, settings, status
- Get analytics and analytics by date

**Leads** (14 methods):
- Add, update, delete leads
- Pause, resume, unsubscribe leads
- Get lead history and campaigns
- Export leads to CSV

**Email Accounts** (10 methods):
- Manage sending accounts
- Configure warmup settings
- Get warmup statistics

**Sequences** (2 methods):
- Get and save email sequences

### Webhook Events

Smartlead sends webhooks for:
- `EMAIL_SENT` - Email sent
- `EMAIL_OPENED` - Lead opened email
- `LINK_CLICKED` - Lead clicked link
- `EMAIL_BOUNCE` - Email bounced
- `EMAIL_REPLY` - Lead replied
- `LEAD_UNSUBSCRIBED` - Lead unsubscribed

**Endpoint:** `/api/webhooks/smartlead`

### Campaign Naming Convention

**Pattern:** `[OrgName] UserName - Campaign Name`

Example: `[ChemCorp] John Smith - Sodium Benzoate Campaign`

This enables multi-tenant tracking in Smartlead while maintaining clean display names in the UI.

---

## Database Schema

### Key Tables

#### `campaigns`
Main campaign records with cached metrics
```sql
- campaign_id (UUID, PK)
- smartlead_campaign_id (TEXT) - Smartlead's ID
- campaign_name (TEXT) - Display name
- smartlead_name (TEXT) - Internal Smartlead name
- org_id (UUID, FK)
- product_id (UUID, FK)
- emails_sent, emails_opened, emails_clicked (INT)
- replies_received (INT)
- status (campaign_status)
```

#### `smartlead_email_events`
All email events from Smartlead webhooks
```sql
- event_id (UUID, PK)
- campaign_id (UUID, FK)
- smartlead_campaign_id (TEXT)
- lead_email (TEXT)
- event_type (TEXT) - sent, opened, clicked, replied, etc.
- event_timestamp (TIMESTAMPTZ)
- metadata (JSONB)
```

#### `campaign_replies`
Lead replies with sentiment analysis
```sql
- reply_id (UUID, PK)
- campaign_id (UUID, FK)
- lead_email (TEXT)
- reply_subject (TEXT)
- reply_text (TEXT)
- sentiment (TEXT) - positive, neutral, negative
- is_read (BOOLEAN)
```

#### `campaign_leads`
Leads for campaigns with tracking
```sql
- lead_id (UUID, PK)
- campaign_id (UUID, FK)
- smartlead_lead_id (TEXT)
- email, first_name, last_name, company_name
- status (TEXT) - active, replied, bounced, unsubscribed
- open_count, click_count, reply_count (INT)
```

#### `brevo_transactional_emails`
Transactional (non-campaign) emails via Brevo
```sql
- brevo_email_id (UUID, PK)
- recipient_email (TEXT)
- email_type (TEXT)
- brevo_message_id (TEXT)
- brevo_status (TEXT)
```

---

## Admin Panel

### Pages

**Campaign Overview** (`/admin/campaigns`)
- List all campaigns with metrics
- Search and filter
- Pause/resume campaigns
- Quick actions

**Campaign Detail** (`/admin/campaigns/[campaignId]`)
- **Overview Tab**: Metrics, progress, recent activity
- **Leads Tab**: Full CRUD, search, filter, bulk actions
- **Sequences Tab**: View email sequences and variants
- **Analytics Tab**: Detailed metrics with date ranges
- **Settings Tab**: Schedule, tracking, behavior configuration

**Email Accounts** (`/admin/email-accounts`)
- View all email accounts
- Monitor warmup status
- Configure settings
- View statistics

### Key Features

**Campaign Management:**
- Create, pause, resume, delete campaigns
- Real-time sync with Smartlead
- Multi-tenant support

**Lead Management:**
- Add/remove leads
- Pause/resume individual leads
- Unsubscribe leads
- Export to CSV
- Search and filter

**Reply Management:**
- View all replies across campaigns
- Filter by sentiment
- Mark as read/unread
- Add admin notes

---

## Campaign Management

### Campaign Creation Flow

1. **Choose Product** - Select from user's products
2. **Matched Buyers** - Review matched leads
3. **Configure Sending** - Set schedule and quota
4. **Review & Launch** - Create in database and Smartlead

### User Campaign Dashboard

**Campaign List** (`/dashboard/campaigns`):
- View all user campaigns
- See metrics and progress
- Pause/resume campaigns

**Campaign Detail** (`/dashboard/campaigns/[campaignId]`):
- Performance timeline chart
- Email event statistics
- Engagement feed
- Contact delivery status

---

## Development Guide

### Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SMARTLEAD_API_KEY=
BREVO_API_KEY=
```

3. **Run migrations:**
```bash
cd supabase
supabase db push
```

4. **Start development server:**
```bash
npm run dev
```

### Testing

**Webhook Testing:**
1. Use Smartlead's test webhook feature
2. Monitor logs at `/api/webhooks/smartlead`
3. Verify data in `smartlead_email_events` table

**Campaign Testing:**
1. Create test campaign in UI
2. Verify creation in Smartlead dashboard
3. Send test emails
4. Check webhook events received

### Deployment

**Vercel:**
1. Import from GitHub
2. Set **Root Directory:** `apps/web`
3. Add environment variables
4. Deploy

**Webhook Configuration:**
1. Go to Smartlead → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/smartlead`
3. Select all event types
4. Save

---

## Key Implementation Details

### Bi-Directional Sync

**Pitchivo → Smartlead:**
- Campaign creation/deletion
- Lead management
- Settings updates

**Smartlead → Pitchivo:**
- Email events via webhooks
- Campaign status changes
- Lead status updates

### Multi-Tenant Support

Uses naming convention to track attribution:
- Display name: "Sodium Benzoate Campaign"
- Smartlead name: "[ChemCorp] John - Sodium Benzoate Campaign"

Utilities in `lib/utils/campaign-naming.ts`:
- `generateSmartleadCampaignName()`
- `parseSmartleadCampaignName()`

### Counter Management

PostgreSQL functions prevent race conditions:
- `increment_campaign_counter()`
- `increment_lead_counter()`
- Safe concurrent updates via webhooks

---

## Troubleshooting

### Webhooks Not Received
1. Check webhook URL in Smartlead dashboard
2. Verify HTTPS endpoint accessible
3. Check API logs for errors
4. Test with Smartlead's test feature

### Metrics Not Updating
1. Verify webhook processing
2. Check `smartlead_email_events` table for recent events
3. Verify counter increment functions working
4. Check campaign has `smartlead_campaign_id`

### Campaign Creation Fails
1. Check Smartlead API key validity
2. Verify campaign name format
3. Check database constraints
4. Review API error logs

---

## Related Files

**Core Implementation:**
- `apps/web/lib/smartlead/client.ts` - Smartlead API client
- `apps/web/app/api/webhooks/smartlead/route.ts` - Webhook handler
- `apps/web/app/api/smartlead/campaigns/route.ts` - Campaign API

**Admin Panel:**
- `apps/web/app/admin/campaigns/` - Admin pages
- `apps/web/app/api/admin/campaigns/` - Admin APIs

**User Dashboard:**
- `apps/web/app/dashboard/campaigns/` - User pages

**Database:**
- `supabase/migrations/` - All migrations

---

## Support & Resources

- **Smartlead API Docs**: https://api.smartlead.ai
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Version:** 1.0  
**Status:** Production Ready  
**Last Major Update:** Smartlead Integration Complete (Nov 2025)

