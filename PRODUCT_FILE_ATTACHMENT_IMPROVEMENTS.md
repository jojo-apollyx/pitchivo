# Product File Attachment Improvements

## Summary
This update improves the product creation workflow to ensure uploaded files are always attached to products (regardless of analysis success/failure) and makes error messages more user-friendly while maintaining technical logging for debugging.

## Changes Made

### 1. **File Attachment to Products** ✅
**Problem**: Uploaded files were not being linked to products when saving/publishing.

**Solution**: 
- Modified `handleSaveDraft` and `handlePublish` functions to include all uploaded files in `product_data.uploaded_files`
- Files are now attached regardless of analysis status (pending, analyzing, completed, or failed)
- Each file reference includes: `file_id`, `filename`, `mime_type`, `analysis_status`, and `uploaded_at`

**Files Changed**:
- `/apps/web/app/dashboard/products/create/page.tsx` (lines 1065-1071, 1189-1195)

### 2. **User-Friendly Error Messages** ✅
**Problem**: Error messages exposed technical details to end users, making the application feel unpolished.

**Solution**:
- Updated all error responses to show user-friendly messages
- Technical details are still logged to console for debugging
- Error messages now guide users on next steps

**Examples**:
- Old: `"Failed to upload file to storage", details: "Storage upload failed. Please check if the documents bucket exists..."`
- New: `"Failed to upload file. Please check your file and try again. If the problem persists, contact support."`

**Files Changed**:
- `/apps/web/app/api/[industry_code]/documents/extract/route.ts` (lines 73-110, 121-137)
- `/apps/web/app/api/documents/upload/route.ts` (lines 156-193)
- `/apps/web/app/dashboard/products/create/page.tsx` (lines 309-438, 633-655)

**User-Friendly Messages**:
- Document preparation: "Failed to prepare document for analysis..."
- Analysis failure: "Unable to analyze document. The file may be corrupted..."
- Save failure: "Analysis completed but failed to save results..."
- Upload failure: "Failed to upload file. Please check your file..."
- General errors: "An unexpected error occurred..."

### 3. **Validation Updates** ✅
**Problem**: Validation required files to be "reviewed" to publish, but now files should be included regardless of status.

**Solution**:
- Updated validation to accept any uploaded files (regardless of analysis or review status)
- Clarified error message: "At least one document is required. Please upload a file."

**Files Changed**:
- `/apps/web/app/dashboard/products/create/validation.ts` (lines 269-288)

### 4. **Database Schema Cleanup** ✅

#### **Removed `product_field_applications` Table**
**Finding**: The `product_field_applications` table was created but never used in the codebase.

**Solution**:
- Created migration to drop the table and its triggers
- Updated TypeScript types to remove references
- The simpler approach of storing file IDs in `product_data` JSON is more flexible

**Files Changed**:
- Created: `/supabase/migrations/20240101000035_drop_product_field_applications.sql`
- Updated: `/apps/web/lib/database.types.ts` (removed ProductFieldApplication type)

#### **Kept `raw_extracted_data` Column**
**Finding**: The `raw_extracted_data` column IS being used (in `/apps/web/lib/document-processing/shared.ts` line 669).

**Decision**: Keep the column as it stores the raw AI response for debugging and audit purposes.

## Migration Required

Run the following migration to remove the unused table:

```bash
# Apply the migration
npx supabase db push
```

Or manually run:
```sql
-- See: /supabase/migrations/20240101000035_drop_product_field_applications.sql
```

## Testing Recommendations

1. **File Upload Flow**:
   - ✅ Upload a valid document → should analyze successfully
   - ✅ Upload an invalid/corrupted file → should show user-friendly error
   - ✅ Upload file and save draft → file should be attached to product
   - ✅ Upload file and publish → file should be attached to product

2. **Error Messages**:
   - ✅ Trigger various error conditions and verify user-friendly messages
   - ✅ Check console logs to ensure technical details are still logged

3. **Validation**:
   - ✅ Try to publish without files → should show clear error
   - ✅ Upload file (even if analysis fails) → should allow publishing

## Data Structure

Uploaded files are now stored in `products.product_data` as:

```json
{
  "product_name": "Example Product",
  "uploaded_files": [
    {
      "file_id": "uuid-here",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "analysis_status": "completed",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Benefits

1. **Better UX**: Users see helpful error messages instead of technical jargon
2. **File Tracking**: All uploaded files are now tracked with products
3. **Debugging**: Technical details still logged for developers
4. **Simpler Schema**: Removed unused table, making codebase cleaner
5. **Flexibility**: Files attached regardless of analysis status

## Notes

- The `reference_count` field on `document_extractions` is no longer incremented by `product_field_applications` triggers
- Files can still be soft-deleted (via `deleted_at` column)
- The relationship between products and files is now one-way (product stores file IDs in JSONB)

