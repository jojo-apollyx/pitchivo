# Migration Instructions

## Required Migration: Drop product_field_applications Table

A new migration has been created to drop the unused `product_field_applications` table:
- **File**: `/supabase/migrations/20240101000035_drop_product_field_applications.sql`

### To Apply the Migration:

**Option 1: Using Supabase CLI (Recommended)**
```bash
cd /Users/therealjojo/PycharmProjects/pitchivo
npx supabase db push
```

**Option 2: Manual SQL Execution**
If the CLI doesn't work, run the SQL directly in Supabase Studio or your database client:

```sql
-- Drop dependent triggers first
DROP TRIGGER IF EXISTS product_field_applications_insert ON public.product_field_applications;
DROP TRIGGER IF EXISTS product_field_applications_delete ON public.product_field_applications;

-- Drop the table (CASCADE will drop any remaining dependencies)
DROP TABLE IF EXISTS public.product_field_applications CASCADE;
```

### Verification

After running the migration, verify it was successful:

```sql
-- This should return no rows
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_field_applications';
```

### Rollback (if needed)

If you need to rollback, you can recreate the table using the original migration:
- See: `/supabase/migrations/20240101000031_create_document_extractions.sql` (lines 45-120)

Note: This is unlikely to be needed since the table was never used in the application.

