# Azure Scraping/Crawling Pipeline Orchestration Framework
## Design Document & Implementation Plan

**Version:** 2.0  
**Last Updated:** 2024  
**Status:** Design / Implementation Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Monorepo Structure](#monorepo-structure)
3. [Architecture Overview](#architecture-overview)
4. [Azure Services Architecture](#azure-services-architecture)
5. [Extensible Pipeline Framework](#extensible-pipeline-framework)
6. [Plugin System](#plugin-system)
7. [Local Development & Testing](#local-development--testing)
8. [Admin Panel Integration](#admin-panel-integration)
9. [Implementation Phases](#implementation-phases)
10. [API Design](#api-design)
11. [Cost Optimization Strategy](#cost-optimization-strategy)

---

## Executive Summary

### Purpose

This document describes a **cost-optimized Azure-based scraping/crawling pipeline orchestration framework** that:

- **Processes raw data in Azure** (cheaper compute/storage)
- **Stores clean data in Supabase** (application database)
- **Provides admin panel integration** for monitoring and management
- **Supports multiple data sources** (MongoDB, web scrapers, APIs, CSV)

### Key Design Principles

1. **Cost Optimization**: Heavy processing in Azure, only clean data to Supabase
2. **Extensibility**: Plugin-based architecture for easy addition of new sources
3. **AI-Friendly**: Monorepo structure, easily testable locally, minimal separate services
4. **Simplicity**: Simple admin UI for pause/resume control
5. **Scalability**: Container Apps + Functions that scale automatically
6. **Observability**: Full pipeline visibility from admin panel

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES (Plugins)                    │
│  MongoDB │ Web Crawlers │ External APIs │ CSV │ Custom       │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│         AZURE CONTAINER APPS (Pipeline Orchestrator)         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Pipeline Engine (Monorepo Package)                  │    │
│  │  - Plugin Registry                                   │    │
│  │  - Stage Orchestration                               │    │
│  │  - State Management                                  │    │
│  └──────────┬──────────────────────────────────────────┘    │
│             │                                                 │
│             ▼                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Azure Functions (Processing Stages)                │    │
│  │  - Extract (Plugin-based)                           │    │
│  │  - Validate                                         │    │
│  │  - Transform                                       │    │
│  │  - Enrich                                          │    │
│  │  - Deduplicate                                      │    │
│  └──────────┬──────────────────────────────────────────┘    │
└──────────────┼───────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              AZURE SERVICES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Azure Blob   │  │ Azure SQL    │  │ Azure       │     │
│  │ Storage      │  │ Database     │  │ Functions   │     │
│  │ (Raw Data)   │  │ (Pipeline    │  │ (Stages)    │     │
│  │              │  │  State)       │  │             │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────┬───────────────────────────────────────────────────┘
           │
           │ (Clean Data Only)
           ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (Application Database)                 │
│  - leads_market_items                                        │
│  - leads_organizations                                       │
│  - leads_contacts                                           │
│  - leads_signals                                            │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN PANEL (Next.js - Same Monorepo)          │
│  - Pipeline List (Pause/Resume)                            │
│  - Pipeline Monitoring                                       │
│  - Data Quality Dashboard                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

### Directory Layout

```
pitchivo/
├── apps/
│   ├── web/                          # Next.js app (existing)
│   │   ├── app/
│   │   │   └── admin/
│   │   │       └── pipelines/       # Admin panel for pipelines
│   │   └── lib/
│   │       └── pipelines/           # Pipeline client SDK
│   └── pipeline-orchestrator/       # Azure Container App
│       ├── src/
│       │   ├── index.ts            # Main orchestrator
│       │   ├── engine.ts            # Pipeline engine
│       │   ├── plugins/             # Plugin registry
│       │   └── stages/              # Processing stages
│       ├── Dockerfile
│       └── package.json
├── packages/
│   ├── ui/                          # Shared UI (existing)
│   ├── pipeline-core/               # Core pipeline types & utilities
│   │   ├── src/
│   │   │   ├── types.ts             # Pipeline types
│   │   │   ├── stages.ts            # Stage definitions
│   │   │   └── utils.ts              # Shared utilities
│   │   └── package.json
│   ├── pipeline-plugins/            # Source plugins
│   │   ├── src/
│   │   │   ├── base/                # Base plugin interface
│   │   │   ├── mongodb/             # MongoDB plugin
│   │   │   ├── web-crawler/         # Web crawler plugin
│   │   │   ├── api-client/          # External API plugin
│   │   │   └── csv/                 # CSV plugin
│   │   └── package.json
│   └── pipeline-functions/          # Azure Functions shared code
│       ├── src/
│       │   ├── extract/             # Extract function
│       │   ├── validate/            # Validate function
│       │   ├── transform/           # Transform function
│       │   ├── enrich/              # Enrich function
│       │   └── dedupe/              # Dedupe function
│       └── package.json
├── azure/
│   ├── functions/                   # Azure Functions (deployable)
│   │   ├── extract/
│   │   ├── validate/
│   │   ├── transform/
│   │   ├── enrich/
│   │   └── dedupe/
│   ├── container-apps/             # Container App configs
│   └── infrastructure/              # Bicep/ARM templates
├── supabase/                        # Existing Supabase
└── package.json                     # Root package.json
```

### Package Dependencies

```
pipeline-orchestrator
  └── pipeline-core
  └── pipeline-plugins

pipeline-functions
  └── pipeline-core
  └── pipeline-plugins

apps/web
  └── pipeline-core (types only)
```

### Benefits

1. **AI-Friendly**: All code in one repo, easy to navigate
2. **Local Testing**: Run entire pipeline locally with Docker Compose
3. **Type Safety**: Shared types across packages
4. **Easy Extension**: Add new plugins without touching core code
5. **Single Source of Truth**: One repo, one test suite

---

## Architecture Overview

### Component Breakdown

#### Azure Components

1. **Azure Container Apps** - Pipeline orchestrator (runs pipeline engine)
2. **Azure Functions** - Serverless processing stages (validate, transform, enrich, dedupe)
3. **Azure Blob Storage** - Raw data storage (cheap, scalable)
4. **Azure SQL Database** - Pipeline state, metadata, and staging tables
5. **Azure Application Insights** - Monitoring and logging
6. **Azure Key Vault** - Secrets management

#### Monorepo Components

1. **Pipeline Orchestrator** (`apps/pipeline-orchestrator`) - Main orchestration service
2. **Pipeline Core** (`packages/pipeline-core`) - Shared types and utilities
3. **Pipeline Plugins** (`packages/pipeline-plugins`) - Extensible source plugins
4. **Pipeline Functions** (`packages/pipeline-functions`) - Shared function code
5. **Admin Panel** (`apps/web/app/admin/pipelines`) - Pipeline management UI

#### Supabase Components

1. **PostgreSQL Database** - Clean, normalized data (leads_* tables)
2. **Supabase API** - REST API for data insertion
3. **Row Level Security** - Data access control

#### Next.js Admin Panel

1. **Pipeline Dashboard** - Real-time pipeline status
2. **Pipeline Management** - Start/stop/pause pipelines
3. **Data Quality Reports** - Validation metrics
4. **Error Monitoring** - Failed pipeline alerts

---

## Azure Services Architecture

### 1. Azure Container Apps (Orchestrator)

**Purpose**: Runs the pipeline orchestrator service

**Container App Configuration**:
- **Name**: `pitchivo-pipeline-orchestrator`
- **Image**: Built from `apps/pipeline-orchestrator/Dockerfile`
- **Min Replicas**: 1
- **Max Replicas**: 10
- **CPU**: 0.5 cores
- **Memory**: 1.0 Gi

**What It Does**:
- Loads pipeline definitions from Azure SQL
- Executes pipeline stages in sequence
- Manages pipeline state
- Invokes Azure Functions for processing
- Handles retries and error recovery
- Updates pipeline status

**Environment Variables**:
```bash
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_SQL_CONNECTION_STRING=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
AZURE_FUNCTIONS_BASE_URL=...
```

**Triggers**:
- HTTP endpoint (manual start)
- Timer trigger (scheduled pipelines)
- Queue trigger (from admin panel)

### 2. Azure Functions (Processing Stages)

**Purpose**: Serverless functions for data processing stages

**Function App**: `pitchivo-pipeline-functions`

**Functions**:
- `extract` - Plugin-based extraction (calls appropriate plugin)
- `validate` - Schema validation
- `transform` - Data normalization
- `enrich` - Data enrichment (organizations, contacts, items)
- `dedupe` - Deduplication matching
- `upload` - Upload to Supabase

**Configuration**:
- **Runtime**: Node.js 20 LTS
- **Plan**: Consumption (pay-per-execution)
- **Timeout**: 10 minutes max
- **Memory**: 1.5 GB default
- **Package**: Uses `packages/pipeline-functions` shared code

### 3. Azure Blob Storage

**Purpose**: Store raw data before processing

**Container Structure**:
```
pitchivo-raw-data/
├── mongodb/
│   ├── {pipeline-id}/
│   │   ├── raw-{timestamp}.json
│   │   └── processed-{timestamp}.json
├── scrapers/
│   ├── {scraper-name}/
│   │   └── {date}/
│   │       └── raw-{timestamp}.json
├── csv/
│   └── {pipeline-id}/
│       └── upload-{timestamp}.csv
└── errors/
    └── {pipeline-id}/
        └── error-{timestamp}.json
```

**Configuration**:
- **Storage Account**: `pitchivorawdata`
- **Tier**: Hot (frequent access)
- **Lifecycle Policy**: Move to Archive after 90 days
- **Retention**: 1 year

### 4. Azure SQL Database

**Purpose**: Pipeline state, metadata, and staging tables

**Schema**:

```sql
-- Pipeline definitions
CREATE TABLE pipeline_definitions (
    pipeline_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    source_type NVARCHAR(50) NOT NULL, -- 'mongodb', 'scraper', 'csv', 'api'
    source_config JSONB NOT NULL,
    status NVARCHAR(20) DEFAULT 'inactive', -- 'active', 'paused', 'inactive'
    schedule_config JSONB, -- Cron expression, timezone
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Pipeline runs (execution history)
CREATE TABLE pipeline_runs (
    run_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pipeline_id UNIQUEIDENTIFIER NOT NULL REFERENCES pipeline_definitions(pipeline_id),
    status NVARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    started_at DATETIME2 DEFAULT GETUTCDATE(),
    completed_at DATETIME2,
    records_processed INT DEFAULT 0,
    records_succeeded INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message NVARCHAR(MAX),
    metadata JSONB,
    CONSTRAINT FK_pipeline_runs_pipeline FOREIGN KEY (pipeline_id) 
        REFERENCES pipeline_definitions(pipeline_id)
);

-- Pipeline stages (step-by-step progress)
CREATE TABLE pipeline_stages (
    stage_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    run_id UNIQUEIDENTIFIER NOT NULL REFERENCES pipeline_runs(run_id),
    stage_name NVARCHAR(100) NOT NULL, -- 'extract', 'validate', 'transform', 'enrich', 'dedupe', 'upload'
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at DATETIME2,
    completed_at DATETIME2,
    records_processed INT DEFAULT 0,
    error_message NVARCHAR(MAX),
    metadata JSONB
);

-- Staging data (before Supabase upload)
CREATE TABLE staging_organizations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    run_id UNIQUEIDENTIFIER NOT NULL REFERENCES pipeline_runs(run_id),
    raw_data JSONB NOT NULL,
    normalized_data JSONB,
    validation_status NVARCHAR(20) DEFAULT 'pending',
    validation_errors JSONB,
    enrichment_status NVARCHAR(20) DEFAULT 'pending',
    dedupe_status NVARCHAR(20) DEFAULT 'pending',
    supabase_org_id UUID, -- After upload to Supabase
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE staging_market_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    run_id UNIQUEIDENTIFIER NOT NULL REFERENCES pipeline_runs(run_id),
    raw_data JSONB NOT NULL,
    normalized_data JSONB,
    validation_status NVARCHAR(20) DEFAULT 'pending',
    validation_errors JSONB,
    supabase_item_id UUID,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE staging_signals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    run_id UNIQUEIDENTIFIER NOT NULL REFERENCES pipeline_runs(run_id),
    raw_data JSONB NOT NULL,
    normalized_data JSONB,
    validation_status NVARCHAR(20) DEFAULT 'pending',
    validation_errors JSONB,
    supabase_signal_id UUID,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Indexes
CREATE INDEX IX_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);
CREATE INDEX IX_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IX_pipeline_runs_started_at ON pipeline_runs(started_at DESC);
CREATE INDEX IX_pipeline_stages_run_id ON pipeline_stages(run_id);
CREATE INDEX IX_staging_orgs_run_id ON staging_organizations(run_id);
CREATE INDEX IX_staging_items_run_id ON staging_market_items(run_id);
CREATE INDEX IX_staging_signals_run_id ON staging_signals(run_id);
```

**Configuration**:
- **Service Tier**: Basic (S0) for dev, Standard (S2) for production
- **Backup**: 7-day retention
- **Firewall**: Allow Azure services, restrict IPs

### 5. Azure Application Insights

**Purpose**: Monitoring, logging, and alerting

**Metrics Tracked**:
- Pipeline execution time
- Function execution time
- Error rates
- Data volume processed
- Cost per pipeline run

**Alerts**:
- Pipeline failure rate > 5%
- Function execution time > 5 minutes
- Storage quota > 80%
- Database DTU > 80%

---

## Extensible Pipeline Framework

### Pipeline Definition Schema

```typescript
// packages/pipeline-core/src/types.ts

export interface PipelineDefinition {
  pipeline_id: string;
  name: string;
  source_type: 'mongodb' | 'web_crawler' | 'api' | 'csv' | string; // Extensible
  source_config: Record<string, any>; // Plugin-specific config
  status: 'active' | 'paused' | 'inactive';
  schedule?: {
    type: 'one_time' | 'scheduled' | 'manual';
    cron?: string;
    timezone?: string;
  };
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  name: 'extract' | 'validate' | 'transform' | 'enrich' | 'dedupe' | 'upload';
  enabled?: boolean;
  timeout?: number;
  retry_policy?: {
    max_retries: number;
    backoff: 'exponential' | 'linear';
  };
  config?: Record<string, any>; // Stage-specific config
}
```

### Pipeline Execution Flow

```
1. Pipeline Triggered (HTTP, Timer, or Admin Panel)
   ↓
2. Orchestrator loads pipeline definition from Azure SQL
   ↓
3. Create pipeline_run record (status: 'running')
   ↓
4. For each enabled stage:
   a. Create pipeline_stage record (status: 'pending')
   b. Invoke Azure Function for stage
   c. Function processes data (uses plugins if extract stage)
   d. Update stage status ('running' → 'completed'/'failed')
   e. Store results in Azure SQL staging tables
   ↓
5. Final Stage: Upload to Supabase
   a. Batch insert clean data via Supabase API
   b. Update staging records with Supabase IDs
   ↓
6. Update pipeline_run (status: 'completed'/'failed')
   ↓
7. Send notification (if configured)
```

### Error Handling

- **Retry Logic**: Exponential backoff (3 retries max per stage)
- **Partial Success**: Continue processing valid records, log failures
- **State Recovery**: Pipeline can resume from last successful stage
- **Manual Intervention**: Admin can retry failed stages

### Pipeline Control (Admin Panel)

**Simple UI Controls**:
- **Pause**: Sets status to 'paused', stops new runs
- **Resume**: Sets status to 'active', allows new runs
- **Stop**: Cancels current run (if running)
- **Retry**: Retries failed run from last successful stage

---

## Plugin System

### Plugin Interface

```typescript
// packages/pipeline-plugins/src/base/plugin.ts

export interface SourcePlugin {
  name: string;
  sourceType: string;
  
  /**
   * Extract data from source
   * @param config Plugin-specific configuration
   * @param context Pipeline context (run_id, pipeline_id, etc.)
   * @returns Async generator of raw data batches
   */
  extract(
    config: Record<string, any>,
    context: PipelineContext
  ): AsyncGenerator<RawDataBatch, void, unknown>;
  
  /**
   * Validate plugin configuration
   */
  validateConfig(config: Record<string, any>): ValidationResult;
  
  /**
   * Get plugin metadata
   */
  getMetadata(): PluginMetadata;
}

export interface RawDataBatch {
  batch_id: string;
  records: any[];
  metadata?: Record<string, any>;
}

export interface PipelineContext {
  run_id: string;
  pipeline_id: string;
  stage_id: string;
}
```

### Plugin Registry

```typescript
// packages/pipeline-plugins/src/registry.ts

import { SourcePlugin } from './base/plugin';
import { MongoDBPlugin } from './mongodb';
import { WebCrawlerPlugin } from './web-crawler';
import { APIClientPlugin } from './api-client';
import { CSVPlugin } from './csv';

class PluginRegistry {
  private plugins = new Map<string, SourcePlugin>();
  
  register(plugin: SourcePlugin) {
    this.plugins.set(plugin.sourceType, plugin);
  }
  
  get(sourceType: string): SourcePlugin | undefined {
    return this.plugins.get(sourceType);
  }
  
  list(): SourcePlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Initialize registry with built-in plugins
export const pluginRegistry = new PluginRegistry();
pluginRegistry.register(new MongoDBPlugin());
pluginRegistry.register(new WebCrawlerPlugin());
pluginRegistry.register(new APIClientPlugin());
pluginRegistry.register(new CSVPlugin());
```

### Example: MongoDB Plugin

```typescript
// packages/pipeline-plugins/src/mongodb/index.ts

import { SourcePlugin, RawDataBatch, PipelineContext } from '../base/plugin';
import { MongoClient } from 'mongodb';

export class MongoDBPlugin implements SourcePlugin {
  name = 'MongoDB';
  sourceType = 'mongodb';
  
  async *extract(
    config: MongoDBConfig,
    context: PipelineContext
  ): AsyncGenerator<RawDataBatch, void, unknown> {
    const client = new MongoClient(config.connection_string);
    await client.connect();
    
    try {
      const db = client.db(config.database);
      const collection = db.collection(config.collection);
      
      const query = config.query || {};
      const cursor = collection.find(query).batchSize(config.batch_size || 1000);
      
      let batch: any[] = [];
      let batchNumber = 0;
      
      for await (const doc of cursor) {
        batch.push(doc);
        
        if (batch.length >= (config.batch_size || 1000)) {
          yield {
            batch_id: `${context.run_id}-${batchNumber}`,
            records: batch,
            metadata: {
              batch_number: batchNumber,
              source: 'mongodb',
              collection: config.collection
            }
          };
          batch = [];
          batchNumber++;
        }
      }
      
      // Yield remaining records
      if (batch.length > 0) {
        yield {
          batch_id: `${context.run_id}-${batchNumber}`,
          records: batch,
          metadata: {
            batch_number: batchNumber,
            source: 'mongodb',
            collection: config.collection
          }
        };
      }
    } finally {
      await client.close();
    }
  }
  
  validateConfig(config: any): ValidationResult {
    if (!config.connection_string) {
      return { valid: false, error: 'connection_string is required' };
    }
    if (!config.database) {
      return { valid: false, error: 'database is required' };
    }
    if (!config.collection) {
      return { valid: false, error: 'collection is required' };
    }
    return { valid: true };
  }
  
  getMetadata() {
    return {
      name: this.name,
      sourceType: this.sourceType,
      description: 'Extract data from MongoDB collections',
      configSchema: {
        connection_string: { type: 'string', required: true },
        database: { type: 'string', required: true },
        collection: { type: 'string', required: true },
        query: { type: 'object', required: false },
        batch_size: { type: 'number', required: false, default: 1000 }
      }
    };
  }
}

interface MongoDBConfig {
  connection_string: string;
  database: string;
  collection: string;
  query?: Record<string, any>;
  batch_size?: number;
}
```

### Example: Web Crawler Plugin

```typescript
// packages/pipeline-plugins/src/web-crawler/index.ts

import { SourcePlugin, RawDataBatch, PipelineContext } from '../base/plugin';
import * as puppeteer from 'puppeteer';

export class WebCrawlerPlugin implements SourcePlugin {
  name = 'Web Crawler';
  sourceType = 'web_crawler';
  
  async *extract(
    config: WebCrawlerConfig,
    context: PipelineContext
  ): AsyncGenerator<RawDataBatch, void, unknown> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      for (const url of config.urls) {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Extract data based on config.selectors
        const data = await page.evaluate((selectors) => {
          // Custom extraction logic
          return Array.from(document.querySelectorAll(selectors.list)).map(item => ({
            // Extract fields based on selectors
          }));
        }, config.selectors);
        
        yield {
          batch_id: `${context.run_id}-${url}`,
          records: data,
          metadata: {
            url,
            source: 'web_crawler',
            crawled_at: new Date().toISOString()
          }
        };
      }
    } finally {
      await browser.close();
    }
  }
  
  validateConfig(config: any): ValidationResult {
    if (!config.urls || !Array.isArray(config.urls)) {
      return { valid: false, error: 'urls array is required' };
    }
    return { valid: true };
  }
  
  getMetadata() {
    return {
      name: this.name,
      sourceType: this.sourceType,
      description: 'Crawl and extract data from websites',
      configSchema: {
        urls: { type: 'array', required: true },
        selectors: { type: 'object', required: true }
      }
    };
  }
}
```

### Adding New Plugins

1. **Create Plugin Class**:
   ```typescript
   // packages/pipeline-plugins/src/my-plugin/index.ts
   export class MyPlugin implements SourcePlugin { ... }
   ```

2. **Register Plugin**:
   ```typescript
   // packages/pipeline-plugins/src/registry.ts
   pluginRegistry.register(new MyPlugin());
   ```

3. **Use in Pipeline**:
   ```json
   {
     "source_type": "my_plugin",
     "source_config": { ... }
   }
   ```

**No core code changes needed!**

---

## Data Processing Pipeline

### Stage 1: Extract

**Input**: Source-specific (MongoDB connection, scraper config, CSV file)

**Output**: Raw JSON data to Azure Blob Storage

**Example (MongoDB)**:
```typescript
// Azure Function: ExtractMongoDB
export async function ExtractMongoDB(context: ExecutionContext, req: HttpRequest) {
  const { pipelineId, sourceConfig } = req.body;
  
  // Connect to MongoDB
  const client = new MongoClient(sourceConfig.connection_string);
  await client.connect();
  
  const db = client.db(sourceConfig.database);
  const collection = db.collection(sourceConfig.collection);
  
  // Extract in batches
  const cursor = collection.find(sourceConfig.query).batchSize(sourceConfig.batch_size);
  const batch = [];
  let batchNumber = 0;
  
  for await (const doc of cursor) {
    batch.push(doc);
    
    if (batch.length >= sourceConfig.batch_size) {
      // Upload batch to Blob Storage
      await uploadBatchToBlob(pipelineId, batchNumber, batch);
      batch.length = 0;
      batchNumber++;
    }
  }
  
  // Upload remaining
  if (batch.length > 0) {
    await uploadBatchToBlob(pipelineId, batchNumber, batch);
  }
  
  await client.close();
  
  return {
    status: 'completed',
    batches: batchNumber + 1,
    records: (batchNumber * sourceConfig.batch_size) + batch.length
  };
}
```

### Stage 2: Validate

**Input**: Raw JSON from Blob Storage

**Output**: Validated records + error records

**Validation Rules**:
- Required fields present
- Data types correct
- Format validation (email, URL, phone)
- Business rules (e.g., date ranges)

### Stage 3: Transform

**Input**: Validated raw data

**Output**: Normalized data structure

**Transformations**:
- Field name mapping
- Data type conversion
- Value normalization (trim, lowercase, etc.)
- Structure flattening/nesting

### Stage 4: Enrich

**Input**: Normalized data

**Output**: Enriched data with additional fields

**Enrichment Sources**:
- Domain → Company info (Clearbit, FullContact)
- Email → LinkedIn profile (Hunter.io, Snov.io)
- Company name → Industry classification

### Stage 5: Deduplicate

**Input**: Enriched data

**Output**: Matched records with Supabase IDs

**Deduplication Logic**:
- Organizations: Domain matching, fuzzy name matching
- Items: Normalized name matching, alias matching
- Contacts: Email matching, name + company matching

### Stage 6: Upload to Supabase

**Input**: Clean, deduplicated data

**Output**: Supabase record IDs

**Process**:
1. Batch insert/update in Supabase
2. Handle conflicts (upsert logic)
3. Update staging tables with Supabase IDs
4. Log success/failure

---

## Local Development & Testing

### Docker Compose Setup

**File**: `docker-compose.local.yml`

```yaml
version: '3.8'

services:
  # Local Azure SQL (using SQL Server)
  azure-sql:
    image: mcr.microsoft.com/azure-sql-edge:latest
    environment:
      ACCEPT_EULA: Y
      MSSQL_SA_PASSWORD: 'LocalDev123!'
    ports:
      - "1433:1433"
    volumes:
      - azure-sql-data:/var/opt/mssql

  # Local Azure Storage Emulator (Azurite)
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports:
      - "10000:10000"  # Blob service
      - "10001:10001"  # Queue service
      - "10002:10002"  # Table service
    volumes:
      - azurite-data:/data

  # Pipeline Orchestrator (local)
  pipeline-orchestrator:
    build:
      context: .
      dockerfile: apps/pipeline-orchestrator/Dockerfile
    environment:
      AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true"
      AZURE_SQL_CONNECTION_STRING: "Server=azure-sql,1433;Database=pipelines;User Id=sa;Password=LocalDev123!;TrustServerCertificate=true"
      SUPABASE_URL: "${SUPABASE_URL}"
      SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}"
      NODE_ENV: development
    volumes:
      - ./apps/pipeline-orchestrator:/app
      - ./packages:/packages
    depends_on:
      - azure-sql
      - azurite
    command: npm run dev

volumes:
  azure-sql-data:
  azurite-data:
```

### Local Development Scripts

**File**: `package.json` (root)

```json
{
  "scripts": {
    "pipeline:dev": "docker-compose -f docker-compose.local.yml up",
    "pipeline:test": "turbo run test --filter=pipeline-*",
    "pipeline:test:local": "npm run pipeline:dev & npm run pipeline:test",
    "pipeline:build": "turbo run build --filter=pipeline-*"
  }
}
```

### Running Locally

1. **Start Local Services**:
   ```bash
   npm run pipeline:dev
   ```

2. **Run Tests**:
   ```bash
   npm run pipeline:test
   ```

3. **Run Pipeline Locally**:
   ```bash
   cd apps/pipeline-orchestrator
   npm run dev
   ```

4. **Test with Sample Data**:
   ```bash
   # Create test pipeline
   curl -X POST http://localhost:3001/api/pipelines \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test MongoDB Pipeline",
       "source_type": "mongodb",
       "source_config": {
         "connection_string": "mongodb://localhost:27017",
         "database": "test",
         "collection": "companies"
       }
     }'
   ```

### Testing Plugins Locally

```typescript
// packages/pipeline-plugins/src/mongodb/__tests__/mongodb.test.ts

import { MongoDBPlugin } from '../index';

describe('MongoDBPlugin', () => {
  it('should extract data from MongoDB', async () => {
    const plugin = new MongoDBPlugin();
    const config = {
      connection_string: 'mongodb://localhost:27017',
      database: 'test',
      collection: 'companies',
      batch_size: 10
    };
    
    const context = {
      run_id: 'test-run',
      pipeline_id: 'test-pipeline',
      stage_id: 'test-stage'
    };
    
    const batches: any[] = [];
    for await (const batch of plugin.extract(config, context)) {
      batches.push(batch);
    }
    
    expect(batches.length).toBeGreaterThan(0);
  });
});
```

### Local Testing Benefits

1. **Fast Iteration**: Test changes without deploying to Azure
2. **Cost-Free**: No Azure costs during development
3. **Isolated**: Each developer has their own environment
4. **CI/CD Ready**: Same setup can be used in CI pipelines
5. **AI-Friendly**: Easy to run and test, perfect for AI assistance

---

## Admin Panel Integration

### Simple Admin UI

**Location**: `apps/web/app/admin/pipelines`

### Pipeline List Page

**File**: `apps/web/app/admin/pipelines/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    const res = await fetch('/api/admin/pipelines');
    const data = await res.json();
    setPipelines(data);
    setLoading(false);
  };

  const handlePause = async (pipelineId: string) => {
    await fetch(`/api/admin/pipelines/${pipelineId}/pause`, { method: 'POST' });
    fetchPipelines();
  };

  const handleResume = async (pipelineId: string) => {
    await fetch(`/api/admin/pipelines/${pipelineId}/resume`, { method: 'POST' });
    fetchPipelines();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pipelines</h1>
      
      <div className="space-y-4">
        {pipelines.map((pipeline: any) => (
          <div key={pipeline.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{pipeline.name}</h3>
                <p className="text-sm text-gray-500">{pipeline.source_type}</p>
                <p className="text-sm">
                  Status: <span className={getStatusColor(pipeline.status)}>
                    {pipeline.status}
                  </span>
                </p>
              </div>
              
              <div className="flex gap-2">
                {pipeline.status === 'active' ? (
                  <Button onClick={() => handlePause(pipeline.id)} variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={() => handleResume(pipeline.id)} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Pipeline Details Page

**File**: `apps/web/app/admin/pipelines/[pipelineId]/page.tsx`

Shows:
- Pipeline configuration
- Recent runs with status
- Current run progress (if running)
- Simple controls: Pause/Resume/Retry

### Database Schema (Supabase)

Add pipeline monitoring tables to Supabase:

```sql
-- Pipeline definitions (synced from Azure SQL)
CREATE TABLE pipeline_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_config JSONB NOT NULL,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'paused', 'inactive')),
    schedule_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline runs (synced from Azure SQL)
CREATE TABLE pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL UNIQUE,
    pipeline_id UUID NOT NULL REFERENCES pipeline_definitions(pipeline_id),
    status TEXT DEFAULT 'running',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_processed INT DEFAULT 0,
    records_succeeded INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);
CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_started_at ON pipeline_runs(started_at DESC);
```

### API Endpoints (Next.js)

**File**: `apps/web/app/api/admin/pipelines/route.ts`

```typescript
// GET /api/admin/pipelines - List all pipelines
export async function GET() {
  // Fetch from Supabase (synced from Azure SQL)
  const { data } = await supabase
    .from('pipeline_definitions')
    .select('*')
    .order('created_at', { ascending: false });
  return Response.json(data);
}

// POST /api/admin/pipelines - Create pipeline
export async function POST(req: Request) {
  const body = await req.json();
  // Create in Azure SQL, then sync to Supabase
  // ...
}
```

**File**: `apps/web/app/api/admin/pipelines/[pipelineId]/pause/route.ts`

```typescript
// POST /api/admin/pipelines/[pipelineId]/pause
export async function POST(
  req: Request,
  { params }: { params: { pipelineId: string } }
) {
  // Update status in Azure SQL
  await updatePipelineStatus(params.pipelineId, 'paused');
  // Sync to Supabase
  await syncPipelineState(params.pipelineId);
  return Response.json({ success: true });
}
```

**File**: `apps/web/app/api/admin/pipelines/[pipelineId]/resume/route.ts`

```typescript
// POST /api/admin/pipelines/[pipelineId]/resume
export async function POST(
  req: Request,
  { params }: { params: { pipelineId: string } }
) {
  await updatePipelineStatus(params.pipelineId, 'active');
  await syncPipelineState(params.pipelineId);
  return Response.json({ success: true });
}
```

---

## Example: MongoDB Migration

### Using MongoDB Plugin

1. **Create Pipeline** (via Admin Panel or API):
   ```json
   {
     "name": "MongoDB Historical Import",
     "source_type": "mongodb",
     "source_config": {
       "connection_string": "mongodb://user:pass@host:27017/db",
       "database": "market_intelligence",
       "collection": "companies",
       "query": {
         "status": "active",
         "created_at": { "$gte": "2020-01-01" }
       },
       "batch_size": 1000
     },
     "schedule": {
       "type": "one_time"
     }
   }
   ```

2. **Pipeline automatically uses MongoDBPlugin** (no code changes needed)

3. **Monitor in Admin Panel**: See progress, pause/resume as needed

### Adding Custom Transform Logic

If you need custom transformation for MongoDB data, extend the transform stage:

```typescript
// packages/pipeline-functions/src/transform/mongodb-transformer.ts

export function transformMongoDBToLeads(mongoDoc: any) {
  return {
    organizations: [{
      name: mongoDoc.company_name || mongoDoc.organization_name,
      domain: mongoDoc.domain,
      industry: mongoDoc.industry,
      raw_data: mongoDoc
    }],
    market_items: (mongoDoc.products || []).map((p: any) => ({
      name: p.name || p.product_name,
      category: p.category
    })),
    contacts: (mongoDoc.contacts || []).map((c: any) => ({
      name: c.name,
      email: c.email,
      title: c.title,
      organization_domain: mongoDoc.domain
    })),
    signals: (mongoDoc.signals || []).map((s: any) => ({
      organization_domain: mongoDoc.domain,
      item_name: s.product_name,
      interaction_type: s.type || s.interaction_type,
      event_date: s.date || s.event_date
    }))
  };
}
```

---

## Implementation Phases

### Phase 1: Monorepo Setup & Local Development (Week 1)

**Tasks**:
1. Create monorepo packages structure
   - `packages/pipeline-core` - Types and utilities
   - `packages/pipeline-plugins` - Plugin system
   - `packages/pipeline-functions` - Shared function code
   - `apps/pipeline-orchestrator` - Container App service
2. Set up Docker Compose for local development
3. Create base plugin interface
4. Set up TypeScript configs and build scripts
5. Create local testing infrastructure

**Deliverables**:
- Monorepo structure in place
- Local development environment working
- Base plugin interface defined
- Can run tests locally

### Phase 2: Plugin System & Core Framework (Week 2)

**Tasks**:
1. Implement plugin registry
2. Create MongoDB plugin (first example)
3. Implement pipeline engine core
4. Create pipeline state management (Azure SQL schema)
5. Build Container App orchestrator service
6. Set up local Azure SQL and Azurite

**Deliverables**:
- Plugin system working
- MongoDB plugin functional
- Pipeline engine can execute stages
- Local testing with real services

### Phase 3: Azure Infrastructure & Functions (Week 3)

**Tasks**:
1. Provision Azure resources (Storage, SQL, Container Apps, Functions)
2. Deploy Azure SQL schema
3. Create Azure Functions for each stage
4. Deploy Container App orchestrator
5. Set up Application Insights
6. Configure Key Vault

**Deliverables**:
- Azure infrastructure ready
- Functions deployed and testable
- Container App running in Azure
- Monitoring in place

### Phase 4: Processing Stages (Week 4)

**Tasks**:
1. Implement validate stage function
2. Implement transform stage function
3. Implement enrich stage function
4. Implement dedupe stage function
5. Implement upload stage (Supabase integration)
6. Test end-to-end pipeline locally

**Deliverables**:
- All processing stages functional
- End-to-end pipeline working locally
- Supabase integration complete

### Phase 5: Admin Panel & Control (Week 5)

**Tasks**:
1. Create Supabase pipeline monitoring tables
2. Implement sync function (Azure SQL → Supabase)
3. Build admin API endpoints (pause/resume)
4. Create simple pipeline list UI
5. Add pipeline details page
6. Implement pause/resume controls

**Deliverables**:
- Admin panel functional
- Can pause/resume pipelines
- Pipeline monitoring visible

### Phase 6: Additional Plugins & Production (Week 6)

**Tasks**:
1. Create web crawler plugin
2. Create API client plugin
3. Create CSV plugin
4. Production deployment
5. Load testing
6. Documentation

**Deliverables**:
- Multiple source types supported
- Production-ready system
- Complete documentation

---

## API Design

### Azure Function API

#### Pipeline Management

**POST `/api/pipelines`** - Create pipeline
```json
{
  "name": "MongoDB Import",
  "source_type": "mongodb",
  "source_config": { ... },
  "schedule": { ... },
  "stages": [ ... ]
}
```

**GET `/api/pipelines/{pipelineId}`** - Get pipeline
**PUT `/api/pipelines/{pipelineId}`** - Update pipeline
**DELETE `/api/pipelines/{pipelineId}`** - Delete pipeline
**POST `/api/pipelines/{pipelineId}/start`** - Start pipeline
**POST `/api/pipelines/{pipelineId}/stop`** - Stop pipeline

#### Pipeline Execution

**POST `/api/pipelines/{pipelineId}/runs`** - Trigger pipeline run
**GET `/api/pipelines/{pipelineId}/runs/{runId}`** - Get run status
**GET `/api/pipelines/{pipelineId}/runs/{runId}/stages`** - Get stage details

### Supabase RPC Functions

**`sync_pipeline_state()`** - Sync pipeline state from Azure
```sql
CREATE OR REPLACE FUNCTION sync_pipeline_state()
RETURNS void AS $$
-- Implementation to sync from Azure SQL
$$ LANGUAGE plpgsql;
```

**`upload_pipeline_data()`** - Upload clean data from Azure
```sql
CREATE OR REPLACE FUNCTION upload_pipeline_data(
  p_organizations JSONB,
  p_market_items JSONB,
  p_contacts JSONB,
  p_signals JSONB,
  p_source_id UUID
)
RETURNS JSONB AS $$
-- Implementation to insert/update leads_* tables
$$ LANGUAGE plpgsql;
```

---

## Cost Optimization Strategy

### Azure Costs (Estimated Monthly)

**Azure Functions** (Consumption Plan):
- 1M executions: ~$20
- 400K GB-seconds: ~$8
- **Total: ~$28/month**

**Azure Blob Storage** (Hot Tier):
- 100 GB: ~$2
- **Total: ~$2/month**

**Azure SQL Database** (Basic S0):
- 10 DTU: ~$5
- **Total: ~$5/month**

**Azure Logic Apps** (Consumption):
- 5K executions: ~$5
- **Total: ~$5/month**

**Application Insights**:
- 5 GB data: ~$2
- **Total: ~$2/month**

**Azure Container Apps** (Consumption):
- 0.5 vCPU, 1GB RAM, ~730 hours: ~$15
- **Total: ~$15/month**

**Total Estimated: ~$57/month** (for moderate usage)

### Cost Optimization Tips

1. **Use Consumption Plans**: Pay only for what you use
2. **Archive Old Data**: Move to Archive tier after 90 days
3. **Batch Processing**: Process in larger batches to reduce function calls
4. **Optimize Functions**: Reduce execution time and memory
5. **Use Service Bus**: Avoid polling, use event-driven architecture
6. **Monitor Costs**: Set up budget alerts in Azure

### Supabase Costs

- Only clean data stored (reduces storage costs)
- Reduced compute (no heavy processing)
- **Estimated savings: 60-70%** vs processing in Supabase

---

## Security Considerations

### Azure Security

1. **Key Vault**: Store all secrets (MongoDB connection strings, API keys)
2. **Managed Identity**: Use for Azure service authentication
3. **Network Isolation**: Use VNet for SQL Database (optional)
4. **Access Control**: RBAC for Azure resources
5. **Encryption**: Enable encryption at rest for Storage and SQL

### Supabase Security

1. **Service Role Key**: Store in Azure Key Vault
2. **RLS Policies**: Ensure pipeline data respects RLS
3. **API Rate Limiting**: Implement in upload function
4. **Audit Logging**: Log all pipeline data changes

---

## Monitoring & Alerting

### Key Metrics

1. **Pipeline Success Rate**: Target > 95%
2. **Processing Time**: Track per stage
3. **Data Quality**: Validation error rate
4. **Cost per Pipeline Run**: Monitor Azure costs
5. **Supabase Upload Success Rate**: Target > 99%

### Alerts

1. Pipeline failure rate > 5%
2. Function execution time > 10 minutes
3. Storage quota > 80%
4. Database DTU > 80%
5. Supabase upload failures

---

## Next Steps

1. **Review & Approve**: Review this design document
2. **Azure Setup**: Provision Azure resources
3. **Development**: Start Phase 1 implementation
4. **Testing**: Test with sample MongoDB data
5. **Production**: Deploy and monitor

---

## Appendix

### A. Azure Resource Naming Convention

- Resource Group: `pitchivo-pipelines-rg`
- Storage Account: `pitchivorawdata{random}`
- SQL Server: `pitchivo-pipelines-sql`
- SQL Database: `pitchivo-pipelines-db`
- Function Apps: `pitchivo-{purpose}-functions`
- Logic Apps: `pipeline-{source-type}-{id}`
- Service Bus: `pitchivo-pipelines`
- Key Vault: `pitchivo-pipelines-kv`

### B. Environment Variables

**Azure Functions**:
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_SQL_CONNECTION_STRING`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONGO_CONNECTION_STRING` (from Key Vault)

**Logic Apps**:
- Connection strings stored in Logic App connections
- Secrets from Key Vault

### C. Sample MongoDB Document Structure

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "company_name": "Nestle",
  "domain": "nestle.com",
  "industry": "Food & Beverage",
  "products": [
    {
      "name": "Garlic Extract",
      "category": "Flavoring",
      "quantity": 5000
    }
  ],
  "contacts": [
    {
      "name": "John Doe",
      "email": "john@nestle.com",
      "title": "Procurement Manager"
    }
  ],
  "signals": [
    {
      "type": "purchased",
      "product_name": "Garlic Extract",
      "date": "2024-01-15",
      "quantity": 5000
    }
  ]
}
```

---

## Deployment Strategy

### Overview

Since the pipeline code is in the same monorepo as the Next.js app, we need separate deployment workflows:

1. **Next.js App** → Vercel (existing)
2. **Container App** → Azure Container Registry → Azure Container Apps
3. **Azure Functions** → Deploy directly from monorepo

### Directory Structure for Deployment

```
pitchivo/
├── apps/
│   ├── web/                    # → Deploys to Vercel (existing)
│   └── pipeline-orchestrator/  # → Deploys to Azure Container Apps
│       ├── src/
│       ├── Dockerfile
│       └── package.json
├── azure/
│   ├── functions/              # → Deploys to Azure Functions
│   │   ├── extract/
│   │   ├── validate/
│   │   ├── transform/
│   │   ├── enrich/
│   │   ├── dedupe/
│   │   └── upload/
│   └── infrastructure/         # Bicep/ARM templates
├── packages/
│   ├── pipeline-core/          # Shared (bundled into functions/orchestrator)
│   ├── pipeline-plugins/       # Shared (bundled into functions/orchestrator)
│   └── pipeline-functions/    # Shared (bundled into functions)
└── .github/
    └── workflows/
        ├── deploy-web.yml      # Existing Vercel deployment
        ├── deploy-container-app.yml
        └── deploy-functions.yml
```

### 1. Container App Deployment

#### Dockerfile

**File**: `apps/pipeline-orchestrator/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/pipeline-orchestrator/package.json ./apps/pipeline-orchestrator/
COPY packages/pipeline-core/package.json ./packages/pipeline-core/
COPY packages/pipeline-plugins/package.json ./packages/pipeline-plugins/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/pipeline-orchestrator ./apps/pipeline-orchestrator
COPY packages/pipeline-core ./packages/pipeline-core
COPY packages/pipeline-plugins ./packages/pipeline-plugins

# Build
WORKDIR /app/apps/pipeline-orchestrator
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/pipeline-orchestrator/package.json ./apps/pipeline-orchestrator/
COPY packages/pipeline-core/package.json ./packages/pipeline-core/
COPY packages/pipeline-plugins/package.json ./packages/pipeline-plugins/

# Install production dependencies only
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/apps/pipeline-orchestrator/dist ./apps/pipeline-orchestrator/dist
COPY --from=builder /app/apps/pipeline-orchestrator/node_modules ./apps/pipeline-orchestrator/node_modules
COPY --from=builder /app/packages/pipeline-core/dist ./packages/pipeline-core/dist
COPY --from=builder /app/packages/pipeline-core/node_modules ./packages/pipeline-core/node_modules
COPY --from=builder /app/packages/pipeline-plugins/dist ./packages/pipeline-plugins/dist
COPY --from=builder /app/packages/pipeline-plugins/node_modules ./packages/pipeline-plugins/node_modules

WORKDIR /app/apps/pipeline-orchestrator

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

#### GitHub Actions Workflow

**File**: `.github/workflows/deploy-container-app.yml`

```yaml
name: Deploy Container App

on:
  push:
    branches: [main]
    paths:
      - 'apps/pipeline-orchestrator/**'
      - 'packages/pipeline-core/**'
      - 'packages/pipeline-plugins/**'
      - '.github/workflows/deploy-container-app.yml'
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: pitchivo-pipelines-rg
  AZURE_CONTAINER_REGISTRY: pitchivopipelines
  CONTAINER_APP_NAME: pitchivo-pipeline-orchestrator
  CONTAINER_APP_ENVIRONMENT: pitchivo-pipelines-env

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login to Azure Container Registry
        run: |
          az acr login --name ${{ env.AZURE_CONTAINER_REGISTRY }}

      - name: Build and push Docker image
        run: |
          IMAGE_TAG=$(date +%Y%m%d-%H%M%S)-${GITHUB_SHA:0:7}
          docker build -t ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/pipeline-orchestrator:$IMAGE_TAG \
            -f apps/pipeline-orchestrator/Dockerfile .
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/pipeline-orchestrator:$IMAGE_TAG
          echo "IMAGE_TAG=$IMAGE_TAG" >> $GITHUB_ENV

      - name: Deploy to Container App
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_NAME }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/pipeline-orchestrator:${{ env.IMAGE_TAG }}
```

### 2. Azure Functions Deployment

#### Function Structure

Each function is a separate deployable unit that imports shared packages:

**File**: `azure/functions/extract/index.ts`

```typescript
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { pluginRegistry } from '@pitchivo/pipeline-plugins';
import { PipelineContext } from '@pitchivo/pipeline-core';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const { pipelineId, runId, sourceType, sourceConfig } = req.body;
  
  const plugin = pluginRegistry.get(sourceType);
  if (!plugin) {
    context.res = {
      status: 400,
      body: { error: `Unknown source type: ${sourceType}` }
    };
    return;
  }
  
  const pipelineContext: PipelineContext = {
    run_id: runId,
    pipeline_id: pipelineId,
    stage_id: context.executionContext.invocationId
  };
  
  // Extract data using plugin
  const batches = [];
  for await (const batch of plugin.extract(sourceConfig, pipelineContext)) {
    batches.push(batch);
    // Upload to Blob Storage
    await uploadToBlob(batch);
  }
  
  context.res = {
    status: 200,
    body: {
      status: 'completed',
      batches: batches.length
    }
  };
};

export default httpTrigger;
```

**File**: `azure/functions/extract/function.json`

```json
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ],
  "scriptFile": "../dist/extract/index.js"
}
```

**File**: `azure/functions/extract/package.json`

```json
{
  "name": "extract-function",
  "version": "1.0.0",
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@pitchivo/pipeline-core": "workspace:*",
    "@pitchivo/pipeline-plugins": "workspace:*",
    "@azure/storage-blob": "^12.0.0"
  }
}
```

#### Build Script for Functions

**File**: `azure/functions/build.sh`

```bash
#!/bin/bash

# Build shared packages first
cd ../../packages/pipeline-core && npm run build
cd ../pipeline-plugins && npm run build
cd ../pipeline-functions && npm run build

# Build each function
cd ../../azure/functions
for func in extract validate transform enrich dedupe upload; do
  echo "Building $func..."
  cd $func
  npm install
  npm run build
  cd ..
done
```

#### GitHub Actions Workflow for Functions

**File**: `.github/workflows/deploy-functions.yml`

```yaml
name: Deploy Azure Functions

on:
  push:
    branches: [main]
    paths:
      - 'azure/functions/**'
      - 'packages/pipeline-core/**'
      - 'packages/pipeline-plugins/**'
      - 'packages/pipeline-functions/**'
      - '.github/workflows/deploy-functions.yml'
  workflow_dispatch:

env:
  AZURE_FUNCTIONAPP_NAME: pitchivo-pipeline-functions
  AZURE_FUNCTIONAPP_PACKAGE_PATH: 'azure/functions'
  NODE_VERSION: '20'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Build shared packages
        run: |
          cd packages/pipeline-core && npm run build
          cd ../pipeline-plugins && npm run build
          cd ../pipeline-functions && npm run build

      - name: Build functions
        run: |
          cd azure/functions
          ./build.sh

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
          package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

### 3. Deployment Options

#### Option A: Separate Deployments (Recommended)

- **Container App**: Deploys only when orchestrator code changes
- **Functions**: Deploys only when function code changes
- **Next.js**: Deploys only when web app changes (existing Vercel)

**Benefits**:
- Independent deployments
- Faster CI/CD (only builds what changed)
- Clear separation of concerns

#### Option B: Unified Deployment

Single workflow that deploys everything:

```yaml
# .github/workflows/deploy-all.yml
jobs:
  deploy-container-app:
    # ... container app deployment
  
  deploy-functions:
    # ... functions deployment
  
  deploy-web:
    # ... Vercel deployment (existing)
```

### 4. Local Testing Before Deployment

**File**: `package.json` (add scripts)

```json
{
  "scripts": {
    "pipeline:build": "turbo run build --filter=pipeline-*",
    "pipeline:build:container": "docker build -t pipeline-orchestrator:local -f apps/pipeline-orchestrator/Dockerfile .",
    "pipeline:test:container": "docker run --env-file .env.local pipeline-orchestrator:local",
    "pipeline:deploy:container": "az containerapp update --name pitchivo-pipeline-orchestrator --resource-group pitchivo-pipelines-rg --image local/pipeline-orchestrator:latest"
  }
}
```

### 5. Environment Variables

Store in Azure Key Vault and reference in Container App/Functions:

```bash
# Container App Environment Variables
AZURE_STORAGE_CONNECTION_STRING=@Microsoft.KeyVault(SecretUri=https://pitchivo-kv.vault.azure.net/secrets/storage-connection-string/)
AZURE_SQL_CONNECTION_STRING=@Microsoft.KeyVault(SecretUri=https://pitchivo-kv.vault.azure.net/secrets/sql-connection-string/)
SUPABASE_URL=@Microsoft.KeyVault(SecretUri=https://pitchivo-kv.vault.azure.net/secrets/supabase-url/)
SUPABASE_SERVICE_ROLE_KEY=@Microsoft.KeyVault(SecretUri=https://pitchivo-kv.vault.azure.net/secrets/supabase-key/)
```

### 6. Deployment Checklist

- [ ] Azure Container Registry created
- [ ] Container App environment created
- [ ] Azure Functions App created
- [ ] GitHub Actions secrets configured:
  - `AZURE_CREDENTIALS`
  - `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
- [ ] Key Vault secrets stored
- [ ] First deployment tested
- [ ] Monitoring configured (Application Insights)

---

**End of Document**

