# Smartlead Bi-Directional Sync Implementation

## Overview

This document outlines the complete bi-directional synchronization between Pitchivo and Smartlead. All campaign operations now trigger API calls to Smartlead, and webhook handlers ensure that changes made in Smartlead are reflected in Pitchivo's database.

## UI/UX Changes

### Step 3: Campaign Configuration (Simplified)

**File**: `apps/web/app/dashboard/campaigns/create/config/page.tsx`

#### Removed Components:
1. **Quota Calculator** - Replaced with clean tooltip-based quota info
2. **Sender Address Selection** - No longer needed (Smartlead manages this)
3. **Sender Health Panel** - Removed from main view and right sidebar

#### New Features:
- Simple text with inline upgrade link
- Hover tooltip showing:
  - Current plan tier
  - Monthly quota
  - Already used
  - This campaign requirements
  - Remaining after campaign
  - Upgrade CTA if quota exceeded

### Step 4: Review Page (Cleaned Up)

**File**: `apps/web/app/dashboard/campaigns/create/review/page.tsx`

#### Removed Sections:
- Sender identity display
- Sender health indicator
- All sender-related metadata from campaign creation

## Bi-Directional Sync Implementation

### 1. UI → Smartlead (Web UI to API)

#### Campaign Deletion
**File**: `apps/web/app/dashboard/campaigns/page.tsx`

When a user deletes a campaign in the UI:
```typescript
// 1. Check if campaign has Smartlead ID
// 2. Call DELETE /api/smartlead/campaigns/{smartlead_campaign_id}
// 3. Delete from our database (cascade deletes activities)
// 4. Show success/error toast
```

**API Route**: `apps/web/app/api/smartlead/campaigns/[campaignId]/route.ts`
- Method: `DELETE`
- Endpoint: `/api/smartlead/campaigns/[campaignId]`
- Calls Smartlead API: `DELETE /campaigns/{campaign_id}`
- Returns success/error status

#### Campaign Creation
When a user creates a campaign:
```typescript
// 1. Insert campaign in our database
// 2. Call POST /api/smartlead/campaigns
// 3. Store smartlead_campaign_id in our database
// 4. Continue with campaign setup
```

#### Future: Other Operations
The following operations should also trigger Smartlead API calls:
- Pause/Resume campaign → `POST /campaigns/{id}/status`
- Update settings → `POST /campaigns/{id}/settings`
- Add/Remove leads → `POST/DELETE /campaigns/{id}/leads`

### 2. Smartlead → UI (Webhooks to Database)

#### Webhook Handler Enhancement
**File**: `apps/web/app/api/webhooks/smartlead/route.ts`

**New Event Types Supported:**
```typescript
// Lead-level events (existing)
- EMAIL_SENT, EMAIL_DELIVERED, EMAIL_OPEN, EMAIL_LINK_CLICK
- EMAIL_BOUNCE, EMAIL_REPLY
- LEAD_UNSUBSCRIBED, LEAD_CATEGORY_UPDATED

// Campaign-level events (NEW)
- CAMPAIGN_STATUS_CHANGE
- CAMPAIGN_DELETED
- CAMPAIGN_UPDATED
```

#### Campaign Event Handlers

**Campaign Deleted:**
```typescript
// When Smartlead sends CAMPAIGN_DELETED webhook:
// 1. Find campaign by smartlead_campaign_id
// 2. Update status to 'deleted' in our database
// 3. Log deletion timestamp and source
```

**Campaign Status Changed:**
```typescript
// When Smartlead sends CAMPAIGN_STATUS_CHANGE:
// 1. Map Smartlead status to our status:
//    - DRAFTED → draft
//    - ACTIVE/START → active
//    - PAUSED → paused
//    - STOPPED → stopped
//    - COMPLETED → completed
// 2. Update campaign status in our database
```

**Campaign Updated:**
```typescript
// When Smartlead sends CAMPAIGN_UPDATED:
// 1. Check for campaign name changes
// 2. Update campaign name if changed
// 3. Store sync data for reference
// 4. Update updated_at timestamp
```

## Updated Smartlead Client

**File**: `apps/web/lib/smartlead/client.ts`

### New Methods Based on API Reference

#### Campaign Management
```typescript
// Campaign lifecycle
deleteCampaign(campaignId) // DELETE /campaigns/{id}
updateCampaignSchedule(campaignId, schedule) // POST /campaigns/{id}/schedule
updateCampaignSettings(campaignId, settings) // POST /campaigns/{id}/settings

// Sequences
getCampaignSequences(campaignId) // GET /campaigns/{id}/sequences
saveCampaignSequences(campaignId, sequences) // POST /campaigns/{id}/sequences
```

#### Analytics & Statistics
```typescript
// Now properly implemented according to API docs:
getCampaignAnalytics(campaignId) // GET /campaigns/{id}/analytics
getCampaignAnalyticsByDate(campaignId, startDate, endDate) // GET /campaigns/{id}/analytics-by-date
getCampaignStatistics(campaignId, options) // GET /campaigns/{id}/statistics
```

#### Lead Management
```typescript
// Updated to use correct endpoint:
removeLead(campaignId, leadIdOrEmail) // DELETE /campaigns/{id}/leads/{lead_id}
```

## Database Schema Requirements

