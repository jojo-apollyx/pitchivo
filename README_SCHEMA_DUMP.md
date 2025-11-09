# Database Schema Documentation

This project includes an automated database schema dumping feature to help developers and AI assistants understand the current database structure.

## Generated Files

Two schema files are automatically generated:

1. **`DATABASE_SCHEMA.md`** (Root directory)
   - Complete database schema with full SQL DDL
   - Includes table overview with row counts
   - Full schema dump with all objects (tables, indexes, functions, policies, etc.)
   - Best for detailed reference and debugging

2. **`supabase/CURRENT_SCHEMA.md`** (Supabase directory)
   - Simplified version with just table definitions
   - Easier to read and scan quickly
   - Best for quick reference when coding

## Usage

### Manual Schema Dump

Run the schema dump manually at any time:

```bash
npm run supabase:dump-schema
```

### Automatic Schema Dump

The schema is automatically dumped after running migrations:

```bash
npm run supabase:migrate:run <migration-file.sql>
```

For example:
```bash
npm run supabase:migrate:run 20240101000016_add_is_public_domain_column.sql
```

### Standard Supabase Migrations

When using standard Supabase migrations, manually run the dump after:

```bash
npm run supabase:migrate       # Push migrations
npm run supabase:dump-schema   # Dump updated schema
```

## Benefits

### For Developers
- Quick reference without opening the database
- Version-controlled schema documentation
- Easy to review schema changes in pull requests
- Helps understand table relationships

### For AI Assistants
- Accurate table structure information
- Prevents errors from outdated schema assumptions
- Helps generate correct queries and migrations
- Reduces need to query database metadata

## Git Configuration

By default, schema files are **committed to the repository** to provide accurate documentation for all developers and AI assistants.

If you prefer not to commit them, uncomment these lines in `.gitignore`:

```gitignore
# Auto-generated schema files (optional: remove these lines if you want to commit schema files)
# DATABASE_SCHEMA.md
# supabase/CURRENT_SCHEMA.md
```

## Troubleshooting

### pg_dump Version Mismatch
The script automatically uses `supabase db dump` to avoid version mismatches. If you see any errors, make sure:
- Supabase is running: `supabase status`
- You have Supabase CLI installed: `supabase --version`

### Connection Issues
The script automatically detects the connection string from `supabase status`. If it fails, it falls back to the default local connection.

## Technical Details

The dump script:
1. Checks if Supabase is running
2. Gets the connection string from `supabase status`
3. Uses `supabase db dump` for complete schema
4. Queries system tables for table statistics
5. Generates two markdown files with different levels of detail
6. Reports file sizes and success status

Schema includes:
- Tables with all columns and constraints
- Indexes
- Functions and procedures
- RLS (Row Level Security) policies
- Triggers
- Extensions
- Views

## Example Output

```
📊 Dumping Database Schema...
📥 Fetching schema from database...
Dumping schemas from local database...
✅ Schema dumped successfully to: DATABASE_SCHEMA.md
📄 File size: 33.49 KB
✅ Simplified schema also saved to: supabase/CURRENT_SCHEMA.md
```

