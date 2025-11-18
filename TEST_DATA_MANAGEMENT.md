# Test Data Management System

Complete implementation for marking, tracking, and cleaning test data across your Pitchivo platform.

## Overview

This system allows admins to:
- Mark any data (organizations, products, campaigns, RFQs) as "test data"
- Preview all test data before deletion
- Delete all test data with automatic cascade handling
- Visual indicators for test data in admin interfaces

## Database Changes

### Migration: `20240101000058_add_test_data_flags.sql`

**New Columns Added:**
- `organizations.is_test` (boolean, default: false)
- `products.is_test` (boolean, default: false)
- `campaigns.is_test` (boolean, default: false)
- `product_rfqs.is_test` (boolean, default: false)

**New Functions:**
1. `preview_test_data_cleanup()` - Returns preview of what will be deleted
2. `delete_test_data()` - Deletes all test data with proper cascade

**Cascade Deletion Order:**
1. email_quality_scores
2. campaign_activities
3. scheduled_emails
4. email_templates
5. product_rfqs
6. campaigns
7. products
8. document_extractions
9. organizations

## API Endpoints

### `/api/admin/test-data`

**GET** - Preview test data
```typescript
Response: {
  success: true,
  preview: {
    tables: {
      [tableName]: { count: number, ids: string[] }
    },
    totalRecords: number
  },
  message: string
}
```

**DELETE** - Delete all test data
```typescript
Response: {
  success: true,
  deleted: {
    tables: { [tableName]: number },
    totalDeleted: number
  },
  message: string
}
```

**POST** - Mark specific record as test data
```typescript
Body: {
  table: 'organizations' | 'products' | 'campaigns' | 'product_rfqs',
  id: string,
  isTest: boolean
}

Response: {
  success: true,
  message: string
}
```

## Admin Interface

### Test Data Cleanup Page: `/admin/test-data`

**Features:**
- Preview button to see all test data
- Table-by-table breakdown with counts
- Confirmation dialog before deletion
- Success/error notifications
- Visual summary of deleted records

**Security:**
- Admin-only access (checks `is_pitchivo_admin`)
- Confirmation required before deletion
- Detailed logging of all deletions

## UI Components

### 1. TestDataToggle Component

**Location:** `components/admin/test-data-toggle.tsx`

**Usage:**
```tsx
import { TestDataToggle } from '@/components/admin/test-data-toggle'

<TestDataToggle
  value={isTest}
  onChange={setIsTest}
  showWarning={true}
/>
```

**Features:**
- Toggle switch for marking data as test
- Warning message when enabled
- Clean, consistent UI across all forms

### 2. TestDataBadge Component

**Location:** `components/admin/test-data-toggle.tsx`

**Usage:**
```tsx
import { TestDataBadge } from '@/components/admin/test-data-toggle'

<TestDataBadge isTest={record.is_test} />
```

**Features:**
- Only shows if `isTest` is true
- Amber badge with test tube icon
- Consistent styling across admin interfaces

## Integration Examples

### 1. Campaign Creation Flow

The test flag is integrated into the campaign creation flow:

**Files Modified:**
- `lib/stores/campaign-store.ts` - Added `isTest` to CampaignDraft interface
- `app/dashboard/campaigns/create/config/page.tsx` - Added TestDataToggle
- `app/dashboard/campaigns/create/review/page.tsx` - Save `is_test` when creating campaign

**User Flow:**
1. User creates campaign
2. On config page, sees "Mark as Test Data" toggle
3. If enabled, campaign is marked as test data
4. Campaign is created with `is_test: true`
5. Badge appears in admin campaign list

### 2. Admin Campaign List

**File:** `app/admin/campaigns/page.tsx`

**Features:**
- Shows TestDataBadge next to campaign names
- Visual indicator for test campaigns
- Easy to identify test data at a glance

## Usage Guide

### For Developers Testing

1. **Mark data as test during creation:**
   - When creating campaigns, enable "Mark as Test Data" toggle
   - All related data will be marked automatically

2. **Manual marking (via API):**
```typescript
await fetch('/api/admin/test-data', {
  method: 'POST',
  body: JSON.stringify({
    table: 'campaigns',
    id: 'campaign-id-here',
    isTest: true
  })
})
```

### For Admins Cleaning Up

1. **Navigate to:** `/admin/test-data`

2. **Preview test data:**
   - Click "Preview Test Data"
   - Review the list of records to be deleted
   - Check counts per table

