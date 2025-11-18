# Enhanced Test Data Management System

## Overview
Complete test data management system for the admin panel with product and organization management, individual and bulk deletion capabilities, and comprehensive preview functionality.

## Features

### 1. **Product Management Tab**
- **List all products** with search and filtering
- **Search** by product name or organization name
- **Filter** by status (draft/published) and test data flag
- **Mark as test data** with a toggle switch
- **Individual deletion** with preview of related data
- Shows related data that will be deleted:
  - Campaigns
  - RFQs
  - Tracking records
  - Documents

### 2. **Organization Management Tab**
- **List all organizations** with search and filtering
- **Search** by organization name or domain
- **Filter** by test data flag
- **Mark as test data** with a toggle switch
- **Individual deletion** with preview of related data
- Shows related data that will be deleted:
  - Products
  - Users
  - Campaigns
  - RFQs
  - Subscriptions
  - Documents

### 3. **Bulk Actions Tab**
- **Preview all test data** across the entire database
- **Bulk delete** all items marked as test data
- Shows counts by table
- Confirmation dialog with detailed breakdown

## API Endpoints

### `/api/admin/test-data` (Existing - Enhanced)
- **GET**: Preview all test data
- **DELETE**: Delete all test data with cascade
- **POST**: Mark specific items as test/production data

### `/api/admin/test-data/preview` (New)
- **GET**: Preview deletion for specific product or organization
- Query params: `type` (product/organization) and `id`
- Returns detailed breakdown of related records

### `/api/admin/test-data/delete` (New)
- **DELETE**: Delete specific product or organization with cascade
- Query params: `type` (product/organization) and `id`
- Handles proper cascading deletion order

## Cascade Deletion Logic

### Product Deletion
1. Campaign activities
2. Scheduled emails
3. Email templates
4. Email quality scores
5. Campaigns
6. RFQs
7. Tracking records
8. Product itself

### Organization Deletion
1. All campaign-related data (for products in org)
2. RFQs (for products in org)
3. Tracking records (for products in org)
4. Products
5. User profiles
6. Subscriptions
7. Document extractions
8. Organization itself

## UI Components

### New Components Created
1. **`product-test-data-tab.tsx`**
   - Product listing with search/filter
   - Mark as test toggle
   - Delete with preview dialog

2. **`organization-test-data-tab.tsx`**
   - Organization listing with search/filter
   - Mark as test toggle
   - Delete with preview dialog

3. **`bulk-test-data-tab.tsx`**
   - Bulk operations for all test data
   - Preview and delete all functionality

### Page Structure
```
/admin/test-data
├── Products Tab
├── Organizations Tab
└── Bulk Actions Tab
```

## Workflow

### Mark as Test Data
1. Navigate to Products or Organizations tab
2. Find the item you want to mark
3. Toggle the "Test Data" switch
4. Item is immediately marked as test/production data

### Delete Individual Item
1. Navigate to Products or Organizations tab
2. Find the item you want to delete
3. Click the delete button (trash icon)
4. **Preview shows**:
   - Related data counts
   - Total records to be deleted
   - Warning message
5. Confirm deletion
6. All related data is deleted in proper cascade order

### Bulk Delete All Test Data
1. Navigate to Bulk Actions tab
2. Click "Preview All Test Data"
3. Review the breakdown by table
4. Click "Delete All Test Data"
5. Confirm the action
6. All test data across database is deleted

## Safety Features

### Confirmation Dialogs
- All deletion actions require confirmation
- Clear warning messages about permanent deletion
- Preview of affected records before deletion

### Admin-Only Access
- All endpoints verify Pitchivo admin status
- Proper authentication and authorization checks

### Proper Cascade Order
- Deletions happen in correct order to avoid foreign key conflicts
- All related data is removed to maintain database integrity

## Technical Details

### Database Fields
- `is_test` boolean flag on:
  - `organizations`
  - `products`
  - `campaigns`
  - `product_rfqs`

### Query Optimization
- Counts performed before deletion for accurate reporting
- Efficient bulk operations with `IN` clauses
- Indexed test data flags for faster queries

### Error Handling
- Try-catch blocks for all operations
- Detailed error messages
- Toast notifications for user feedback

## Usage Examples

### Mark Multiple Products as Test
1. Go to Products tab
2. Search/filter to find products
3. Toggle each product's "Test Data" switch
4. Products are now marked for bulk cleanup

### Delete a Product with All Campaigns
1. Go to Products tab
2. Find the product
3. Click delete button
4. Preview shows: 5 campaigns, 12 RFQs, 47 tracking records
5. Confirm deletion
6. All 65 records deleted successfully

### Clean Up All Test Data
1. Create test products and orgs during development
2. Mark them as test data using toggles
3. Go to Bulk Actions tab
4. Preview shows all test data across database
5. Delete all with one click
6. Database is clean for production

## Benefits

1. **Organized Testing**: Clearly separate test from production data
2. **Easy Cleanup**: Remove test data without affecting production
3. **Safe Deletion**: Preview before deleting, with cascade awareness
4. **Flexible Management**: Individual or bulk operations
5. **Clear Visibility**: See exactly what will be deleted
6. **Complete Removal**: All related data properly cleaned up

## Future Enhancements

Possible additions:
- Export test data before deletion
- Scheduled automatic cleanup
- Test data templates
- Restore deleted data (soft delete)
- Audit log of deletions

