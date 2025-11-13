# Snake_case Migration Progress

## ✅ Completed

### 1. Infrastructure & Schema
- ✅ `PRODUCT_FIELDS` - Canonical snake_case field definitions
- ✅ `FIELD_OPTIONS` - Standardized dropdown values  
- ✅ `FoodSupplementProductData` interface - snake_case type definition
- ✅ `ComboboxInput` component - Hybrid text/select input
- ✅ Field name mapping utilities (for save/load boundaries)
- ✅ Database migration - Added `product_data` JSONB column
- ✅ Database migration - Extracted 6 key searchable columns (origin_country, manufacturer_name, category, form, grade, applications)
- ✅ Updated `database.types.ts` - Products table now includes searchable columns
- ✅ Updated `types.ts` - Now exports snake_case `FoodSupplementProductData` from extraction-schema
- ✅ Updated `initialFormData` in create page - Now uses snake_case

### 2. Merge System Prompt
- ✅ Updated to use `PRODUCT_FIELDS` schema
- ✅ Simplified to 3-step extraction (document type, summary, key-value pairs)
- ✅ Added value standardization rules
- ✅ Generates snake_case output matching PRODUCT_FIELDS

## 🚧 In Progress / Remaining

### 3. Form Component (`FoodSupplementForm.tsx`)
**Status**: Needs complete refactor to use snake_case

**Required Changes**:
1. Update all field references from camelCase to snake_case:
   - `productName` → `product_name`
   - `originCountry` → `origin_country`
   - `manufacturerName` → `manufacturer_name`
   - etc. (100+ references)

2. Replace `Input` with `ComboboxInput` for fields with options:
   - `origin_country` - use `getFieldOptions('origin_country')`
   - `form` - use `getFieldOptions('form')`  
   - `category` - use `getFieldOptions('category')`
   - `grade` - use `getFieldOptions('grade')`
   - `payment_terms`, `incoterm`
   - Status fields: `gmo_status`, `halal_certified`, `kosher_certified`
   - Microbiological: `e_coli_presence`, `salmonella_presence`, `staphylococcus_presence`

3. Update array structures:
   - `priceTiers` → `price_lead_time` (array of objects)
   - `warehouseLocations` → `inventory_locations` (array of objects)
   - Add `samples` array handling

### 4. Create Page (`page.tsx`)
**Status**: Partially done, needs completion

**Required Changes**:
1. ✅ Updated `initialFormData` to snake_case
2. ✅ Updated validation in `handlePublish`
3. ⚠️ Update `handleApplyFields` - Currently maps grouped fields to camelCase, needs to:
   - Accept snake_case merged data directly from API
   - Apply to form without transformation
   - Remove the complex field mapping logic (lines 553-900+)
4. ⚠️ Update `handleApplyAll` - Similar mapping issues
5. ⚠️ Implement actual database save logic in `handlePublish` and `handleSaveDraft`

### 5. Merge API (`/api/documents/merge/route.ts`)
**Status**: Needs update

**Required Changes**:
1. Update to accept snake_case `currentData`
2. Use snake_case merge prompt (already updated in extraction-schema)
3. Return snake_case merged data
4. No transformation needed - direct pass-through

### 6. Product Save/Load Logic
**Status**: Not implemented

**Required Changes**:
1. Create `/api/products/route.ts` (POST/GET/PUT)
2. Implement save logic:
   ```typescript
   const productData = {
     product_name: formData.product_name,
     origin_country: formData.origin_country,    // extracted column
     manufacturer_name: formData.manufacturer_name, // extracted column
     category: formData.category,                // extracted column
     form: formData.form,                        // extracted column
     grade: formData.grade,                      // extracted column
     applications: formData.applications,        // extracted column (array)
     product_data: formData,                     // full JSONB
     status: 'published' | 'draft',
     industry_code: 'food_supplement',
   }
   ```

3. Implement load logic:
   - Fetch from database
   - Return combined data (extracted columns + product_data)
   - Form receives snake_case data directly

## 🎯 Benefits of This Migration

1. **Consistent naming** - snake_case everywhere (DB, API, Form, AI)
2. **No transformation layer** - Direct mapping reduces bugs
3. **Fast searches** - 6 key fields indexed for performance
4. **Flexible schema** - Detailed fields stay in JSONB
5. **AI-friendly** - Can send any text value
6. **User-friendly** - Dropdown suggestions via ComboboxInput
7. **Standardized values** - Consistent naming (e.g., "China" not "china")

## 📝 Next Steps (Priority Order)

1. **Update FoodSupplementForm.tsx** - Replace all camelCase with snake_case, add ComboboxInput
2. **Simplify handleApplyFields** - Remove complex mapping, accept snake_case directly
3. **Update merge API** - Handle snake_case input/output
4. **Implement product save API** - Sync extracted columns with product_data
5. **Test end-to-end flow** - Upload docs → Merge → Display → Save

## 🔧 Key Files to Update

- `apps/web/components/products/industries/food-supplement/FoodSupplementForm.tsx` - ~1500 lines, needs systematic refactor
- `apps/web/app/dashboard/products/create/page.tsx` - Update handleApplyFields (lines 453-900+)
- `apps/web/app/api/documents/merge/route.ts` - Update to handle snake_case
- `apps/web/app/api/products/route.ts` - Create new (doesn't exist yet)

## ⚠️ Breaking Changes

- All existing saved products (if any) will need migration
- Form component props change from camelCase to snake_case
- API contracts change to snake_case


