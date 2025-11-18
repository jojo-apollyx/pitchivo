# Lead Persistence & Email Tracking Fix

## Summary

Fixed three critical issues with the campaign management system:

1. **Leads not persisting** - Added `campaign_leads` table to store leads permanently
2. **Scheduled emails not persisting** - Enhanced `scheduled_emails` table with proper tracking
3. **"lead_id column not found" error** - Added missing `lead_id` column and Brevo tracking columns

---

## Database Changes

### New Migration File

**File:** `supabase/migrations/20251118000002_create_leads_and_fix_scheduled_emails.sql`

### Tables Created/Modified

#### 1. `campaign_leads` (NEW TABLE)

Stores all leads/contacts for campaigns with full tracking:

```sql
CREATE TABLE campaign_leads (
  lead_id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(campaign_id),
  
  -- Contact info
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT NOT NULL,
  country TEXT,
  industry TEXT,
  phone TEXT,
  linkedin_url TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'active', -- active, unsubscribed, bounced, invalid
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(campaign_id, email)
);
```

**Features:**
- Prevents duplicate emails per campaign (UNIQUE constraint)
- Tracks lead status (active, unsubscribed, bounced, invalid)
- Stores full contact information
- Auto-updates `updated_at` timestamp via trigger

#### 2. `scheduled_emails` (ENHANCED)

Added missing columns for proper tracking:

**New Columns:**
- `lead_id` - Links to campaign_leads table
- `recipient_title` - Job title (was missing)
- `brevo_message_id` - Brevo/Sendinblue message ID
- `brevo_status` - Current delivery status from Brevo webhooks
- `delivered_at` - When email was delivered
- `opened_at` - When email was first opened
- `clicked_at` - When a link was first clicked
- `bounced_at` - When email bounced
- `bounce_reason` - Reason for bounce
- `spam_reported_at` - When marked as spam
- `unsubscribed_at` - When recipient unsubscribed

**Allowed `brevo_status` values:**
- `queued` - Queued for sending
- `sent` - Sent to Brevo
- `delivered` - Successfully delivered
- `opened` - Email was opened
- `clicked` - Link was clicked
- `hard_bounce` - Permanent delivery failure
- `soft_bounce` - Temporary delivery failure
- `spam` - Marked as spam
- `blocked` - Blocked by recipient server
- `unsubscribed` - Recipient unsubscribed
- `error` - Error during sending

---

## API Endpoints

### 1. Campaign Leads API

**File:** `apps/web/app/api/admin/campaigns/leads/route.ts`

#### GET `/api/admin/campaigns/leads`

Fetch leads for a campaign.

**Query Parameters:**
- `campaignId` (required) - Campaign ID
- `status` (optional) - Filter by status

**Response:**
```json
{
  "leads": [
    {
      "lead_id": "uuid",
      "campaign_id": "uuid",
      "email": "john@company.com",
      "name": "John Doe",
      "title": "Procurement Manager",
      "company": "Acme Corp",
      "country": "United States",
      "industry": "Manufacturing",
      "status": "active",
      "added_at": "2024-11-18T10:00:00Z",
      "created_at": "2024-11-18T10:00:00Z",
      "updated_at": "2024-11-18T10:00:00Z"
    }
  ]
}
```

#### POST `/api/admin/campaigns/leads`

Add leads to a campaign (batch).

**Request Body:**
```json
{
  "campaignId": "uuid",
  "leads": [
    {
      "email": "john@company.com",
      "name": "John Doe",
      "title": "Procurement Manager",
      "company": "Acme Corp",
      "country": "United States",
      "industry": "Manufacturing"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "leads": [ /* created leads */ ]
}
```

**Features:**
- Uses `UPSERT` to handle duplicates
- Updates existing leads if same email + campaign_id
- Validates required fields (email, name, company)

#### PUT `/api/admin/campaigns/leads`

Update a lead.

**Request Body:**
```json
{
  "leadId": "uuid",
  "name": "John Doe",
  "title": "Senior Procurement Manager",
  "status": "active"
}
```

#### DELETE `/api/admin/campaigns/leads`

Delete a lead.

**Query Parameters:**
- `leadId` (required) - Lead ID to delete

---

### 2. Scheduled Emails API (Updated)

**File:** `apps/web/app/api/admin/campaigns/scheduled-emails/route.ts`

#### POST - Enhanced

