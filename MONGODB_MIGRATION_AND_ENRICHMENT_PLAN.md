# MongoDB Migration & Enrichment Framework Plan

**Version:** 2.0  
**Last Updated:** 2024  
**Status:** Design / Implementation Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Directory Structure](#directory-structure)
3. [Data Model Design](#data-model-design)
4. [MongoDB Migration Script](#mongodb-migration-script)
5. [Enrichment Framework](#enrichment-framework)
6. [Implementation Strategy](#implementation-strategy)

---

## Executive Summary

This document outlines the strategy for:
- **Migrating large MongoDB datasets** to Supabase leads tables via local scripts
- **Script-based architecture** for easy local execution and testing
- **General-purpose enrichment framework** with multi-provider support
- **Company role tracking** - companies can be buyers AND sellers of different products
- **Free tier management** across multiple API keys per provider
- **Pipeline-based enrichment** with multiple steps and fallbacks

### Key Design Principles

1. **Streaming Migration**: Process MongoDB in batches (no full JSON dumps)
2. **Script-Based**: Executable locally, no container apps needed
3. **Azure Storage**: Raw data stored in Azure Blob Storage (cheap, scalable)
4. **Incremental Enrichment**: Enrich data over time, not all at once
5. **Multi-Provider**: Support multiple enrichment services with free tier optimization
6. **Company Roles**: Track what companies do, buy, and sell (not just one role)
7. **General Industry Support**: Not limited to ingredients/supplements

---

## Directory Structure

```
pitchivo/
├── scripts/
│   └── migration/
│       ├── mongodb/
│       │   ├── index.ts                    # Main migration script
│       │   ├── extract.ts                   # MongoDB extraction logic
│       │   ├── transform.ts                 # Data transformation
│       │   ├── deduplicate.ts               # Deduplication logic
│       │   ├── upload.ts                    # Supabase upload
│       │   ├── azure-storage.ts             # Azure Blob Storage helpers
│       │   └── types.ts                     # TypeScript types
│       ├── shared/
│       │   ├── supabase-client.ts           # Supabase client setup
│       │   ├── azure-client.ts              # Azure client setup
│       │   └── utils.ts                     # Shared utilities
│       └── enrichment/
│           ├── pipeline.ts                  # Enrichment pipeline executor
│           ├── providers/
│           │   ├── hunter-io.ts
│           │   ├── clearbit.ts
│           │   ├── neverbounce.ts
│           │   └── openai.ts
│           └── utils.ts
├── supabase/
│   └── migrations/
│       ├── 20251126000001_create_leads_tables.sql
│       ├── 20251126000002_create_leads_enrichment_framework.sql
│       └── 20251126000003_seed_enrichment_providers.sql
└── .env.example                             # Environment variables template
```

### Script Execution

```bash
# Run MongoDB migration
npm run migrate:mongodb

# Run enrichment for organizations
npm run enrich:organizations

# Run enrichment for contacts
npm run enrich:contacts
```

---

## Data Model Design

### Core Concept: Company Roles

**Key Insight:** A company can be:
- **Buyer** of Product A (purchases from suppliers)
- **Seller** of Product B (sells to customers)
- **Manufacturer** of Product C (produces internally)

**Example:**
- Nestle **buys** Garlic Extract (from suppliers)
- Nestle **sells** Chocolate Products (to retailers)
- Nestle **manufactures** Coffee Products (in-house)

### Updated Schema Design

#### 1. `leads_organizations`

**Core Fields:**
- `id`, `name`, `normalized_name`, `domain`
- `location_country`, `location_city`, `location_state`
- `profile_data` (JSONB) - flexible company data

**Business Activity Fields:**
- `business_type` TEXT[] - What the company does:
  - `'manufacturer'` - Makes products
  - `'distributor'` - Distributes products
  - `'retailer'` - Sells to end consumers
  - `'service_provider'` - Provides services
  - `'logistics'` - Transportation/warehousing
  - `'consultant'` - Consulting services
  - `'technology'` - Tech products/services
  - `'healthcare'` - Healthcare services
  - `'finance'` - Financial services
  - `'education'` - Educational services
  - `'real_estate'` - Real estate
  - `'other'` - Other industries

- `industry_categories` TEXT[] - Industry classifications:
  - `'food_beverage'`
  - `'ingredients_supplements'`
  - `'pharmaceuticals'`
  - `'cosmetics_personal_care'`
  - `'industrial_chemicals'`
  - `'packaging'`
  - `'machinery_equipment'`
  - `'technology_software'`
  - `'healthcare_medical'`
  - `'financial_services'`
  - `'retail_ecommerce'`
  - `'logistics_transportation'`
  - `'energy_utilities'`
  - `'construction'`
  - `'agriculture'`
  - `'other'`

**Note:** Roles (buyer/seller) are **NOT stored here** - they're derived from `leads_signals`

#### 2. `leads_market_items`

**Core Fields:**
- `id`, `name`, `normalized_name`
- `category`, `item_type`
- `aliases`, `parent_id`
- `attributes` (JSONB)

**Item Types (General):**
- `'product'` - Finished products
- `'ingredient'` - Raw materials/ingredients
- `'service'` - Services
- `'equipment'` - Machinery/equipment
- `'software'` - Software products
- `'material'` - Raw materials
- `'component'` - Parts/components
- `'chemical'` - Chemicals
- `'packaging'` - Packaging materials
- `'other'` - Other items

**Categories (General):**
- Flexible text field (not enum) - supports any industry
- Examples: "Food & Beverage", "Pharmaceuticals", "Technology", "Healthcare", etc.

#### 3. `leads_signals` (Core Relationship Engine)

**This is where company roles are tracked:**

```sql
CREATE TABLE leads_signals (
    id UUID PRIMARY KEY,
    
    -- Relationships
    org_id UUID REFERENCES leads_organizations(id),
    item_id UUID REFERENCES leads_market_items(id),
    contact_id UUID REFERENCES leads_contacts(id), -- Optional
    
    -- The interaction type (defines the role)
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        -- Buying activities
        'purchased',           -- Company bought this item
        'requested_quote',     -- Company requested quote for this item
        'viewed_item',         -- Company viewed this item (buying interest)
        'added_to_cart',       -- Company added to cart (buying interest)
        
        -- Selling activities
        'sold',                -- Company sold this item
        'supplied',            -- Company supplied this item
        'listed_for_sale',     -- Company listed this item for sale
        'advertised',          -- Company advertised this item
        
        -- Manufacturing activities
        'manufactured',        -- Company manufactures this item
        'produced',            -- Company produces this item
        
        -- Other activities
        'imported',            -- Company imported this item
        'exported',            -- Company exported this item
        'distributed',         -- Company distributes this item
        'used_in_production',  -- Company uses this item in production
        'mentioned_in_article', -- Item mentioned in company article
        'patent_filed',        -- Company filed patent for this
        'partnership_announced' -- Partnership related to this item
    )),
    
    -- Temporal context
    event_date DATE,
    
    -- Source tracking
    source_id UUID REFERENCES leads_sources(id),
    source TEXT,
    
    -- Metadata (flexible)
    metadata JSONB DEFAULT '{}'::jsonb,  -- quantity, amount, etc.
    raw_data JSONB DEFAULT '{}'::jsonb,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Insight:** 
- Same `org_id` + different `item_id` + different `interaction_type` = different roles
- Example:
  - `org_id: Nestle, item_id: Garlic Extract, interaction_type: 'purchased'` → Nestle is **buyer**
  - `org_id: Nestle, item_id: Chocolate, interaction_type: 'sold'` → Nestle is **seller**

#### 4. Helper Views for Company Roles

```sql
-- View: Companies as buyers
CREATE VIEW v_organizations_as_buyers AS
SELECT DISTINCT
    o.id,
    o.name,
    o.domain,
    i.name AS item_name,
    s.event_date,
    s.metadata
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE s.interaction_type IN ('purchased', 'requested_quote', 'viewed_item', 'added_to_cart');

-- View: Companies as sellers
CREATE VIEW v_organizations_as_sellers AS
SELECT DISTINCT
    o.id,
    o.name,
    o.domain,
    i.name AS item_name,
    s.event_date,
    s.metadata
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE s.interaction_type IN ('sold', 'supplied', 'listed_for_sale', 'advertised');

-- View: Companies as manufacturers
CREATE VIEW v_organizations_as_manufacturers AS
SELECT DISTINCT
    o.id,
    o.name,
    o.domain,
    i.name AS item_name,
    s.event_date
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE s.interaction_type IN ('manufactured', 'produced');
```

#### 5. Cached Roles (Performance Optimization)

```sql
-- Update cached_roles based on signals
CREATE OR REPLACE FUNCTION update_organization_cached_roles(org_id UUID)
RETURNS void AS $$
DECLARE
    v_roles TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check if company is a buyer
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE org_id = update_organization_cached_roles.org_id
        AND interaction_type IN ('purchased', 'requested_quote', 'viewed_item')
        LIMIT 1
    ) THEN
        v_roles := array_append(v_roles, 'buyer');
    END IF;
    
    -- Check if company is a seller
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE org_id = update_organization_cached_roles.org_id
        AND interaction_type IN ('sold', 'supplied', 'listed_for_sale')
        LIMIT 1
    ) THEN
        v_roles := array_append(v_roles, 'seller');
    END IF;
    
    -- Check if company is a manufacturer
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE org_id = update_organization_cached_roles.org_id
        AND interaction_type IN ('manufactured', 'produced')
        LIMIT 1
    ) THEN
        v_roles := array_append(v_roles, 'manufacturer');
    END IF;
    
    -- Update cached roles
    UPDATE leads_organizations
    SET cached_roles = v_roles
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;
```

---

## MongoDB Migration Script

### Overview

Script-based migration that:
- Connects to MongoDB using connection string
- Streams data in batches
- Uploads raw data to Azure Blob Storage
- Transforms and deduplicates
- Uploads to Supabase

### Environment Variables

```bash
# .env
MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/dbname
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
AZURE_STORAGE_ACCOUNT_KEY=yourstoragekey
AZURE_STORAGE_CONTAINER_NAME=mongodb-raw-data
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Script Structure

#### `scripts/migration/mongodb/index.ts`

```typescript
// Main entry point
async function main() {
  // 1. Connect to MongoDB
  // 2. Extract companies in batches
  // 3. For each batch:
  //    - Upload to Azure Blob Storage
  //    - Transform data
  //    - Deduplicate
  //    - Upload to Supabase
  // 4. Repeat for contacts, items, purchases
}
```

#### `scripts/migration/mongodb/extract.ts`

```typescript
// MongoDB extraction logic
export async function extractCompanies(mongoClient, batchSize = 1000) {
  // Stream companies in batches
  // Return async generator
}

export async function extractPurchases(mongoClient, batchSize = 1000) {
  // Stream purchases in batches
}
```

#### `scripts/migration/mongodb/transform.ts`

```typescript
// Transform MongoDB documents to Supabase format
export function transformCompany(mongoDoc) {
  return {
    name: mongoDoc.name,
    domain: extractDomain(mongoDoc.website_url),
    location_country: mongoDoc.address?.country,
    // ... other fields
    mongo_id: mongoDoc._id.toString(),
    business_type: determineBusinessType(mongoDoc),
    industry_categories: mongoDoc.industries || [],
    profile_data: {
      employees: mongoDoc.estimated_employees,
      revenue: mongoDoc.annual_revenue,
      // ... other fields
    }
  };
}

export function transformPurchase(mongoDoc, orgMapping, itemMapping) {
  return {
    org_id: orgMapping.get(mongoDoc.buyer_company.$id),
    item_id: itemMapping.get(mongoDoc.ingredient_base_name),
    interaction_type: 'purchased',
    event_date: mongoDoc.purchase_date,
    metadata: {
      quantity: mongoDoc.quantity,
      amount: mongoDoc.total_amount,
      // ... other fields
    },
    raw_data: mongoDoc
  };
}
```

#### `scripts/migration/mongodb/deduplicate.ts`

```typescript
// Deduplication logic
export async function deduplicateOrganization(supabase, orgData) {
  // 1. Check by domain
  // 2. If not found, fuzzy match by name
  // 3. Return existing ID or null
}
```

#### `scripts/migration/mongodb/azure-storage.ts`

```typescript
// Azure Blob Storage helpers
export async function uploadBatchToAzure(
  containerClient,
  collectionName,
  batchNumber,
  batchData
) {
  // Upload batch as JSONL to Azure Blob Storage
  // Return blob URL
}
```

### Migration Flow

```
1. Connect to MongoDB
2. Create mapping tables (in-memory or temp SQL table)
3. Extract Companies:
   - Stream in batches
   - Upload raw to Azure
   - Transform
   - Deduplicate
   - Insert/update in Supabase
   - Store MongoDB ID → Supabase ID mapping
4. Extract Market Items:
   - Stream in batches
   - Transform
   - Deduplicate
   - Insert/update in Supabase
   - Store MongoDB ID → Supabase ID mapping
5. Extract Contacts:
   - Stream in batches
   - Resolve company.$id → org_id
   - Insert/update in Supabase
6. Extract Purchases (Signals):
   - Stream in batches
   - Resolve buyer_company.$id → org_id
   - Resolve ingredient_base_name → item_id
   - Insert as leads_signals
```

---

## Enrichment Framework

### Table Naming (All with `leads_` prefix)

1. **`leads_enrichment_providers`** - Enrichment service providers
2. **`leads_enrichment_api_keys`** - API keys (multiple per provider)
3. **`leads_enrichment_api_usage`** - API usage tracking
4. **`leads_enrichment_steps`** - Enrichment pipeline steps
5. **`leads_enrichment_executions`** - Execution logs

### Core Functions

1. **`get_available_api_key(provider_id)`** - Round-robin key selection
2. **`check_free_tier_available(provider_id, key_id)`** - Check free tier limits
3. **`record_api_usage(...)`** - Log API calls
4. **`execute_enrichment_step(entity_type, entity_id, step_id)`** - Execute single step
5. **`execute_enrichment_pipeline(entity_type, entity_id)`** - Execute full pipeline

### Enrichment Pipeline Examples

#### Organization Enrichment

```
Step 1: Validate domain
Step 2: Basic enrichment (Hunter.io)
Step 3: Detailed enrichment (Clearbit)
Step 4: Tech stack (BuiltWith)
```

#### Contact Enrichment

```
Step 1: Validate email (NeverBounce)
Step 2: Basic contact data (Hunter.io)
Step 3: Detailed contact data (FullContact)
Step 4: Normalize title (OpenAI)
```

### Adding New Providers

1. Insert into `leads_enrichment_providers`
2. Insert API key(s) into `leads_enrichment_api_keys`
3. Insert step(s) into `leads_enrichment_steps`
4. Implement API call in `scripts/enrichment/providers/new-provider.ts`

---

## Implementation Strategy

### Phase 1: Database Schema (Week 1)

**Tasks:**
1. Update `leads_organizations` with `business_type`, `industry_categories`
2. Update `leads_market_items` with general `item_type` options
3. Update `leads_signals` with comprehensive `interaction_type` values
4. Create enrichment framework tables (all with `leads_` prefix)
5. Create helper views for company roles
6. Create cached roles update function

**Deliverables:**
- Migration files ready
- Schema supports general industries
- Company roles properly modeled

### Phase 2: MongoDB Migration Script (Week 2)

**Tasks:**
1. Create directory structure
2. Implement MongoDB extraction (streaming batches)
3. Implement Azure Blob Storage upload
4. Implement data transformation
5. Implement deduplication logic
6. Implement ID resolution/mapping
7. Test with small dataset

**Deliverables:**
- Migration script functional
- Can migrate test dataset
- Raw data stored in Azure

### Phase 3: Enrichment Framework (Week 3)

**Tasks:**
1. Create enrichment framework tables
2. Seed enrichment providers
3. Implement API key management
4. Implement usage tracking
5. Create enrichment step configurations
6. Implement pipeline executor
7. Add monitoring views

**Deliverables:**
- Enrichment framework functional
- Can add new providers via SQL
- Usage tracking working

### Phase 4: Provider Integration (Week 4)

**Tasks:**
1. Implement Hunter.io integration
2. Implement NeverBounce integration
3. Implement Clearbit integration
4. Implement OpenAI integration
5. Test free tier tracking
6. Test multiple keys per provider

**Deliverables:**
- 4+ providers integrated
- Free tier tracking verified

### Phase 5: Production Migration (Week 5)

**Tasks:**
1. Migrate small test dataset
2. Verify data quality
3. Verify company roles (buyer/seller) are correct
4. Run enrichment on test data
5. Monitor API usage
6. Migrate production data in batches

**Deliverables:**
- Production data migrated
- Company roles correctly tracked
- Enrichment running

---

## Key Design Decisions

### 1. Company Roles via Signals

**Why:** Companies can be buyers AND sellers of different products. Roles are contextual, not static.

**How:** 
- Store roles in `leads_signals` via `interaction_type`
- Use views to query companies by role
- Cache roles in `cached_roles` array for performance

### 2. General Industry Support

**Why:** Not limited to ingredients/supplements - support any industry.

**How:**
- `business_type` and `industry_categories` as flexible arrays
- `item_type` includes general categories (product, service, equipment, etc.)
- `interaction_type` covers all business activities

### 3. Script-Based Migration

**Why:** Easy to run locally, test, and debug. No need for container apps initially.

**How:**
- Node.js/TypeScript scripts
- Environment variables for configuration
- Can run from command line

### 4. Azure Blob Storage for Raw Data

**Why:** 
- Cheap storage for large datasets
- Can reprocess if transformation logic changes
- Audit trail of original data

**How:** Upload raw MongoDB documents to Azure Blob Storage, store URLs in Supabase.

### 5. Multiple API Keys Per Provider

**Why:**
- Increase rate limits
- Failover if one key fails
- Distribute load

**How:**
- Priority field (0 = primary, 1+ = backup)
- Round-robin selection
- Track usage per key

---

## Example Queries

### Find Companies That Buy Product X

```sql
SELECT DISTINCT o.*
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE i.normalized_name = 'garlic extract'
  AND s.interaction_type IN ('purchased', 'requested_quote', 'viewed_item');
```

### Find Companies That Sell Product Y

```sql
SELECT DISTINCT o.*
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE i.normalized_name = 'chocolate products'
  AND s.interaction_type IN ('sold', 'supplied', 'listed_for_sale');
```

### Find Companies That Are Both Buyers and Sellers

```sql
SELECT o.id, o.name, o.domain
FROM leads_organizations o
WHERE 'buyer' = ANY(o.cached_roles)
  AND 'seller' = ANY(o.cached_roles);
```

### Find All Products a Company Buys

```sql
SELECT DISTINCT i.name, i.category, s.event_date, s.metadata
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE o.domain = 'nestle.com'
  AND s.interaction_type IN ('purchased', 'requested_quote');
```

### Find All Products a Company Sells

```sql
SELECT DISTINCT i.name, i.category, s.event_date, s.metadata
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE o.domain = 'nestle.com'
  AND s.interaction_type IN ('sold', 'supplied', 'listed_for_sale');
```

---

## Summary

This plan provides:

1. **Script-Based Migration:**
   - Local execution, no container apps
   - MongoDB streaming in batches
   - Azure Blob Storage for raw data
   - Clean directory structure

2. **General Industry Support:**
   - Not limited to ingredients/supplements
   - Flexible business types and categories
   - Supports any industry

3. **Company Role Tracking:**
   - Companies can be buyers AND sellers
   - Roles tracked via `leads_signals`
   - Views and cached roles for performance

4. **Enrichment Framework:**
   - All tables with `leads_` prefix
   - Multi-provider support
   - Free tier management
   - Easy to add new providers

The system is designed to handle complex business relationships where companies play multiple roles across different products, while supporting any industry vertical.