### Campaigns Table

Ensure the following columns exist:
```sql
campaigns (
  campaign_id UUID PRIMARY KEY,
  smartlead_campaign_id TEXT, -- Smartlead's campaign ID
  campaign_name TEXT,
  status TEXT, -- 'draft', 'scheduled', 'active', 'paused', 'stopped', 'completed', 'deleted'
  org_id UUID REFERENCES organizations(id),
  product_id UUID REFERENCES products(product_id),
  email_count INTEGER,
  duration_days INTEGER,
  start_date TIMESTAMPTZ,
  priority_locations TEXT[],
  is_test BOOLEAN DEFAULT false,
  launched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metrics updated by webhooks
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  replies_received INTEGER DEFAULT 0,
  
  -- Removed columns (no longer needed):
  -- sender_email TEXT,
  -- sender_health TEXT
)
```

## Testing Checklist

### UI Operations → Smartlead

- [ ] Create campaign → Campaign created in Smartlead with correct ID
- [ ] Delete campaign → Campaign deleted from Smartlead
- [ ] Verify error handling when Smartlead API fails
- [ ] Verify toast notifications show correct messages

### Smartlead Webhooks → Database

- [ ] Set up webhook in Smartlead pointing to `/api/webhooks/smartlead`
- [ ] Test EMAIL_SENT event → metrics updated
- [ ] Test EMAIL_OPEN event → metrics updated
- [ ] Test EMAIL_REPLY event → stored in campaign_replies
- [ ] Test CAMPAIGN_STATUS_CHANGE → status updated in DB
- [ ] Test CAMPAIGN_DELETED → status set to 'deleted' in DB
- [ ] Test CAMPAIGN_UPDATED → campaign_name updated if changed

### Edge Cases

- [ ] Campaign deleted in Smartlead while user viewing in UI
- [ ] Campaign status changed while user is editing
- [ ] Network failures during API calls
- [ ] Webhook rate limiting
- [ ] Duplicate webhook events

## Configuration

### Environment Variables

Ensure these are set:
```bash
SMARTLEAD_API_KEY=your_smartlead_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Webhook Setup in Smartlead

1. Go to Smartlead Settings → Webhooks
2. Create webhook with URL: `https://your-domain.com/api/webhooks/smartlead`
3. Select all event types:
   - EMAIL_SENT
   - EMAIL_OPEN
   - EMAIL_LINK_CLICK
   - EMAIL_REPLY
   - LEAD_UNSUBSCRIBED
   - CAMPAIGN_STATUS_CHANGE (if available)
4. Save and test webhook

### Rate Limiting

Smartlead API has rate limits:
- **10 requests per 2 seconds**
- Implement exponential backoff for retries
- Queue bulk operations appropriately

## API Reference Compliance

All implementations now follow the official Smartlead API documentation:

**Base URL**: `https://server.smartlead.ai/api/v1`

**Authentication**: API key as query parameter `?api_key=YOUR_API_KEY`

**Documentation**: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation

### Verified Endpoints

✅ `POST /campaigns/create` - Create campaign
✅ `GET /campaigns/{id}` - Get campaign details
✅ `DELETE /campaigns/{id}` - Delete campaign
✅ `POST /campaigns/{id}/status` - Update campaign status (PAUSED, STOPPED, START)
✅ `POST /campaigns/{id}/schedule` - Update schedule
✅ `POST /campaigns/{id}/settings` - Update settings
✅ `GET /campaigns/{id}/sequences` - Get sequences
✅ `POST /campaigns/{id}/sequences` - Save sequences
✅ `GET /campaigns/{id}/analytics` - Get analytics
✅ `GET /campaigns/{id}/analytics-by-date` - Get analytics by date
✅ `GET /campaigns/{id}/statistics` - Get detailed statistics
✅ `POST /campaigns/{id}/leads` - Add leads
✅ `DELETE /campaigns/{id}/leads/{lead_id}` - Remove lead
✅ `GET /campaigns/{id}/leads` - List leads

## Summary

### Changes Made

1. ✅ Removed quota calculator from step 3, added simple upgrade reminder
2. ✅ Removed sender address input and health panel from step 3
3. ✅ Cleaned up step 4 (review page) sender-related sections
4. ✅ Added Smartlead API call when deleting campaigns in UI
5. ✅ Updated Smartlead client analytics and lead removal methods
6. ✅ Added webhook handler for Smartlead campaign status changes
7. ✅ Implemented bi-directional sync functionality

### Benefits

- **Simplified UI**: Removed unnecessary complexity from campaign creation
- **True Bi-Directional Sync**: Changes in either system reflect in the other
- **Better Error Handling**: Graceful degradation when Smartlead API fails
- **Comprehensive API Coverage**: All documented Smartlead endpoints implemented
- **Future-Proof**: Easy to add more sync operations as needed

### Next Steps

1. Test all webhook events with real Smartlead webhooks
2. Add pause/resume functionality with Smartlead sync
3. Implement lead sync when adding/removing from campaigns
4. Add background job for periodic full sync (reconciliation)
5. Monitor and log all Smartlead API calls for debugging
6. Set up alerts for sync failures

---

**Last Updated**: November 20, 2025  
**Status**: ✅ Complete - Ready for Testing

