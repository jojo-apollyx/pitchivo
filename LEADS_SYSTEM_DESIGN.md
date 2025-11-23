# Market Intelligence & Lead Generation System
## Design Document & Implementation Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Proposal / Implementation Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Data Pipeline Design](#data-pipeline-design)
5. [Implementation Guide](#implementation-guide)
6. [Code Examples](#code-examples)
7. [Migration Scripts](#migration-scripts)
8. [API Design](#api-design)
9. [Testing & Validation](#testing--validation)
10. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Purpose

This document describes a **Market Intelligence & Lead Generation System** that transforms raw scraped data into actionable business intelligence. The system tracks:

- **What** (Market Items): Products, ingredients, chemicals being traded
- **Who** (Organizations): Companies that buy, supply, or manufacture
- **Who** (Contacts): Specific decision-makers within organizations
- **How** (Signals): Evidence of relationships and interactions

### Key Features

- ✅ **Multi-source data ingestion** (MongoDB, scrapers, CSV uploads)
- ✅ **Identity resolution** (deduplication via domain matching & fuzzy search)
- ✅ **Vector search** (semantic similarity using pgvector)
- ✅ **Data enrichment** (automatic API-based enrichment)
- ✅ **Feedback loops** (human verification & locked fields)
- ✅ **Staging pipeline** (safe data imports with validation)
- ✅ **Suppression lists** (blacklist management)
- ✅ **Audit trails** (change tracking)

### Design Principles

1. **Namespace isolation**: All tables use `leads_` prefix to separate intelligence data from application logic
2. **Event-driven relationships**: Organizations have roles based on signals, not static flags
3. **Human-in-the-loop**: Manual corrections are protected from automated overwrites
4. **Scalable architecture**: Designed to handle millions of records with proper indexing

---

## System Architecture

### High-Level Overview

```
┌─────────────────┐
│  Data Sources   │
│  - MongoDB      │
│  - Scrapers     │
│  - CSV Uploads  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Staging Layer  │
│  (Validation)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Normalization  │
│  - Deduplication│
│  - Enrichment   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Core Tables    │
│  - Items        │
│  - Orgs         │
│  - Contacts     │
│  - Signals      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Application    │
│  - Search       │
│  - Analytics    │
│  - Campaigns    │
└─────────────────┘
```

### Processing Pipeline

1. **Ingestion**: Raw data enters `leads_staging_imports`
2. **Validation**: Edge function validates structure & checks suppression list
3. **Normalization**: 
   - Resolve organization duplicates (domain matching, fuzzy name matching)
   - Normalize item names (lowercase, trim, aliases)
4. **Enrichment**: Trigger webhook to enrich organization data (domain, emails, LinkedIn)
5. **Resolution**: Insert/update core tables with conflict resolution
6. **Feedback**: Human corrections lock fields to prevent overwrites

---

## Database Schema

### Prerequisites

Enable required PostgreSQL extensions:

```sql
-- Enable vector search (for semantic similarity)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable fuzzy text matching (for deduplication)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable audit logging (optional but recommended)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Core Tables

#### 1. `leads_sources`

Tracks where data originated from. Critical for data lineage and trust scoring.

```sql
CREATE TABLE leads_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  trust_score float DEFAULT 0.5 CHECK (trust_score >= 0.0 AND trust_score <= 1.0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_leads_sources_name ON leads_sources(name);
CREATE INDEX idx_leads_sources_active ON leads_sources(is_active) WHERE is_active = true;
```

**Example Data:**
```sql
INSERT INTO leads_sources (name, description, trust_score) VALUES
  ('Mongo_Import_2024', 'Historical data from MongoDB export', 0.8),
  ('LinkedIn_Scraper_v1', 'Automated LinkedIn company scraper', 0.6),
  ('Manual_Entry', 'Data entered by sales team', 1.0);
```

#### 2. `leads_market_items`

The "What" - Products, ingredients, chemicals being traded.

```sql
CREATE TABLE leads_market_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text UNIQUE NOT NULL, -- For deduplication: lower(trim(name))
  
  -- Vector embedding for semantic search (1536 dimensions = OpenAI standard)
  embedding vector(1536),
  
  -- Categorization
  category text, -- 'Amino Acid', 'Preservative', 'Flavoring'
  item_type text NOT NULL DEFAULT 'food_ingredient', -- 'food_ingredient', 'industrial_chemical', 'packaging', 'machinery'
  
  -- Synonyms and aliases for matching
  aliases text[] DEFAULT '{}',
  
  -- Hierarchical relationships (optional)
  parent_id uuid REFERENCES leads_market_items(id),
  
  -- Flexible attributes (CAS numbers, molecular weight, etc.)
  attributes jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_leads_market_items_normalized_name ON leads_market_items(normalized_name);
CREATE INDEX idx_leads_market_items_item_type ON leads_market_items(item_type);
CREATE INDEX idx_leads_market_items_category ON leads_market_items(category);
CREATE INDEX idx_leads_market_items_parent_id ON leads_market_items(parent_id);
CREATE INDEX idx_leads_market_items_aliases ON leads_market_items USING GIN(aliases);

-- Vector similarity search index (HNSW for fast approximate search)
CREATE INDEX idx_leads_market_items_embedding ON leads_market_items 
  USING hnsw (embedding vector_cosine_ops);

-- Trigger to auto-update normalized_name
CREATE OR REPLACE FUNCTION leads_market_items_normalize_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := lower(trim(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_market_items_normalize_trigger
  BEFORE INSERT OR UPDATE ON leads_market_items
  FOR EACH ROW
  EXECUTE FUNCTION leads_market_items_normalize_name();
```

**Example Data:**
```sql
INSERT INTO leads_market_items (name, category, item_type, aliases, attributes) VALUES
  ('Garlic Extract', 'Vegetable Extracts', 'food_ingredient', 
   ARRAY['Allium Sativum Extract', 'Garlic Oil'], 
   '{"cas_number": "8000-78-0", "shelf_life_days": 365}'::jsonb),
  ('Whey Protein Isolate', 'Proteins', 'food_ingredient',
   ARRAY['WPI', 'Whey Isolate'],
   '{"protein_content_percent": 90, "lactose_free": true}'::jsonb);
```

#### 3. `leads_organizations`

The "Who" - Companies that buy, supply, or manufacture.

```sql
CREATE TABLE leads_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL, -- For deduplication
  domain text, -- Primary key for deduplication (e.g. 'nestle.com')
  
  -- Location
  location_country text,
  location_city text,
  location_state text,
  
  -- Roles are calculated from signals, not stored here
  -- But we can cache them for performance
  cached_roles text[] DEFAULT '{}', -- ['buyer', 'supplier', 'logistics']
  
  -- Locked fields prevent automated overwrites
  locked_fields text[] DEFAULT '{}', -- ['name', 'revenue', 'domain']
  
  -- Flexible profile data (Industry, Revenue, Employee Count, etc.)
  profile_data jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_organizations_normalized_name ON leads_organizations(normalized_name);
CREATE INDEX idx_leads_organizations_domain ON leads_organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_leads_organizations_location_country ON leads_organizations(location_country);
CREATE INDEX idx_leads_organizations_cached_roles ON leads_organizations USING GIN(cached_roles);
CREATE INDEX idx_leads_organizations_profile_data ON leads_organizations USING GIN(profile_data);

-- Fuzzy text matching index for deduplication
CREATE INDEX idx_leads_organizations_name_trgm ON leads_organizations 
  USING gin(name gin_trgm_ops);

-- Trigger to auto-update normalized_name and updated_at
CREATE OR REPLACE FUNCTION leads_organizations_normalize()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := lower(trim(NEW.name));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_organizations_normalize_trigger
  BEFORE INSERT OR UPDATE ON leads_organizations
  FOR EACH ROW
  EXECUTE FUNCTION leads_organizations_normalize();
```

**Example Data:**
```sql
INSERT INTO leads_organizations (name, domain, location_country, profile_data) VALUES
  ('Nestlé S.A.', 'nestle.com', 'Switzerland',
   '{"revenue_usd": 93000000000, "employees": 273000, "industry": "Food & Beverage"}'::jsonb),
  ('General Mills Inc.', 'generalmills.com', 'United States',
   '{"revenue_usd": 18000000000, "employees": 35000, "industry": "Food Manufacturing"}'::jsonb);
```

#### 4. `leads_contacts`

The specific people you want to sell to.

```sql
CREATE TABLE leads_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES leads_organizations(id) ON DELETE CASCADE,
  
  -- Identity
  first_name text,
  last_name text,
  full_name text GENERATED ALWAYS AS (trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
  email text,
  linkedin_url text,
  title text,
  
  -- Email hygiene & campaign feedback
  email_status text DEFAULT 'unknown' CHECK (email_status IN (
    'unknown', 'valid', 'bounced', 'unsubscribed', 'risky', 'invalid'
  )),
  
  -- Employment status
  is_current boolean DEFAULT true,
  employment_verified_at timestamptz,
  
  -- Compliance
  consent_status text DEFAULT 'unknown' CHECK (consent_status IN (
    'unknown', 'consented', 'opted_out', 'pending'
  )),
  
  -- Flexible attributes (Phone, Bio, Personal Email, etc.)
  attributes jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_leads_contacts_email_unique ON leads_contacts(email) 
  WHERE email IS NOT NULL;
CREATE INDEX idx_leads_contacts_org_id ON leads_contacts(org_id);
CREATE INDEX idx_leads_contacts_email_status ON leads_contacts(email_status);
CREATE INDEX idx_leads_contacts_is_current ON leads_contacts(is_current) WHERE is_current = true;
CREATE INDEX idx_leads_contacts_linkedin_url ON leads_contacts(linkedin_url) 
  WHERE linkedin_url IS NOT NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION leads_contacts_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_contacts_update_timestamp_trigger
  BEFORE UPDATE ON leads_contacts
  FOR EACH ROW
  EXECUTE FUNCTION leads_contacts_update_timestamp();
```

**Example Data:**
```sql
INSERT INTO leads_contacts (org_id, first_name, last_name, email, title, email_status) VALUES
  ((SELECT id FROM leads_organizations WHERE domain = 'nestle.com'),
   'John', 'Smith', 'john.smith@nestle.com', 'Procurement Manager', 'valid'),
  ((SELECT id FROM leads_organizations WHERE domain = 'generalmills.com'),
   'Jane', 'Doe', 'jane.doe@generalmills.com', 'VP of Supply Chain', 'unknown');
```

#### 5. `leads_signals`

The core engine - records evidence of relationships and interactions.

```sql
CREATE TABLE leads_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  org_id uuid REFERENCES leads_organizations(id) ON DELETE CASCADE,
  item_id uuid REFERENCES leads_market_items(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES leads_contacts(id) ON DELETE SET NULL, -- Optional
  
  -- Source tracking
  source_id uuid REFERENCES leads_sources(id),
  
  -- The interaction type (the "verb")
  interaction_type text NOT NULL CHECK (interaction_type IN (
    -- Scraped data
    'purchased', 'supplied', 'manufactured', 'imported', 'exported',
    -- Marketplace feedback
    'viewed_item', 'requested_sample', 'added_to_cart', 'requested_quote',
    -- Email campaign feedback
    'clicked_link', 'replied_interested', 'replied_not_interested', 'opened_email',
    -- Other
    'mentioned_in_article', 'patent_filed', 'partnership_announced'
  )),
  
  -- Temporal context
  event_date date DEFAULT CURRENT_DATE,
  
  -- Source identifier (human-readable)
  source text, -- 'Mongo_Scrape', 'Website_Marketplace', 'Email_Campaign_Q3'
  
  -- Flexible metadata (Quantity, Campaign Name, Email Subject, etc.)
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Raw evidence (for your Mongo migration, dump the whole object here)
  raw_data jsonb DEFAULT '{}'::jsonb,
  
  -- Human verification
  is_verified boolean DEFAULT false,
  verified_by uuid, -- Reference to auth.users(id) if you have user tracking
  verified_at timestamptz,
  user_notes text,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_signals_org_id ON leads_signals(org_id);
CREATE INDEX idx_leads_signals_item_id ON leads_signals(item_id);
CREATE INDEX idx_leads_signals_contact_id ON leads_signals(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_leads_signals_source_id ON leads_signals(source_id);
CREATE INDEX idx_leads_signals_interaction_type ON leads_signals(interaction_type);
CREATE INDEX idx_leads_signals_event_date ON leads_signals(event_date);
CREATE INDEX idx_leads_signals_source ON leads_signals(source);
CREATE INDEX idx_leads_signals_is_verified ON leads_signals(is_verified) WHERE is_verified = true;
CREATE INDEX idx_leads_signals_created_at ON leads_signals(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_leads_signals_org_item ON leads_signals(org_id, item_id);
```

**Example Data:**
```sql
INSERT INTO leads_signals (org_id, item_id, interaction_type, event_date, source, metadata) VALUES
  ((SELECT id FROM leads_organizations WHERE domain = 'nestle.com'),
   (SELECT id FROM leads_market_items WHERE normalized_name = 'garlic extract'),
   'purchased', '2024-01-15', 'Mongo_Scrape',
   '{"quantity_kg": 5000, "price_per_kg": 12.50}'::jsonb),
  ((SELECT id FROM leads_organizations WHERE domain = 'generalmills.com'),
   (SELECT id FROM leads_market_items WHERE normalized_name = 'whey protein isolate'),
   'viewed_item', CURRENT_DATE, 'Website_Marketplace',
   '{"session_id": "abc123", "page_views": 3}'::jsonb);
```

### Supporting Tables

#### 6. `leads_staging_imports`

Staging area for safe data imports.

```sql
CREATE TABLE leads_staging_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL, -- Groups related imports together
  
  -- Source identification
  source text NOT NULL, -- 'Mongo_Dump', 'Web_Scraper_V1', 'CSV_Upload_2024'
  source_id uuid REFERENCES leads_sources(id),
  
  -- Raw payload from scraper/import
  raw_payload jsonb NOT NULL,
  
  -- Processing status
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'processed', 'failed', 'skipped'
  )),
  
  -- Error tracking
  error_message text,
  error_details jsonb,
  
  -- Processing metadata
  processed_at timestamptz,
  processed_by text, -- 'edge_function', 'manual', 'migration_script'
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_staging_imports_batch_id ON leads_staging_imports(batch_id);
CREATE INDEX idx_leads_staging_imports_status ON leads_staging_imports(status);
CREATE INDEX idx_leads_staging_imports_source ON leads_staging_imports(source);
CREATE INDEX idx_leads_staging_imports_created_at ON leads_staging_imports(created_at DESC);
```

#### 7. `leads_suppression_list`

Blacklist for domains, emails, and company names.

```sql
CREATE TABLE leads_suppression_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What are we blocking?
  block_type text NOT NULL CHECK (block_type IN (
    'domain', 'email', 'company_name', 'email_domain'
  )),
  value text NOT NULL, -- 'amazon.com', 'competitor_x', 'bad_actor@gmail.com'
  
  -- Normalized value for matching
  normalized_value text NOT NULL,
  
  -- Context
  reason text, -- 'Competitor', 'Hard Bounce', 'Legal Threat', 'Spam Trap'
  notes text,
  
  -- Metadata
  created_by uuid, -- Reference to auth.users(id)
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional: temporary suppression
  
  UNIQUE(block_type, normalized_value)
);

-- Indexes
CREATE INDEX idx_leads_suppression_list_type_value ON leads_suppression_list(block_type, normalized_value);
CREATE INDEX idx_leads_suppression_list_expires ON leads_suppression_list(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Trigger to normalize value
CREATE OR REPLACE FUNCTION leads_suppression_list_normalize()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_value := lower(trim(NEW.value));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_suppression_list_normalize_trigger
  BEFORE INSERT OR UPDATE ON leads_suppression_list
  FOR EACH ROW
  EXECUTE FUNCTION leads_suppression_list_normalize();
```

**Example Data:**
```sql
INSERT INTO leads_suppression_list (block_type, value, reason) VALUES
  ('domain', 'amazon.com', 'Too large, not our target market'),
  ('email', 'test@example.com', 'Test email address'),
  ('company_name', 'Competitor XYZ', 'Direct competitor');
```

#### 8. `leads_audit_log` (Optional but Recommended)

Track all changes for compliance and debugging.

```sql
CREATE TABLE leads_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What changed?
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  
  -- Who changed it?
  user_id uuid, -- Reference to auth.users(id)
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- What changed?
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  
  -- Context
  ip_address inet,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_audit_log_table_record ON leads_audit_log(table_name, record_id);
CREATE INDEX idx_leads_audit_log_user_id ON leads_audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_leads_audit_log_created_at ON leads_audit_log(created_at DESC);
```

---

## Data Pipeline Design

### Pipeline Stages

#### Stage 1: Ingestion

**Input**: Raw JSON from MongoDB, scrapers, or CSV uploads  
**Output**: Records in `leads_staging_imports`

**Process**:
1. Receive raw data payload
2. Generate `batch_id` (UUID) to group related imports
3. Insert into `leads_staging_imports` with `status = 'pending'`
4. Trigger processing function (via database trigger or webhook)

**Example**:
```typescript
// Pseudo-code for ingestion
async function ingestRawData(rawPayload: any, source: string) {
  const batchId = crypto.randomUUID();
  
  await supabase
    .from('leads_staging_imports')
    .insert({
      batch_id: batchId,
      source: source,
      raw_payload: rawPayload,
      status: 'pending'
    });
  
  // Trigger processing (async)
  await triggerProcessing(batchId);
}
```

#### Stage 2: Validation

**Input**: Records from `leads_staging_imports`  
**Output**: Validated records ready for normalization

**Checks**:
1. ✅ Required fields present (name, email if contact, etc.)
2. ✅ Email format valid (if email provided)
3. ✅ Not in suppression list
4. ✅ Data structure matches expected schema

**Example**:
```typescript
async function validateStagingRecord(record: any) {
  const errors: string[] = [];
  
  // Check suppression list
  if (record.email) {
    const suppressed = await checkSuppressionList('email', record.email);
    if (suppressed) {
      errors.push('Email is in suppression list');
    }
  }
  
  if (record.domain) {
    const suppressed = await checkSuppressionList('domain', record.domain);
    if (suppressed) {
      errors.push('Domain is in suppression list');
    }
  }
  
  // Validate email format
  if (record.email && !isValidEmail(record.email)) {
    errors.push('Invalid email format');
  }
  
  // Check required fields
  if (!record.organization_name && !record.company_name) {
    errors.push('Organization name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### Stage 3: Normalization & Deduplication

**Input**: Validated staging records  
**Output**: Resolved organization/item IDs (create new or match existing)

**Process**:

**For Organizations**:
1. Check domain match (exact match = highest confidence)
2. If no domain, check fuzzy name match using `pg_trgm`
3. If match found, return existing ID
4. If no match, create new organization

**For Market Items**:
1. Check normalized name (exact match)
2. Check aliases array
3. If match found, return existing ID
4. If no match, create new item

**Example**:
```sql
-- Function to find or create organization
CREATE OR REPLACE FUNCTION leads_resolve_organization(
  p_name text,
  p_domain text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_org_id uuid;
  v_normalized_name text;
BEGIN
  v_normalized_name := lower(trim(p_name));
  
  -- First, try exact domain match (highest confidence)
  IF p_domain IS NOT NULL THEN
    SELECT id INTO v_org_id
    FROM leads_organizations
    WHERE domain = lower(trim(p_domain))
    LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
      RETURN v_org_id;
    END IF;
  END IF;
  
  -- Second, try exact normalized name match
  SELECT id INTO v_org_id
  FROM leads_organizations
  WHERE normalized_name = v_normalized_name
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Third, try fuzzy name match (similarity > 0.7)
  SELECT id INTO v_org_id
  FROM leads_organizations
  WHERE similarity(name, p_name) > 0.7
  ORDER BY similarity(name, p_name) DESC
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- No match found, create new organization
  INSERT INTO leads_organizations (name, domain)
  VALUES (p_name, p_domain)
  RETURNING id INTO v_org_id;
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;
```

#### Stage 4: Enrichment (Optional)

**Input**: New organization records  
**Output**: Enriched organization data

**Process**:
1. Trigger webhook when new organization is created
2. Call enrichment API (Apollo, Clearbit, Proxycurl)
3. Update `leads_organizations.profile_data` with enriched data

**Example**:
```typescript
// Supabase Edge Function or webhook handler
async function enrichOrganization(orgId: string) {
  const org = await supabase
    .from('leads_organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  
  if (!org.data || !org.data.domain) return;
  
  // Call enrichment API
  const enriched = await callEnrichmentAPI(org.data.domain);
  
  // Merge with existing profile_data (don't overwrite locked fields)
  const updatedProfile = {
    ...org.data.profile_data,
    ...enriched,
  };
  
  await supabase
    .from('leads_organizations')
    .update({ profile_data: updatedProfile })
    .eq('id', orgId);
}
```

#### Stage 5: Resolution & Insertion

**Input**: Normalized data with resolved IDs  
**Output**: Records in core tables

**Process**:
1. Insert/update organization (respecting locked fields)
2. Insert/update market item
3. Insert/update contact (if provided)
4. Insert signal record
5. Mark staging record as `processed`

**Example**:
```typescript
async function processStagingRecord(stagingId: string) {
  const staging = await supabase
    .from('leads_staging_imports')
    .select('*')
    .eq('id', stagingId)
    .single();
  
  const payload = staging.data.raw_payload;
  
  // Resolve organization
  const orgId = await resolveOrganization(
    payload.organization_name || payload.company_name,
    payload.domain
  );
  
  // Resolve market item
  const itemId = await resolveMarketItem(payload.item_name || payload.product_name);
  
  // Insert signal
  await supabase
    .from('leads_signals')
    .insert({
      org_id: orgId,
      item_id: itemId,
      interaction_type: payload.interaction_type || 'purchased',
      event_date: payload.event_date || new Date().toISOString().split('T')[0],
      source: staging.data.source,
      source_id: staging.data.source_id,
      raw_data: payload,
      metadata: payload.metadata || {}
    });
  
  // Mark as processed
  await supabase
    .from('leads_staging_imports')
    .update({ 
      status: 'processed',
      processed_at: new Date().toISOString()
    })
    .eq('id', stagingId);
}
```

---

## Implementation Guide

### Step 1: Database Setup

**Time Estimate**: 30 minutes

1. **Connect to Supabase SQL Editor**
   - Navigate to your Supabase project
   - Open SQL Editor

2. **Run Extension Setup**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

3. **Create All Tables**
   - Copy the complete SQL from the [Database Schema](#database-schema) section
   - Execute in order: sources → market_items → organizations → contacts → signals → staging → suppression → audit_log

4. **Verify Setup**
   ```sql
   -- Check tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'leads_%'
   ORDER BY table_name;
   
   -- Check extensions
   SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');
   ```

### Step 2: Create Helper Functions

**Time Estimate**: 45 minutes

Create the following database functions for common operations:

#### Function: Check Suppression List

```sql
CREATE OR REPLACE FUNCTION leads_check_suppression(
  p_block_type text,
  p_value text
) RETURNS boolean AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM leads_suppression_list
  WHERE block_type = p_block_type
    AND normalized_value = lower(trim(p_value))
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;
```

#### Function: Resolve Market Item

```sql
CREATE OR REPLACE FUNCTION leads_resolve_market_item(
  p_name text,
  p_aliases text[] DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_item_id uuid;
  v_normalized_name text;
BEGIN
  v_normalized_name := lower(trim(p_name));
  
  -- Try exact normalized name match
  SELECT id INTO v_item_id
  FROM leads_market_items
  WHERE normalized_name = v_normalized_name
  LIMIT 1;
  
  IF v_item_id IS NOT NULL THEN
    RETURN v_item_id;
  END IF;
  
  -- Try aliases match
  IF p_aliases IS NOT NULL THEN
    SELECT id INTO v_item_id
    FROM leads_market_items
    WHERE aliases && p_aliases
    LIMIT 1;
    
    IF v_item_id IS NOT NULL THEN
      RETURN v_item_id;
    END IF;
  END IF;
  
  -- No match, create new
  INSERT INTO leads_market_items (name, aliases)
  VALUES (p_name, COALESCE(p_aliases, ARRAY[]::text[]))
  RETURNING id INTO v_item_id;
  
  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql;
```

#### Function: Update Organization Roles (Cache)

```sql
CREATE OR REPLACE FUNCTION leads_update_org_roles(p_org_id uuid)
RETURNS void AS $$
DECLARE
  v_roles text[];
BEGIN
  -- Calculate roles based on signals
  SELECT ARRAY_AGG(DISTINCT role) INTO v_roles
  FROM (
    SELECT CASE
      WHEN interaction_type IN ('purchased', 'requested_quote', 'viewed_item') THEN 'buyer'
      WHEN interaction_type IN ('supplied', 'manufactured') THEN 'supplier'
      WHEN interaction_type IN ('imported', 'exported') THEN 'logistics'
    END AS role
    FROM leads_signals
    WHERE org_id = p_org_id
      AND interaction_type IN ('purchased', 'supplied', 'manufactured', 'imported', 'exported', 'requested_quote', 'viewed_item')
  ) sub
  WHERE role IS NOT NULL;
  
  -- Update cached roles
  UPDATE leads_organizations
  SET cached_roles = COALESCE(v_roles, ARRAY[]::text[])
  WHERE id = p_org_id;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Create Processing Edge Function

**Time Estimate**: 2 hours

Create a Supabase Edge Function to process staging imports:

**File**: `supabase/functions/process-leads-import/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { batch_id } = await req.json()

    if (!batch_id) {
      return new Response(
        JSON.stringify({ error: 'batch_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all pending records for this batch
    const { data: stagingRecords, error: fetchError } = await supabaseClient
      .from('leads_staging_imports')
      .select('*')
      .eq('batch_id', batch_id)
      .eq('status', 'pending')
      .limit(100) // Process in batches

    if (fetchError) throw fetchError

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const record of stagingRecords || []) {
      try {
        // Mark as processing
        await supabaseClient
          .from('leads_staging_imports')
          .update({ status: 'processing' })
          .eq('id', record.id)

        // Validate
        const validation = await validateRecord(record.raw_payload, supabaseClient)
        if (!validation.isValid) {
          await supabaseClient
            .from('leads_staging_imports')
            .update({
              status: 'failed',
              error_message: validation.errors.join('; ')
            })
            .eq('id', record.id)
          results.failed++
          continue
        }

        // Process
        await processRecord(record, supabaseClient)

        // Mark as processed
        await supabaseClient
          .from('leads_staging_imports')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
            processed_by: 'edge_function'
          })
          .eq('id', record.id)

        results.processed++
      } catch (error) {
        await supabaseClient
          .from('leads_staging_imports')
          .update({
            status: 'failed',
            error_message: error.message,
            error_details: { stack: error.stack }
          })
          .eq('id', record.id)
        results.failed++
        results.errors.push(`${record.id}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function validateRecord(payload: any, supabase: any) {
  const errors: string[] = []

  // Check suppression list
  if (payload.email) {
    const { data } = await supabase.rpc('leads_check_suppression', {
      p_block_type: 'email',
      p_value: payload.email
    })
    if (data) errors.push('Email in suppression list')
  }

  if (payload.domain) {
    const { data } = await supabase.rpc('leads_check_suppression', {
      p_block_type: 'domain',
      p_value: payload.domain
    })
    if (data) errors.push('Domain in suppression list')
  }

  // Validate required fields
  if (!payload.organization_name && !payload.company_name) {
    errors.push('Organization name required')
  }

  return { isValid: errors.length === 0, errors }
}

async function processRecord(record: any, supabase: any) {
  const payload = record.raw_payload

  // Resolve organization
  const { data: orgData } = await supabase.rpc('leads_resolve_organization', {
    p_name: payload.organization_name || payload.company_name,
    p_domain: payload.domain || null
  })
  const orgId = orgData

  // Resolve market item
  const { data: itemData } = await supabase.rpc('leads_resolve_market_item', {
    p_name: payload.item_name || payload.product_name,
    p_aliases: payload.aliases || null
  })
  const itemId = itemData

  // Insert signal
  await supabase
    .from('leads_signals')
    .insert({
      org_id: orgId,
      item_id: itemId,
      interaction_type: payload.interaction_type || 'purchased',
      event_date: payload.event_date || new Date().toISOString().split('T')[0],
      source: record.source,
      source_id: record.source_id,
      raw_data: payload,
      metadata: payload.metadata || {}
    })

  // Update organization roles cache
  await supabase.rpc('leads_update_org_roles', { p_org_id: orgId })
}
```

### Step 4: Create Migration Script

**Time Estimate**: 3 hours

Create a Node.js script to migrate data from MongoDB export:

**File**: `scripts/migrate-mongo-to-leads.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface MongoRecord {
  // Adjust based on your MongoDB schema
  company_name?: string
  organization_name?: string
  domain?: string
  item_name?: string
  product_name?: string
  interaction_type?: string
  event_date?: string
  [key: string]: any
}

async function migrateMongoData(jsonFilePath: string, sourceName: string) {
  // Get or create source
  let { data: source } = await supabase
    .from('leads_sources')
    .select('id')
    .eq('name', sourceName)
    .single()

  if (!source) {
    const { data: newSource } = await supabase
      .from('leads_sources')
      .insert({ name: sourceName, trust_score: 0.8 })
      .select('id')
      .single()
    source = newSource
  }

  const sourceId = source!.id
  const batchId = crypto.randomUUID()

  // Read JSON file
  const rawData = fs.readFileSync(jsonFilePath, 'utf-8')
  const records: MongoRecord[] = JSON.parse(rawData)

  console.log(`Processing ${records.length} records...`)

  // Insert into staging
  const stagingInserts = records.map(record => ({
    batch_id: batchId,
    source: sourceName,
    source_id: sourceId,
    raw_payload: record,
    status: 'pending'
  }))

  // Insert in batches of 1000
  for (let i = 0; i < stagingInserts.length; i += 1000) {
    const batch = stagingInserts.slice(i, i + 1000)
    const { error } = await supabase
      .from('leads_staging_imports')
      .insert(batch)

    if (error) {
      console.error(`Error inserting batch ${i}:`, error)
    } else {
      console.log(`Inserted batch ${i} to ${i + batch.length}`)
    }
  }

  // Trigger processing
  console.log('Triggering processing...')
  const { error: processError } = await supabase.functions.invoke('process-leads-import', {
    body: { batch_id: batchId }
  })

  if (processError) {
    console.error('Error triggering processing:', processError)
  } else {
    console.log('Processing triggered successfully')
  }
}

// Run migration
const jsonFile = process.argv[2]
const sourceName = process.argv[3] || 'Mongo_Import_2024'

if (!jsonFile) {
  console.error('Usage: ts-node migrate-mongo-to-leads.ts <json-file> [source-name]')
  process.exit(1)
}

migrateMongoData(jsonFile, sourceName)
  .then(() => {
    console.log('Migration completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
```

### Step 5: Set Up Vector Embeddings

**Time Estimate**: 2 hours

Create a function to generate and store embeddings for market items:

**File**: `scripts/generate-embeddings.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

async function generateEmbeddings() {
  // Get all items without embeddings
  const { data: items, error } = await supabase
    .from('leads_market_items')
    .select('id, name, category, aliases')
    .is('embedding', null)
    .limit(100) // Process in batches

  if (error) throw error

  for (const item of items || []) {
    // Create text for embedding
    const text = [
      item.name,
      item.category,
      ...(item.aliases || [])
    ].filter(Boolean).join(' ')

    // Generate embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // or 'text-embedding-ada-002'
      input: text
    })

    const embedding = response.data[0].embedding

    // Update item
    await supabase
      .from('leads_market_items')
      .update({ embedding })
      .eq('id', item.id)

    console.log(`Generated embedding for: ${item.name}`)
  }
}

generateEmbeddings()
```

---

## Code Examples

### Example 1: Search Similar Items (Vector Search)

```typescript
async function searchSimilarItems(query: string, limit: number = 10) {
  // Generate embedding for query
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })
  const queryEmbedding = response.data[0].embedding

  // Search using vector similarity
  const { data, error } = await supabase.rpc('match_market_items', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit
  })

  return data
}

// Database function for vector search
// CREATE OR REPLACE FUNCTION match_market_items(
//   query_embedding vector(1536),
//   match_threshold float,
//   match_count int
// )
// RETURNS TABLE (
//   id uuid,
//   name text,
//   category text,
//   similarity float
// )
// LANGUAGE plpgsql
// AS $$
// BEGIN
//   RETURN QUERY
//   SELECT
//     leads_market_items.id,
//     leads_market_items.name,
//     leads_market_items.category,
//     1 - (leads_market_items.embedding <=> query_embedding) AS similarity
//   FROM leads_market_items
//   WHERE leads_market_items.embedding IS NOT NULL
//     AND 1 - (leads_market_items.embedding <=> query_embedding) > match_threshold
//   ORDER BY leads_market_items.embedding <=> query_embedding
//   LIMIT match_count;
// END;
// $$;
```

### Example 2: Find Buyers for Similar Items

```typescript
async function findBuyersForSimilarItems(itemName: string) {
  // First, find similar items
  const similarItems = await searchSimilarItems(itemName, 20)

  if (similarItems.length === 0) return []

  const itemIds = similarItems.map(item => item.id)

  // Find organizations that purchased any of these items
  const { data: signals } = await supabase
    .from('leads_signals')
    .select(`
      org_id,
      item_id,
      interaction_type,
      leads_organizations!inner(name, domain, cached_roles),
      leads_market_items!inner(name)
    `)
    .in('item_id', itemIds)
    .in('interaction_type', ['purchased', 'requested_quote', 'viewed_item'])

  // Group by organization
  const buyers = new Map()
  for (const signal of signals || []) {
    const orgId = signal.org_id
    if (!buyers.has(orgId)) {
      buyers.set(orgId, {
        organization: signal.leads_organizations,
        items: []
      })
    }
    buyers.get(orgId).items.push({
      name: signal.leads_market_items.name,
      interaction: signal.interaction_type
    })
  }

  return Array.from(buyers.values())
}
```

### Example 3: Update Contact Email Status

```typescript
async function updateContactEmailStatus(
  email: string,
  status: 'valid' | 'bounced' | 'unsubscribed' | 'risky' | 'invalid'
) {
  const { data, error } = await supabase
    .from('leads_contacts')
    .update({ email_status: status })
    .eq('email', email)
    .select()

  if (status === 'bounced' || status === 'unsubscribed') {
    // Optionally add to suppression list
    await supabase
      .from('leads_suppression_list')
      .insert({
        block_type: 'email',
        value: email,
        reason: `Email ${status}`
      })
      .onConflict(['block_type', 'normalized_value'])
      .ignore()
  }

  return data
}
```

### Example 4: Lock Organization Field

```typescript
async function lockOrganizationField(orgId: string, fieldName: string) {
  // Get current locked fields
  const { data: org } = await supabase
    .from('leads_organizations')
    .select('locked_fields')
    .eq('id', orgId)
    .single()

  const lockedFields = org?.locked_fields || []

  // Add field if not already locked
  if (!lockedFields.includes(fieldName)) {
    await supabase
      .from('leads_organizations')
      .update({
        locked_fields: [...lockedFields, fieldName]
      })
      .eq('id', orgId)
  }
}
```

---

## Migration Scripts

### Complete Migration SQL

Create a single migration file with all schema changes:

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_leads_system.sql`

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- [Include all table creation SQL from Database Schema section]
-- [Include all function creation SQL from Implementation Guide]
-- [Include all index creation SQL]

-- Seed initial sources
INSERT INTO leads_sources (name, description, trust_score) VALUES
  ('Manual_Entry', 'Data entered manually by team', 1.0),
  ('System_Generated', 'Automatically generated by system', 0.5)
ON CONFLICT (name) DO NOTHING;
```

### Rollback Script

**File**: `supabase/migrations/YYYYMMDDHHMMSS_rollback_leads_system.sql`

```sql
-- Drop in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS leads_audit_log CASCADE;
DROP TABLE IF EXISTS leads_signals CASCADE;
DROP TABLE IF EXISTS leads_contacts CASCADE;
DROP TABLE IF EXISTS leads_staging_imports CASCADE;
DROP TABLE IF EXISTS leads_suppression_list CASCADE;
DROP TABLE IF EXISTS leads_organizations CASCADE;
DROP TABLE IF EXISTS leads_market_items CASCADE;
DROP TABLE IF EXISTS leads_sources CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS leads_resolve_organization CASCADE;
DROP FUNCTION IF EXISTS leads_resolve_market_item CASCADE;
DROP FUNCTION IF EXISTS leads_check_suppression CASCADE;
DROP FUNCTION IF EXISTS leads_update_org_roles CASCADE;
DROP FUNCTION IF EXISTS match_market_items CASCADE;
```

---

## API Design

### REST API Endpoints

#### 1. Ingest Data

```typescript
POST /api/leads/ingest
Body: {
  source: string
  records: Array<{
    organization_name?: string
    domain?: string
    item_name?: string
    interaction_type?: string
    [key: string]: any
  }>
}

Response: {
  batch_id: string
  status: 'pending'
  record_count: number
}
```

#### 2. Search Items (Vector)

```typescript
GET /api/leads/items/search?q=protein&limit=10
Response: {
  items: Array<{
    id: string
    name: string
    category: string
    similarity: number
  }>
}
```

#### 3. Find Buyers

```typescript
GET /api/leads/buyers?item_id=xxx&similar=true
Response: {
  buyers: Array<{
    organization: {
      id: string
      name: string
      domain: string
    }
    items: Array<{
      name: string
      interaction: string
    }>
  }>
}
```

#### 4. Update Contact Status

```typescript
PATCH /api/leads/contacts/:contactId/status
Body: {
  email_status: 'bounced' | 'unsubscribed' | 'valid'
}
```

#### 5. Lock Organization Field

```typescript
POST /api/leads/organizations/:orgId/lock
Body: {
  field: string
}
```

---

## Testing & Validation

### Test Scenarios

#### Scenario 1: Deduplication Test

```sql
-- Insert duplicate organizations
INSERT INTO leads_organizations (name, domain) VALUES
  ('Nestlé S.A.', 'nestle.com'),
  ('Nestle USA', 'nestle.com'),
  ('Nestlé Inc.', NULL);

-- Run resolution function
SELECT leads_resolve_organization('Nestlé', 'nestle.com');
-- Should return the first organization ID

-- Verify only one organization exists per domain
SELECT domain, COUNT(*) 
FROM leads_organizations 
WHERE domain IS NOT NULL 
GROUP BY domain 
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

#### Scenario 2: Suppression List Test

```sql
-- Add to suppression list
INSERT INTO leads_suppression_list (block_type, value, reason) VALUES
  ('email', 'test@example.com', 'Test email');

-- Try to insert contact with suppressed email
-- Should be blocked by validation
```

#### Scenario 3: Vector Search Test

```sql
-- Generate embeddings for test items
-- Then search
SELECT * FROM match_market_items(
  (SELECT embedding FROM leads_market_items WHERE name = 'Whey Protein'),
  0.7,
  10
);
-- Should return similar protein items
```

### Performance Testing

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT o.name, COUNT(s.id) as signal_count
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
WHERE o.cached_roles && ARRAY['buyer']
GROUP BY o.id, o.name
ORDER BY signal_count DESC
LIMIT 100;
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All database migrations tested in staging
- [ ] Extensions enabled (vector, pg_trgm)
- [ ] All tables created with proper indexes
- [ ] Helper functions created and tested
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] Suppression list seeded with known bad data

### Post-Deployment

- [ ] Verify table counts
- [ ] Test ingestion pipeline with sample data
- [ ] Test deduplication logic
- [ ] Test vector search
- [ ] Monitor error rates in staging imports
- [ ] Set up alerts for failed imports
- [ ] Document API endpoints
- [ ] Train team on new system

### Monitoring

- [ ] Set up dashboard for staging import status
- [ ] Monitor processing times
- [ ] Track deduplication rates
- [ ] Alert on high failure rates
- [ ] Monitor vector search performance

---

## Next Steps

1. **Immediate**: Implement staging table and basic ingestion
2. **Short-term**: Add deduplication and suppression list checks
3. **Medium-term**: Implement vector search and embeddings
4. **Long-term**: Add enrichment pipeline and audit logging

---

## Appendix

### A. Common Queries

```sql
-- Find all buyers for a specific item
SELECT DISTINCT o.name, o.domain
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
WHERE s.item_id = 'xxx'
  AND s.interaction_type IN ('purchased', 'requested_quote');

-- Find all items an organization has interacted with
SELECT mi.name, s.interaction_type, s.event_date
FROM leads_signals s
JOIN leads_market_items mi ON mi.id = s.item_id
WHERE s.org_id = 'xxx'
ORDER BY s.event_date DESC;

-- Get organization statistics
SELECT 
  o.name,
  COUNT(DISTINCT s.item_id) as items_count,
  COUNT(DISTINCT s.contact_id) as contacts_count,
  COUNT(s.id) as total_signals
FROM leads_organizations o
LEFT JOIN leads_signals s ON s.org_id = o.id
GROUP BY o.id, o.name
ORDER BY total_signals DESC;
```

### B. Troubleshooting

**Issue**: Vector search returns no results  
**Solution**: Ensure embeddings are generated for all items

**Issue**: Deduplication not working  
**Solution**: Check that `normalized_name` is being set correctly by triggers

**Issue**: Staging imports stuck in 'pending'  
**Solution**: Check Edge Function logs and ensure it's being triggered

---

**End of Document**
