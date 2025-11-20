# Smartlead Migration Checklist

Quick reference checklist for migrating to Smartlead (campaign management) while keeping Brevo (email sending & tracking).

## 🎯 Architecture Overview

- **Smartlead**: Campaign creation & management (user-facing)
- **Brevo**: Email sending (admin-triggered) + webhook tracking
- **Brevo Webhooks**: Track delivery status (no campaign tags, use other tags)
- **Tables**: Add comments to indicate Brevo-specific tracking

---

## 📁 Files to Create

- [ ] `apps/web/lib/constants/brevo-sender-domains.ts` - Brevo sender domain constants
- [ ] `apps/web/lib/smartlead/client.ts` - Smartlead API client
- [ ] `apps/web/app/api/smartlead/campaigns/route.ts` - Smartlead API routes
- [ ] `supabase/migrations/[timestamp]_add_smartlead_campaign_id.sql` - Add Smartlead campaign ID
- [ ] `supabase/migrations/[timestamp]_add_brevo_tracking_comments.sql` - Add Brevo tracking comments

---

## 🔧 Campaign Creation (Smartlead Integration)

- [ ] `apps/web/app/dashboard/campaigns/create/review/page.tsx` - Add Smartlead campaign creation
- [ ] Database: Add `smartlead_campaign_id` column to `campaigns` table
- [ ] Update TypeScript database types

---

## 🔔 Brevo Webhook (Keep & Update)

- [ ] `apps/web/app/api/webhooks/brevo/route.ts` - **KEEP FILE**
  - [ ] Remove campaign tag extraction logic
  - [ ] Use other tags (email_id, scheduled_email_id) for tracking
  - [ ] Update comments to clarify Brevo-only tracking
- [ ] `apps/web/lib/constants/email-events.ts` - Keep as-is (Brevo events)

---

## 👨‍💼 Admin Dashboard Updates

### Remove Batch Sending
- [ ] `apps/web/components/admin/campaign-email-management.tsx` - Remove batch sending UI
- [ ] `apps/web/app/admin/campaigns/[campaignId]/settings/page.tsx` - Remove batch sending buttons
- [ ] `apps/web/app/api/admin/campaigns/schedule/route.ts` - Disable or remove
- [ ] `apps/web/app/api/admin/campaigns/auto-schedule/route.ts` - Disable or remove
- [ ] `apps/web/app/api/admin/campaigns/send-scheduled/route.ts` - Disable or remove

### Keep These Features
- [ ] Pause/resume campaign functionality
- [ ] Analytics viewing
- [ ] Send to arbitrary email
- [ ] Email quality check
- [ ] Template management
- [ ] Lead list viewing
- [ ] Add lead manually
- [ ] Search leads from database

### Add Sender Domain Selection
- [ ] Create `brevo-sender-domains.ts` constant file
- [ ] Add sender domain selector to send email UI
- [ ] `apps/web/app/api/admin/campaigns/send/route.ts` - Accept and use selected domain

---

## 📧 Brevo Email Sending (Keep As-Is)

- [ ] `supabase/functions/send-email/index.ts` - **KEEP** (no changes needed)
- [ ] `supabase/functions/send-scheduled-emails/index.ts` - **KEEP** (no changes needed)
- [ ] `apps/web/lib/email.ts` - **KEEP** (no changes needed)

---

## 👤 User Frontend (Keep As-Is)

- [ ] `apps/web/app/dashboard/campaigns/page.tsx` - **NO CHANGES**
- [ ] `apps/web/components/dashboard/campaign-details.tsx` - **NO CHANGES**
- [ ] `apps/web/lib/mock-data/leads.ts` - **KEEP** (irrelevant to migration)
- [ ] All email status display components - **KEEP AS-IS**

---

## 🗄️ Database Migrations

- [ ] Add `smartlead_campaign_id` column to `campaigns` table
- [ ] Add comments to Brevo tracking columns
- [ ] Update TypeScript database types
- [ ] Test migrations on development database

---

## 🔐 Environment Variables

- [ ] Add `SMARTLEAD_API_KEY` environment variable
- [ ] Keep `BREVO_API_KEY` (still needed for email sending)
- [ ] Keep `BREVO_SENDER_EMAIL` (still needed)
- [ ] Keep `BREVO_SENDER_NAME` (still needed)

---

## 📚 Documentation

- [ ] Update migration plan with actual Smartlead API details
- [ ] Document sender domain selection feature
- [ ] Document removal of batch sending
- [ ] Update webhook documentation (remove campaign tag requirement)

---

## ✅ Migration Phases

### Phase 1: Database & Schema ✅
- [ ] Create migration for `smartlead_campaign_id`
- [ ] Create migration for Brevo tracking comments
- [ ] Test migrations
- [ ] Update TypeScript types

### Phase 2: Smartlead Integration ✅
- [ ] Research Smartlead API
- [ ] Create Smartlead client
- [ ] Create Smartlead API routes
- [ ] Integrate campaign creation
- [ ] Test campaign creation

### Phase 3: Brevo Webhook Updates ✅
- [ ] Remove campaign tag extraction
- [ ] Use other tags for tracking
- [ ] Test webhook
- [ ] Update documentation

### Phase 4: Admin Dashboard ✅
- [ ] Remove batch sending UI
- [ ] Remove/disable batch sending APIs
- [ ] Add sender domain selection
- [ ] Update send email API
- [ ] Test all admin features

### Phase 5: Frontend (User) ✅
- [ ] Verify user dashboard works
- [ ] Verify email status display
- [ ] Test with mock data
- [ ] No changes needed

### Phase 6: Testing & Deployment ✅
- [ ] End-to-end campaign creation test
- [ ] Test admin send email with domain selection
- [ ] Test Brevo webhook tracking
- [ ] Test pause/resume
- [ ] Test analytics
- [ ] Test lead management
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 🔍 Key Search & Replace Patterns

```bash
# Find batch sending references
grep -r "batch\|Batch\|BATCH" --include="*.ts" --include="*.tsx"

# Find campaign tag references in webhook
grep -r "campaign_tag\|campaignTag" --include="*.ts"

# Find sender domain references
grep -r "sender.*domain\|subdomain" --include="*.ts" --include="*.tsx"
```

---

## ⚠️ Critical Reminders

1. **Keep Brevo webhook** - Don't delete, just update tag logic
2. **Keep sender domains** - Don't delete, make them selectable
3. **Remove batch sending** - From UI and API
4. **Keep user frontend** - No changes needed
5. **Keep mock data** - Irrelevant to migration
6. **Add Smartlead integration** - Only for campaign creation/management
