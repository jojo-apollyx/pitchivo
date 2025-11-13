# Industry-Specific Architecture

This directory contains industry-specific modules for document extraction, data merging, and field mapping. Each industry has its own extraction schema, document types, and business logic.

## Architecture Overview

```
lib/industries/
├── index.ts                    # Generic industry loader (dynamic imports)
├── food-supplement/
│   └── extraction-schema.ts    # Food supplement industry module
├── chemicals-raw-materials/    # Future: Chemicals industry
├── pharmaceuticals/            # Future: Pharmaceutical industry
└── cosmetics-personal-care/    # Future: Cosmetics industry
```

## How It Works

### 1. Industry Loader (`index.ts`)
The industry loader provides a generic interface to dynamically load industry-specific modules:

```typescript
import { loadIndustrySchema, isIndustrySupported } from '@/lib/industries'

// Load industry-specific schema
const schema = await loadIndustrySchema('food_supplement')

// Get extraction prompt
const prompt = schema.getExtractionSystemPrompt()

// Get merge strategy
const mergePrompt = schema.getMergeSystemPrompt()

// Get document types
const docTypes = schema.getProductDocumentTypes()
```

### 2. Industry Module (`{industry}/extraction-schema.ts`)
Each industry module exports:

- **INDUSTRY_CODE**: Unique identifier (e.g., 'food_supplement')
- **INDUSTRY_NAME**: Display name (e.g., 'Food Supplements & Ingredients')
- **DOCUMENT_TYPES**: Categorized document types for the industry
- **getExtractionSystemPrompt()**: AI prompt with complete extraction schema
- **getMergeSystemPrompt()**: AI prompt for intelligent data merging
- **getProductDocumentTypes()**: List of all product-related document type codes

### 3. API Routes Usage
Industry-specific API routes automatically load the correct schema:

```typescript
// app/api/[industry_code]/documents/extract/route.ts
const schema = await loadIndustrySchema(industry_code)
const prompt = schema.getExtractionSystemPrompt()
// ... use prompt for AI extraction
```

## Adding a New Industry

### Step 1: Create Industry Module

Create `{industry-code}/extraction-schema.ts`:

```typescript
// lib/industries/pharmaceuticals/extraction-schema.ts

export const INDUSTRY_CODE = 'pharmaceuticals'
export const INDUSTRY_NAME = 'Pharmaceuticals'

export const DOCUMENT_TYPES = {
  REGULATORY: [
    { code: 'DMF', name: 'Drug Master File', description: '...' },
    { code: 'ANDA', name: 'Abbreviated New Drug Application', description: '...' },
    // ... more document types
  ],
  // ... more categories
}

export function getProductDocumentTypes(): string[] {
  return [
    ...DOCUMENT_TYPES.REGULATORY.map(d => d.code),
    // ... flatten all categories
  ]
}

export function getExtractionSystemPrompt(): string {
  return `You are an AI assistant specialized in extracting pharmaceutical data...
  
  Document types:
  - DMF (Drug Master File)
  - ANDA (Abbreviated New Drug Application)
  // ...
  
  Schema:
  {
    "document_type": string,
    "active_ingredient": string,
    "dosage_form": string,
    "strength": string,
    "ndc_number": string,
    // ... pharmaceutical-specific fields
  }
  `
}

export function getMergeSystemPrompt(): string {
  return `Merge pharmaceutical data with these rules:
  - Prefer more recent regulatory approvals
  - Keep all NDC numbers and lot numbers
  // ... pharmaceutical-specific merge rules
  `
}
```

### Step 2: Enable Industry

Update `lib/industries/index.ts`:

```typescript
export function getSupportedIndustries(): string[] {
  return [
    'food_supplement',
    'pharmaceuticals',  // Add new industry
    // ... more industries
  ]
}
```

### Step 3: Create Form Component (Optional)

```typescript
// components/products/industries/pharmaceuticals/PharmaceuticalsForm.tsx
export function PharmaceuticalsForm({ formData, onChange }: Props) {
  return (
    <div>
      {/* Pharmaceutical-specific form fields */}
      <Input name="activeIngredient" />
      <Input name="dosageForm" />
      <Input name="ndcNumber" />
      {/* ... more fields */}
    </div>
  )
}
```

### Step 4: Test

```bash
# Test extraction
curl -X POST http://localhost:3000/api/pharmaceuticals/documents/extract \
  -H "Content-Type: application/json" \
  -d '{"fileId": "..."}'

# Test merge
curl -X POST http://localhost:3000/api/pharmaceuticals/documents/merge \
  -H "Content-Type: application/json" \
  -d '{"currentData": {...}, "newFields": {...}}'
```

## API Routes

### Industry-Specific Routes (NEW)
```
POST /api/{industry_code}/documents/extract
POST /api/{industry_code}/documents/merge
```

Examples:
- `POST /api/food_supplement/documents/extract`
- `POST /api/pharmaceuticals/documents/extract`
- `POST /api/chemicals_raw_materials/documents/extract`

### Legacy Routes (Backward Compatibility)
```
POST /api/documents/extract  → delegates to /api/food_supplement/documents/extract
POST /api/documents/merge    → delegates to /api/food_supplement/documents/merge
```

## Shared Utilities

Generic document processing utilities are in `lib/document-processing/shared.ts`:

- `prepareDocumentForExtraction()` - Download and prepare document
- `runAIExtraction()` - Run AI with any prompt
- `saveExtractionResults()` - Save to database
- `handleExtractionError()` - Error handling
- `validateAuthentication()` - Auth validation

These utilities are **industry-agnostic** and used by all industries.

## Best Practices

1. **Keep schemas focused**: Each industry should only define its own fields
2. **Reuse shared logic**: Use utilities from `lib/document-processing/shared.ts`
3. **Document types matter**: Define comprehensive document type lists
4. **Merge strategies**: Think through how data should combine
5. **Type safety**: Define TypeScript types for all industry data structures

## Benefits

✅ **Scalability**: Add new industry without modifying existing code  
✅ **Isolation**: Industry changes don't affect other industries  
✅ **Maintainability**: Clear separation of shared vs industry-specific logic  
✅ **Flexibility**: Each industry can have unique schemas and rules  
✅ **Type Safety**: Full TypeScript support with proper interfaces  

## Current Industries

- ✅ **Food Supplement** (`food_supplement`) - Fully implemented
- ⏳ **Chemicals** (`chemicals_raw_materials`) - Coming soon
- ⏳ **Pharmaceuticals** (`pharmaceuticals`) - Coming soon
- ⏳ **Cosmetics** (`cosmetics_personal_care`) - Coming soon