Now accepts `lead_id` and `recipient_title` in email objects:

```json
{
  "campaignId": "uuid",
  "emails": [
    {
      "lead_id": "uuid",  // NEW
      "recipient_email": "john@company.com",
      "recipient_name": "John Doe",
      "recipient_title": "Procurement Manager",  // NEW
      "recipient_company": "Acme Corp",
      "subject": "Email subject",
      "content": "Email content",
      "scheduled_time": "2024-11-19T09:00:00Z"
    }
  ]
}
```

---

## Frontend Changes

### 1. Add Lead Dialog

**File:** `apps/web/components/admin/add-lead-dialog.tsx`

**Changes:**
- `handleManualAdd()` now persists to database via API
- `handleBulkAdd()` now persists to database via API
- Both functions show proper error messages if API fails
- Leads are no longer just stored in component state

**Before:** Leads only lived in memory
**After:** Leads are persisted to `campaign_leads` table

### 2. Campaign Email Management

**File:** `apps/web/components/admin/campaign-email-management.tsx`

**Changes:**
- `loadData()` - Fetches from database instead of mock data
- `handleDeleteLead()` - Deletes from database via API
- `handleCreateSchedule()` - Creates scheduled email in database
- `handleCancelEmail()` - Updates database via API
- All operations now persist properly

**Data Flow:**
1. Component loads → Fetches leads & scheduled emails from database
2. User adds lead → Saved to database → UI updates
3. User schedules email → Saved to database → UI updates
4. User sends email → Creates record in database → Brevo sends → Webhooks update status

---

## How It Works

### Lead Addition Flow

```
User adds lead → API validates → Insert into campaign_leads → Return lead data → UI updates
```

### Email Scheduling Flow

```
User schedules email → API validates → Insert into scheduled_emails → Cron job picks up → Sends via Brevo
```

### Email Delivery Tracking Flow

```
Brevo sends email → Brevo webhooks fire → Update scheduled_emails.brevo_status → Update campaigns metrics
```

### Send Immediately Flow

```
User clicks "Send Now" → 
  1. Create scheduled_emails record (status: pending)
  2. Send via Brevo
  3. Update scheduled_emails (status: sent, brevo_message_id)
  4. Brevo webhooks update brevo_status
```

---

## Migration Instructions

### Option 1: Using Supabase CLI (Recommended)

```bash
cd /Users/therealjojo/PycharmProjects/pitchivo
supabase db push
```

This will apply all pending migrations including the new one.

### Option 2: Manual SQL Execution

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open the migration file: `supabase/migrations/20251118000002_create_leads_and_fix_scheduled_emails.sql`
4. Copy the entire content
5. Paste into SQL Editor
6. Click "Run"

### Option 3: Using Migration Script

```bash
cd /Users/therealjojo/PycharmProjects/pitchivo
node scripts/run-migration.js supabase/migrations/20251118000002_create_leads_and_fix_scheduled_emails.sql
```

---

## Testing Steps

### 1. Test Lead Addition

1. Go to Admin → Campaigns → Select a campaign
2. Click "Add Lead"
3. Add a lead manually:
   - Email: test@example.com
   - Name: Test User
   - Title: Manager
   - Company: Test Corp
4. Click "Add Lead"
5. ✅ Should see success message
6. ✅ Lead should appear in the table
7. Refresh page
8. ✅ Lead should still be there (persisted)

### 2. Test Email Scheduling

1. Find a lead in the table
2. Click Actions → Schedule Email
3. Select a date and time
4. Click "Schedule Email"
5. ✅ Should see success message
6. ✅ "Scheduled Time" column should show the date/time
7. ✅ Status badge should show "pending"
8. Refresh page
9. ✅ Scheduled email should still be there (persisted)

### 3. Test Send Immediately

1. Find a lead in the table
2. Click Actions → Send Now
3. ✅ Should see "Email sent successfully" message
4. ✅ Status should change to "sent"
5. Check Supabase `scheduled_emails` table
6. ✅ Should see a record with:
   - `lead_id` populated
   - `status` = 'sent'
   - `brevo_message_id` populated
   - All recipient fields populated

### 4. Test Delivery Tracking

After sending an email:

1. Wait for Brevo webhooks to fire (usually 1-2 minutes)
2. Refresh the campaign page
3. ✅ Email cell should have colored background based on status
4. ✅ Status badge should show Brevo status (delivered, opened, etc.)
5. Hover over email
6. ✅ Tooltip should show status description