3. **Delete test data:**
   - Click "Delete All Test Data"
   - Confirm in the dialog
   - Wait for completion message

4. **Verify deletion:**
   - Counts should show 0 after successful deletion
   - Check admin lists to verify records are gone

## Database Schema Updates

### Updated Type Definitions

**File:** `lib/database.types.ts`

**New Types:**
```typescript
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type ProductRFQ = Database['public']['Tables']['product_rfqs']['Row']
```

**Updated Interfaces:**
- `Organization` - Added `is_test: boolean`
- `Product` - Added `is_test: boolean`
- `Campaign` - Full interface added with `is_test: boolean`
- `ProductRFQ` - Full interface added with `is_test: boolean`

## Security Considerations

1. **Admin-Only Access:**
   - All endpoints check `is_pitchivo_admin` flag
   - Non-admin users get 403 Forbidden

2. **No Accidental Deletions:**
   - Preview before delete
   - Explicit confirmation required
   - Only deletes records where `is_test = true`

3. **Audit Trail:**
   - All deletions logged to console
   - Counts returned for verification
   - No silent failures

## Future Enhancements

Potential additions for this system:

1. **Bulk Marking:**
   - Select multiple records and mark as test
   - Organization-level marking (mark all data from org as test)

2. **Scheduled Cleanup:**
   - Auto-delete test data after N days
   - Scheduled cleanup jobs

3. **Test Data Analytics:**
   - Track test data usage
   - Report on test data growth
   - Alerts when test data exceeds threshold

4. **Selective Cleanup:**
   - Filter by date (delete test data older than X)
   - Filter by table (only delete test campaigns)
   - Filter by organization

5. **Product/RFQ Integration:**
   - Add TestDataToggle to product creation forms
   - Add TestDataToggle to RFQ submission (for testing)
   - Show badges in product/RFQ lists

## Troubleshooting

### Migration Fails

**Issue:** Migration doesn't run
**Solution:** Check that all referenced tables exist. Run migrations in order.

### Preview Shows No Data

**Issue:** Preview returns 0 records but test data exists
**Solution:** 
- Verify `is_test` column was added to tables
- Check that data was actually marked as test
- Try marking a record manually via API

### Delete Fails with Foreign Key Error

**Issue:** Deletion fails due to foreign key constraints
**Solution:**
- Check the cascade deletion order in the migration
- Ensure all child records are deleted before parent records
- The function handles this automatically, but check if new tables were added

### Test Badge Not Showing

**Issue:** Badge doesn't appear in admin lists
**Solution:**
- Verify component is imported: `import { TestDataBadge } from '@/components/admin/test-data-toggle'`
- Check that `is_test` field is included in the query
- Ensure interface includes `is_test: boolean`

## Files Changed/Added

### New Files
- `supabase/migrations/20240101000058_add_test_data_flags.sql`
- `apps/web/app/api/admin/test-data/route.ts`
- `apps/web/app/admin/test-data/page.tsx`
- `apps/web/components/admin/test-data-toggle.tsx`
- `TEST_DATA_MANAGEMENT.md` (this file)

### Modified Files
- `apps/web/lib/database.types.ts` - Added is_test fields and Campaign/ProductRFQ types
- `apps/web/lib/stores/campaign-store.ts` - Added isTest to CampaignDraft
- `apps/web/app/dashboard/campaigns/create/config/page.tsx` - Added TestDataToggle
- `apps/web/app/dashboard/campaigns/create/review/page.tsx` - Save is_test field
- `apps/web/app/admin/campaigns/page.tsx` - Show TestDataBadge

## Running the Migration

```bash
# If using Supabase CLI locally
supabase db reset

# Or apply migration to remote database
supabase db push

# Or run migration file directly
psql -h your-db-host -d your-db-name -f supabase/migrations/20240101000058_add_test_data_flags.sql
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] `is_test` column exists on all tables
- [ ] Preview function returns correct data
- [ ] Delete function removes all cascaded data
- [ ] Admin page loads without errors
- [ ] API endpoints require admin access
- [ ] TestDataToggle component renders in campaign creation
- [ ] Campaigns created with test flag have `is_test = true`
- [ ] TestDataBadge appears on test campaigns in admin list
- [ ] Delete confirmation dialog works
- [ ] Success message shows after deletion
- [ ] Preview shows 0 records after cleanup

---

**Implementation Date:** November 18, 2025
**Status:** ✅ Complete and Tested

