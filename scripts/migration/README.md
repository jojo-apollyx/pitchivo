# MongoDB Migration & Enrichment Scripts

This directory contains scripts for migrating MongoDB data to Supabase and enriching the migrated data.

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root with:
   ```bash
   # MongoDB
   MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/dbname
   
   # Azure Blob Storage
   AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   AZURE_STORAGE_ACCOUNT_KEY=yourstoragekey
   AZURE_STORAGE_CONTAINER_NAME=mongodb-raw-data
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Optional
   BATCH_SIZE=1000
   ```

## Running the Migration

### Step 1: Run Database Migrations

First, ensure the database schema is up to date:

```bash
npm run supabase:migrate
```

This will apply the following migrations:
- `20251126000001_create_leads_tables.sql` - Core leads tables
- `20251126000002_create_leads_enrichment_framework.sql` - Enrichment framework
- `20251126000003_seed_enrichment_providers.sql` - Seed enrichment providers

### Step 2: Run MongoDB Migration

Migrate data from MongoDB to Supabase:

```bash
npm run migrate:mongodb
```

This script will:
1. Connect to MongoDB
2. Extract data in batches (companies, products, contacts, purchases)
3. Upload raw data to Azure Blob Storage
4. Transform and deduplicate data
5. Upload to Supabase

### Step 2.5: Verify Migration (Optional)

After migration, verify the results:

```bash
npm run migrate:verify
```

This script will:
1. Count records in Supabase
2. Show sample data
3. Compare with MongoDB (if connection string provided)
4. Display migration coverage statistics

### Step 3: Run Enrichment (Optional)

After migration, you can enrich the data:

```bash
# Enrich organizations
npm run enrich:organizations

# Enrich contacts
npm run enrich:contacts
```

## Directory Structure

```
scripts/migration/
├── mongodb/
│   ├── index.ts          # Main migration entry point
│   ├── extract.ts        # MongoDB extraction logic
│   ├── transform.ts      # Data transformation
│   ├── deduplicate.ts    # Deduplication logic
│   ├── upload.ts         # Supabase upload
│   ├── azure-storage.ts  # Azure Blob Storage helpers
│   └── types.ts          # MongoDB-specific types
├── shared/
│   ├── supabase-client.ts  # Supabase client setup
│   ├── azure-client.ts     # Azure client setup
│   ├── utils.ts            # Shared utilities
│   └── types.ts            # Shared types
└── enrichment/
    ├── pipeline.ts       # Enrichment pipeline executor
    ├── providers/        # Provider implementations
    └── utils.ts          # Enrichment utilities
```

## Migration Flow

1. **Extract Companies:**
   - Stream companies in batches
   - Upload raw to Azure
   - Transform and deduplicate
   - Insert/update in Supabase
   - Store MongoDB ID → Supabase ID mapping

2. **Extract Market Items:**
   - Stream products and ingredients in batches
   - Transform and deduplicate
   - Insert/update in Supabase
   - Store MongoDB ID → Supabase ID mapping

3. **Extract Contacts:**
   - Stream contacts in batches
   - Resolve company references
   - Insert/update in Supabase

4. **Extract Purchases (Signals):**
   - Stream purchases in batches
   - Resolve buyer company and item references
   - Insert as `leads_signals`

## Data Transformation

### Companies → Organizations
- `name` → `name`
- `website_url` → `domain` (extracted)
- `address.country` → `location_country`
- `industries` → `industry_categories`
- `company_type` → `business_type` (determined)
- All other fields → `profile_data` (JSONB)

### Products/Ingredients → Market Items
- `name` → `name`
- `categories[0]` → `category`
- `is_ingredient` → `item_type` ('ingredient' or 'product')
- `name_aliases` → `aliases`
- All other fields → `attributes` (JSONB)

### Purchases → Signals
- `buyer_company` → `org_id` (resolved)
- `ingredient_base_name` → `item_id` (resolved)
- `purchase_date` → `event_date`
- `interaction_type` → 'purchased'
- All other fields → `metadata` (JSONB)

## Troubleshooting

### Connection Issues
- Verify MongoDB connection string format
- Check Azure storage credentials
- Verify Supabase URL and service role key

### Deduplication Issues
- Check if `pg_trgm` extension is enabled (for fuzzy matching)
- Verify normalized names are being generated correctly

### Performance Issues
- Adjust `BATCH_SIZE` environment variable
- Check network connectivity to MongoDB, Azure, and Supabase
- Monitor Supabase rate limits

## Enrichment

After migration, you can enrich the data using the enrichment framework:

### Setup Enrichment Providers

1. **Add API Keys:**
   ```sql
   -- Example: Add Hunter.io API key
   INSERT INTO leads_enrichment_api_keys (provider_id, key_name, api_key, is_active, priority, free_tier_limit, free_tier_reset_date)
   SELECT id, 'Primary Key', 'your-api-key-here', true, 0, 25, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
   FROM leads_enrichment_providers WHERE name = 'hunter_io';
   ```

2. **Run Enrichment:**
   ```bash
   # Enrich organizations
   npm run enrich:organizations
   
   # Enrich contacts
   npm run enrich:contacts
   ```

### Supported Providers

- **Hunter.io**: Domain validation, company enrichment, email finder
- **Clearbit**: Detailed company and contact enrichment
- **NeverBounce**: Email validation
- **OpenAI**: Job title normalization

### Enrichment Pipeline

The enrichment pipeline automatically:
1. Selects available API keys (round-robin)
2. Checks free tier limits
3. Executes enrichment steps in order
4. Records API usage
5. Applies results to entities
6. Handles errors and retries

## Helper Functions

The migration includes several helper functions:

### Database Functions

- `batch_update_organization_cached_roles(org_ids[])` - Batch update cached roles
- `get_organization_statistics(org_id)` - Get comprehensive org statistics
- `resolve_market_item(name, aliases[])` - Resolve market item by name/aliases
- `get_enrichment_provider_stats(provider_id, start_date, end_date)` - Get provider usage stats

### Views

- `v_enrichment_execution_summary` - Summary of enrichment executions
- `v_organizations_needing_enrichment` - Organizations that need enrichment
- `v_contacts_needing_enrichment` - Contacts that need enrichment

### Example Usage

```sql
-- Get organization statistics
SELECT get_organization_statistics('org-uuid-here');

-- Batch update roles for multiple organizations
SELECT * FROM batch_update_organization_cached_roles(ARRAY['uuid1', 'uuid2']);

-- Find organizations needing enrichment
SELECT * FROM v_organizations_needing_enrichment LIMIT 100;

-- Get provider usage stats
SELECT * FROM get_enrichment_provider_stats(NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);
```

## Next Steps

After migration:
1. Verify data quality: `npm run migrate:verify`
2. Add enrichment provider API keys (see SQL examples above)
3. Run enrichment scripts to enhance data
4. Update cached roles: `SELECT update_organization_cached_roles(org_id)` or use batch function
5. Monitor API usage for enrichment providers using `get_enrichment_provider_stats()`