### 5. Test Lead Deletion

1. Find a lead in the table
2. Click Actions → Remove Lead
3. Confirm deletion
4. ✅ Lead should disappear from table
5. ✅ Any scheduled emails for that lead should also be removed
6. Refresh page
7. ✅ Lead should not reappear

---

## Troubleshooting

### Error: "could not find the 'lead_id' column"

**Cause:** Migration not applied yet
**Solution:** Run the migration as described above

### Leads not showing up after adding

**Cause:** API error or migration not applied
**Solution:** 
1. Check browser console for errors
2. Check Network tab for failed API requests
3. Verify migration was applied: Check if `campaign_leads` table exists

### Scheduled emails not persisting

**Cause:** API error or migration not applied
**Solution:**
1. Check if `scheduled_emails` table has `lead_id` column
2. Check browser console for errors
3. Verify API endpoint is working: Test `/api/admin/campaigns/scheduled-emails`

### Brevo status not updating

**Cause:** Webhooks not configured or not firing
**Solution:**
1. Check Brevo webhook configuration
2. Verify webhook URL is correct
3. Check Supabase logs for webhook errors
4. Test webhook manually: POST to `/api/webhooks/brevo/route.ts`

---

## Database Indexes

For optimal performance, the following indexes were created:

**campaign_leads:**
- `idx_campaign_leads_campaign_id` - Fast campaign lookup
- `idx_campaign_leads_email` - Fast email search
- `idx_campaign_leads_status` - Fast status filtering
- `idx_campaign_leads_added_at` - Fast sorting by date

**scheduled_emails (new):**
- `idx_scheduled_emails_lead_id` - Fast lead lookup
- `idx_scheduled_emails_brevo_message_id` - Fast webhook updates
- `idx_scheduled_emails_brevo_status` - Fast status filtering
- `idx_scheduled_emails_recipient_email` - Fast email lookup

---

## Security (RLS Policies)

All tables have Row Level Security (RLS) enabled with policies that:

1. Allow authenticated users to view all records
2. Allow authenticated users to insert/update/delete records
3. Service role has full access (for API routes using admin client)

**Note:** In production, you may want to restrict these policies to only allow access to campaigns within the user's organization.

---

## Next Steps

### Immediate
1. ✅ Apply the migration
2. ✅ Test lead addition and persistence
3. ✅ Test email scheduling
4. ✅ Test send immediately

### Future Enhancements
1. **Lead Import:** Add CSV/Excel import for bulk lead addition
2. **Lead Deduplication:** Add UI to merge duplicate leads
3. **Lead Enrichment:** Integrate with data enrichment services
4. **Advanced Filtering:** Add more filter options (industry, country, etc.)
5. **Lead Scoring:** Add lead scoring based on engagement
6. **Email Templates:** Create reusable email templates with placeholders
7. **A/B Testing:** Test different email variants
8. **Unsubscribe Management:** Add unsubscribe page and automatic list management

---

## Files Modified

### Migration Files
- ✅ `supabase/migrations/20251118000002_create_leads_and_fix_scheduled_emails.sql` (NEW)

### API Routes
- ✅ `apps/web/app/api/admin/campaigns/leads/route.ts` (NEW)
- ✅ `apps/web/app/api/admin/campaigns/scheduled-emails/route.ts` (UPDATED)
- ✅ `apps/web/app/api/admin/campaigns/send/route.ts` (Already had lead_id support)

### Components
- ✅ `apps/web/components/admin/add-lead-dialog.tsx` (UPDATED)
- ✅ `apps/web/components/admin/campaign-email-management.tsx` (UPDATED)

### No changes needed
- ✅ `apps/web/app/api/webhooks/brevo/route.ts` (Already updates scheduled_emails)
- ✅ `apps/web/lib/mock-data/leads.ts` (Mock data - still used for buyer database search)

---

## Summary

All three issues have been resolved:

1. ✅ **Leads now persist** - Stored in `campaign_leads` table
2. ✅ **Scheduled emails persist** - Properly tracked in `scheduled_emails` table
3. ✅ **No more "lead_id column not found" error** - Column added to schema

The system now has:
- Full lead management with database persistence
- Complete email scheduling and tracking
- Brevo webhook integration for delivery status
- Proper error handling and user feedback
- Optimized database queries with indexes

**Ready for production use after migration is applied!**

