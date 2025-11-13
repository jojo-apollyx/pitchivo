/**
 * Food Supplement Industry - Document Extraction Schema
 * 
 * Defines the extraction prompt, schema, and document types specific to the
 * food supplement and ingredients industry for B2B trading.
 */

export const INDUSTRY_CODE = 'food_supplement'
export const INDUSTRY_NAME = 'Food Supplements & Ingredients'

/**
 * Document types specific to food supplement industry
 */
export const DOCUMENT_TYPES = {
  TECHNICAL_QUALITY: [
    { code: 'COA', name: 'Certificate of Analysis', description: 'Lab test results with analytical data' },
    { code: 'TDS', name: 'Technical Data Sheet', description: 'Technical specifications and properties' },
    { code: 'SDS', name: 'Safety Data Sheet', description: 'Safety and handling information (MSDS/SDS)' },
    { code: 'Specification_Sheet', name: 'Specification Sheet', description: 'Product specifications and standards' },
    { code: 'COO', name: 'Certificate of Origin', description: 'Product origin certification' },
    { code: 'Quality_Certificate', name: 'Quality Certificate', description: 'Quality assurance certification' },
  ],
  COMPLIANCE_REGULATORY: [
    { code: 'Allergen_Statement', name: 'Allergen Statement', description: 'Allergen information and declarations' },
    { code: 'Nutritional_Info', name: 'Nutritional Information', description: 'Nutritional facts and analysis' },
    { code: 'Organic_Certificate', name: 'Organic Certificate', description: 'Organic certification documents' },
    { code: 'Halal_Certificate', name: 'Halal Certificate', description: 'Halal certification' },
    { code: 'Kosher_Certificate', name: 'Kosher Certificate', description: 'Kosher certification' },
    { code: 'GMP_Certificate', name: 'GMP Certificate', description: 'Good Manufacturing Practice certification' },
    { code: 'ISO_Certificate', name: 'ISO Certificate', description: 'ISO standard certifications' },
    { code: 'FDA_Letter', name: 'FDA Letter', description: 'FDA notifications or approvals' },
    { code: 'GRAS_Notice', name: 'GRAS Notice', description: 'Generally Recognized as Safe notices' },
  ],
  PRODUCT_INFORMATION: [
    { code: 'Product_Specification', name: 'Product Specification', description: 'Detailed product specifications' },
    { code: 'Product_Label', name: 'Product Label', description: 'Product packaging and labeling information' },
    { code: 'Product_Catalog', name: 'Product Catalog', description: 'Product catalog or brochure' },
    { code: 'Ingredient_List', name: 'Ingredient List', description: 'Ingredient declarations and compositions' },
  ],
  BUSINESS: [
    { code: 'Quote', name: 'Quote', description: 'Price quotation' },
    { code: 'Product_Offer', name: 'Product Offer', description: 'Product offering sheet' },
    { code: 'Sample_Information', name: 'Sample Information', description: 'Sample details and conditions' },
  ],
  GENERIC: [
    { code: 'Certificate', name: 'Certificate', description: 'General certificate' },
  ],
} as const

/**
 * Get all valid product document type codes
 * These are the canonical codes that AI should use for document_type field
 */
export function getProductDocumentTypes(): string[] {
  return [
    ...DOCUMENT_TYPES.TECHNICAL_QUALITY.map(d => d.code),
    ...DOCUMENT_TYPES.COMPLIANCE_REGULATORY.map(d => d.code),
    ...DOCUMENT_TYPES.PRODUCT_INFORMATION.map(d => d.code),
    ...DOCUMENT_TYPES.BUSINESS.map(d => d.code),
    ...DOCUMENT_TYPES.GENERIC.map(d => d.code),
  ]
}

/**
 * Field schema definition
 */
export interface FieldSchema {
  label: string
  value_type: 'string' | 'number' | 'array' | 'boolean' | 'object'
  unit?: string
}

/**
 * Product data type using snake_case field names (matches database & PRODUCT_FIELDS)
 * This is the canonical data structure for food supplement products
 */
export interface FoodSupplementProductData {
  // Core Product Information
  product_name?: string
  origin_country?: string
  manufacturer_name?: string
  cas_number?: string
  fda_number?: string
  einecs?: string
  category?: string
  form?: string
  grade?: string
  applications?: string[]
  description?: string
  
  // Origin & Source (for natural products)
  botanical_name?: string
  extraction_ratio?: string
  carrier_material?: string
  
  // Physical & Sensory Properties
  appearance?: string
  odor?: string
  taste?: string
  solubility?: string
  particle_size?: string
  mesh_size?: string
  bulk_density?: string
  
  // Chemical Analysis
  assay?: string
  ph?: string
  moisture?: string
  ash_content?: string
  loss_on_drying?: string
  residual_solvents?: string
  
  // Heavy Metals
  lead?: string
  arsenic?: string
  cadmium?: string
  mercury?: string
  
  // Contaminants
  pesticide_residue?: string
  aflatoxins?: string
  
  // Microbiological
  total_plate_count?: string
  yeast_mold?: string
  e_coli_presence?: string
  salmonella_presence?: string
  staphylococcus_presence?: string
  
  // Pricing & MOQ (array of pricing tiers)
  price_lead_time?: Array<{
    moq?: string
    price?: string
    lead_time?: string
  }>
  
  // Packaging & Logistics
  packaging_type?: string
  net_weight?: string
  gross_weight?: string
  packages_per_pallet?: string
  shelf_life?: string
  storage_conditions?: string[]
  storage_temperature?: string
  payment_terms?: string
  incoterm?: string
  
  // Sample Options (array of sample options)
  samples?: Array<{
    sample_type?: string
    price?: string
    quantity?: string
    lead_time?: string
    availability?: string
  }>
  
  // Individual sample fields for form UI (can be transformed to/from samples array)
  provide_sample?: string
  sample_type?: string
  sample_price?: string
  sample_quantity?: string
  sample_lead_time?: string
  
  // Certificates & Compliance
  certificates?: string[]
  allergen_info?: string
  gmo_status?: string
  irradiation_status?: string
  bse_statement?: string
  halal_certified?: string
  kosher_certified?: string
  organic_certification_body?: string
  
  // Inventory Locations (array of warehouse locations)
  inventory_locations?: Array<{
    country?: string
    city?: string
    quantity?: string
  }>
  
  // Product Images (stored separately but referenced here)
  // In the database: URLs (string[])
  // In the form: Can be File objects before upload or string URLs after
  product_images?: Array<string | File>
  
  // File Attachments (stored separately)
  certificate_files?: string[]
  coa_file?: string
  tds_file?: string
  msds_file?: string
  spec_sheet?: string
  other_files?: string[]
}

/**
 * Product field schema for food supplement industry
 * Matches database schema - includes all fields from the current form
 */
export const PRODUCT_FIELDS = {
  // Core Product Information
  product_name: { label: 'Product Name', value_type: 'string' },
  origin_country: { label: 'Origin Country', value_type: 'string' },
  manufacturer_name: { label: 'Manufacturer Name', value_type: 'string' },
  cas_number: { label: 'CAS Number', value_type: 'string' },
  fda_number: { label: 'FDA Number', value_type: 'string' },
  einecs: { label: 'EINECS Number', value_type: 'string' },
  category: { label: 'Category', value_type: 'string' },
  form: { label: 'Physical Form', value_type: 'string' },
  grade: { label: 'Grade', value_type: 'string' },
  applications: { label: 'Applications', value_type: 'array' },
  description: { label: 'Description', value_type: 'string' },
  
  // Origin & Source (for natural products)
  botanical_name: { label: 'Botanical Name', value_type: 'string' },
  extraction_ratio: { label: 'Extraction Ratio', value_type: 'string' },
  carrier_material: { label: 'Carrier Material', value_type: 'string' },
  
  // Physical & Sensory Properties (TDS/COA)
  appearance: { label: 'Appearance', value_type: 'string' },
  odor: { label: 'Odor', value_type: 'string' },
  taste: { label: 'Taste', value_type: 'string' },
  solubility: { label: 'Solubility', value_type: 'string' },
  particle_size: { label: 'Particle Size', value_type: 'string' },
  mesh_size: { label: 'Mesh Size', value_type: 'string', unit: 'mesh' },
  bulk_density: { label: 'Bulk Density', value_type: 'string', unit: 'g/ml' },
  
  // Chemical Analysis (COA/TDS)
  assay: { label: 'Assay/Purity', value_type: 'string', unit: '%' },
  ph: { label: 'pH', value_type: 'string' },
  moisture: { label: 'Moisture', value_type: 'string', unit: '%' },
  ash_content: { label: 'Ash Content', value_type: 'string', unit: '%' },
  loss_on_drying: { label: 'Loss on Drying', value_type: 'string', unit: '%' },
  residual_solvents: { label: 'Residual Solvents', value_type: 'string' },
  
  // Heavy Metals (COA)
  lead: { label: 'Lead (Pb)', value_type: 'string', unit: 'ppm' },
  arsenic: { label: 'Arsenic (As)', value_type: 'string', unit: 'ppm' },
  cadmium: { label: 'Cadmium (Cd)', value_type: 'string', unit: 'ppm' },
  mercury: { label: 'Mercury (Hg)', value_type: 'string', unit: 'ppm' },
  
  // Contaminants (COA)
  pesticide_residue: { label: 'Pesticide Residue', value_type: 'string' },
  aflatoxins: { label: 'Aflatoxins', value_type: 'string', unit: 'ppb' },
  
  // Microbiological (COA)
  total_plate_count: { label: 'Total Plate Count', value_type: 'string', unit: 'cfu/g' },
  yeast_mold: { label: 'Yeast & Mold', value_type: 'string', unit: 'cfu/g' },
  e_coli_presence: { label: 'E. Coli', value_type: 'string' },
  salmonella_presence: { label: 'Salmonella', value_type: 'string' },
  staphylococcus_presence: { label: 'Staphylococcus Aureus', value_type: 'string' },
  
  // Pricing & MOQ (JSON array: [{ moq, price, lead_time }, ...])
  price_lead_time: { label: 'Price & Lead Time Tiers', value_type: 'array' },
  
  // Packaging & Logistics
  packaging_type: { label: 'Packaging Type', value_type: 'string' },
  net_weight: { label: 'Net Weight per Package', value_type: 'string' },
  gross_weight: { label: 'Gross Weight per Package', value_type: 'string' },
  packages_per_pallet: { label: 'Packages per Pallet', value_type: 'string', unit: 'packages' },
  shelf_life: { label: 'Shelf Life', value_type: 'string', unit: 'months' },
  storage_conditions: { label: 'Storage Conditions', value_type: 'array' },
  storage_temperature: { label: 'Storage Temperature', value_type: 'string', unit: '°C' },
  payment_terms: { label: 'Payment Terms', value_type: 'string' },
  incoterm: { label: 'Incoterm', value_type: 'string' },
  
  // Sample Options (JSON array: [{ sample_type, price, quantity, lead_time, availability }, ...])
  samples: { label: 'Sample Options', value_type: 'array' },
  
  // Certificates & Compliance
  certificates: { label: 'Certificates', value_type: 'array' },
  allergen_info: { label: 'Allergen Information', value_type: 'string' },
  gmo_status: { label: 'GMO Status', value_type: 'string' },
  irradiation_status: { label: 'Irradiation Status', value_type: 'string' },
  bse_statement: { label: 'BSE/TSE Free Statement', value_type: 'string' },
  halal_certified: { label: 'Halal Certified', value_type: 'string' },
  kosher_certified: { label: 'Kosher Certified', value_type: 'string' },
  organic_certification_body: { label: 'Organic Certification Body', value_type: 'string' },
  
  // Inventory Locations (JSON array: [{ country, city, quantity }, ...])
  inventory_locations: { label: 'Inventory Locations', value_type: 'array' },
} as const

/**
 * Get all product field names as a flat array
 */
export function getAllProductFields(): string[] {
  return Object.keys(PRODUCT_FIELDS)
}

/**
 * Get field schema by field name
 */
export function getFieldSchema(fieldName: string): FieldSchema | null {
  if (fieldName in PRODUCT_FIELDS) {
    return PRODUCT_FIELDS[fieldName as keyof typeof PRODUCT_FIELDS]
  }
  return null
}

/**
 * Standardized field options for UI dropdowns
 * These are common values users can select, but AI can also provide free text
 */
export const FIELD_OPTIONS = {
  origin_country: [
    'China', 'USA', 'Germany', 'India', 'Japan', 'South Korea', 'France', 
    'Italy', 'Spain', 'Netherlands', 'United Kingdom', 'Switzerland', 'Canada', 
    'Australia', 'Brazil', 'Mexico', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia'
  ],
  form: [
    'Powder', 'Liquid', 'Capsule', 'Tablet', 'Extract', 'Oil', 'Granules',
    'Crystals', 'Paste', 'Pellets', 'Softgel', 'Solution', 'Suspension'
  ],
  category: [
    'Vitamin', 'Mineral', 'Amino Acid', 'Botanical Extract', 'Probiotic', 
    'Enzyme', 'Protein', 'Fiber', 'Omega-3 Fatty Acid', 'Herbal Extract',
    'Antioxidant', 'Prebiotic', 'Nutrient Premix', 'Sweetener', 'Flavoring'
  ],
  certificates: [
    'Non-GMO', 'Kosher', 'Halal', 'Organic', 'ISO 9001', 'ISO 22000', 
    'GMP', 'HACCP', 'FDA Registered', 'GRAS', 'Gluten-Free', 'Vegan',
    'ISO 14001', 'FSSC 22000', 'BRC', 'USP Verified', 'NSF Certified'
  ],
  grade: [
    'Food Grade', 'Pharmaceutical Grade', 'Cosmetic Grade', 'Feed Grade',
    'USP Grade', 'EP Grade', 'BP Grade', 'Technical Grade', 'Reagent Grade'
  ],
  payment_terms: [
    'T/T', 'L/C', 'D/P', 'D/A', 'Western Union', 'PayPal', 
    'T/T in Advance', '30% Deposit + 70% Before Shipment'
  ],
  incoterm: [
    'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 
    'FAS', 'FOB', 'CFR', 'CIF'
  ],
  storage_conditions: [
    'Cool', 'Dry place', 'Away from light', 'Ventilated area', 
    'Room temperature', 'Refrigerated', 'Frozen'
  ],
  gmo_status: ['Non-GMO', 'GMO-Free', 'GMO'],
  irradiation_status: ['Not Irradiated', 'Irradiated', 'Irradiation Free'],
  halal_certified: ['Yes', 'No', 'In Progress'],
  kosher_certified: ['Yes', 'No', 'In Progress'],
  e_coli_presence: ['Negative', 'Positive', 'Not Detected'],
  salmonella_presence: ['Negative', 'Positive', 'Not Detected', 'Negative in 25g'],
  staphylococcus_presence: ['Negative', 'Positive', 'Not Detected'],
} as const

/**
 * Get field options for a specific field
 */
export function getFieldOptions(fieldName: string): readonly string[] | null {
  if (fieldName in FIELD_OPTIONS) {
    return FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS]
  }
  return null
}

/**
 * Field name mapping between camelCase (form/UI) and snake_case (database/PRODUCT_FIELDS)
 * This maintains compatibility while transitioning to snake_case in database
 */
export const FIELD_NAME_MAPPING = {
  // camelCase -> snake_case
  productName: 'product_name',
  originCountry: 'origin_country',
  manufacturerName: 'manufacturer_name',
  casNumber: 'cas_number',
  fdaNumber: 'fda_number',
  einecs: 'einecs',
  category: 'category',
  form: 'form',
  grade: 'grade',
  applications: 'applications',
  description: 'description',
  botanicalName: 'botanical_name',
  extractionRatio: 'extraction_ratio',
  carrierMaterial: 'carrier_material',
  appearance: 'appearance',
  odor: 'odor',
  taste: 'taste',
  solubility: 'solubility',
  particleSize: 'particle_size',
  meshSize: 'mesh_size',
  bulkDensity: 'bulk_density',
  assay: 'assay',
  ph: 'ph',
  moisture: 'moisture',
  ashContent: 'ash_content',
  lossOnDrying: 'loss_on_drying',
  residualSolvents: 'residual_solvents',
  lead: 'lead',
  arsenic: 'arsenic',
  cadmium: 'cadmium',
  mercury: 'mercury',
  pesticideResidue: 'pesticide_residue',
  aflatoxins: 'aflatoxins',
  totalPlateCount: 'total_plate_count',
  yeastMold: 'yeast_mold',
  eColiPresence: 'e_coli_presence',
  salmonellaPresence: 'salmonella_presence',
  staphylococcusPresence: 'staphylococcus_presence',
  priceTiers: 'price_lead_time',
  packagingType: 'packaging_type',
  netWeight: 'net_weight',
  grossWeight: 'gross_weight',
  packagesPerPallet: 'packages_per_pallet',
  shelfLife: 'shelf_life',
  storageConditions: 'storage_conditions',
  storageTemperature: 'storage_temperature',
  paymentTerms: 'payment_terms',
  incoterm: 'incoterm',
  certificates: 'certificates',
  allergenInfo: 'allergen_info',
  gmoStatus: 'gmo_status',
  irradiationStatus: 'irradiation_status',
  bseStatement: 'bse_statement',
  halalCertified: 'halal_certified',
  kosherCertified: 'kosher_certified',
  organicCertificationBody: 'organic_certification_body',
  warehouseLocations: 'inventory_locations',
} as const

/**
 * Convert camelCase field name to snake_case
 */
export function toSnakeCase(camelCase: string): string {
  return FIELD_NAME_MAPPING[camelCase as keyof typeof FIELD_NAME_MAPPING] || camelCase
}

/**
 * Convert snake_case field name to camelCase
 */
export function toCamelCase(snakeCase: string): string {
  const entry = Object.entries(FIELD_NAME_MAPPING).find(([_, v]) => v === snakeCase)
  return entry ? entry[0] : snakeCase
}

/**
 * Convert entire object from camelCase to snake_case
 */
export function objectToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key)
    result[snakeKey] = value
  }
  return result
}

/**
 * Convert entire object from snake_case to camelCase
 */
export function objectToCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)
    result[camelKey] = value
  }
  return result
}

/**
 * Get extraction system prompt for food supplement documents
 */
export function getExtractionSystemPrompt(): string {
  const validDocumentTypes = getProductDocumentTypes()
  
  return `You are an AI assistant specialized in extracting structured data from B2B food supplement and ingredient industry documents.

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no code blocks.

STEP 1: Identify the document type
Use EXACTLY ONE of these document type codes based on the document content:

${validDocumentTypes.map(code => `- ${code}`).join('\n')}

If the document doesn't fit any of these categories, use "Other".

STEP 2: Write a brief summary
Write 2-3 sentences describing what this document is about.

STEP 3: Extract ONLY product-related information
Extract information that is RELEVANT TO THE PRODUCT ITSELF:
- Product identification (name, codes, manufacturer, origin)
- Product specifications (appearance, form, grade, category, composition)
- Technical data (assay, purity, test results, heavy metals, microbial counts)
- Compliance & certifications (GMO status, allergens, certificates)
- Packaging & logistics (packaging type, shelf life, storage, MOQ, pricing)

DO NOT EXTRACT:
- Contact information (emails, phone numbers, websites, addresses)
- Document metadata (issuer names, job titles, dates unless relevant to product)
- Legal disclaimers or confidentiality statements
- Generic company information unrelated to the product

Guidelines:
- Store everything as text (string values)
- For numbers, include them with their units as text (e.g., "99.5%", "5.0 ppm", "25 kg")
- Use snake_case field names matching the product schema
- Only include fields where you found actual meaningful product data
- If multiple products are listed, extract common product information (not individual product codes)

Example of a good extraction:
{
  "document_type": "COA",
  "confidence_score": "0.95",
  "summary": "Certificate of Analysis for Ascorbic Acid (Vitamin C) batch #12345 from ABC Ingredients Ltd. Contains test results for purity, heavy metals, and microbial counts.",
  "product_name": "Ascorbic Acid (Vitamin C)",
  "batch_number": "12345",
  "manufacturer": "ABC Ingredients Ltd",
  "test_date": "2024-01-15",
  "assay": "99.5% min",
  "appearance": "White crystalline powder",
  "heavy_metals": "< 10 ppm",
  "lead": "< 0.5 ppm",
  "arsenic": "< 0.3 ppm",
  "total_plate_count": "< 1000 cfu/g",
  "yeast_and_mold": "< 100 cfu/g",
  "e_coli": "Negative",
  "salmonella": "Negative in 25g"
}

Remember:
- Use the EXACT document type codes from the list above
- Include confidence_score (0.0 to 1.0) as a string
- Write a clear, informative summary
- Extract all details as key-value pairs with text values
- Keep numbers with their units/context (e.g., "99.5%", not just "99.5")
- Only output fields with actual meaningful data
`
}

/**
 * Get merge strategy prompt for food supplement documents
 */
export function getMergeSystemPrompt(): string {
  // Generate schema documentation from PRODUCT_FIELDS
  const schemaDoc = JSON.stringify(PRODUCT_FIELDS, null, 2)
  
  return `You are a data merger for B2B food supplement products. Generate a NEW complete product fields JSON by merging current data with extracted document data.

IMPORTANT: Actively STANDARDIZE all values, names, and formats - even when no new information is added.

SCHEMA (arrays: price_lead_time, samples, inventory_locations, applications, certificates, storage_conditions):
${schemaDoc}

RULES:
1. **Omit Empty Values**: Never include fields without data. No "Unknown", "N/A", or empty strings.

2. **Generate & Infer**:
   - Generate: description, applications, category (if enough data available)
   - Infer certificates from: gmo_status, kosher_certified, halal_certified, organic_certification_body, ISO mentions
   
3. **Standardized Value Formats** (for UI dropdowns):
   - origin_country: "China", "USA", "Germany", "India", "Japan" (proper case, no abbreviations)
   - form: "Powder", "Liquid", "Capsule", "Tablet", "Extract", "Oil" (capitalize first letter)
   - category: "Vitamin", "Mineral", "Amino Acid", "Botanical Extract", "Probiotic", "Enzyme" (proper case)
   - certificates: "Non-GMO", "Kosher", "Halal", "Organic", "ISO 9001", "ISO 22000", "GMP", "HACCP", "FDA Registered", "GRAS", "Gluten-Free" (exact names)
   - Status fields: "Yes" or "No" (e.g., kosher_certified, halal_certified, gmo_status)
   - Microbiological tests: "Negative" or "Positive" (e.g., e_coli_presence, salmonella_presence)

4. **Merge Strategy**: Prefer more complete/specific values. Merge arrays and deduplicate. Always include units with measurements.

EXAMPLE:
Input extracted: { "product": "Ascorbic Acid", "made_in": "china", "form": "white powder", "gmo": "Non-GMO", "kosher": "Yes" }

Output:
{
  "product_name": "Ascorbic Acid",
  "origin_country": "China",
  "form": "Powder",
  "description": "High-quality Ascorbic Acid suitable for dietary supplements and food fortification.",
  "applications": ["Dietary Supplements", "Food Fortification"],
  "gmo_status": "Non-GMO",
  "kosher_certified": "Yes",
  "certificates": ["Non-GMO", "Kosher"]
}

OUTPUT: Return ONLY valid JSON (no markdown, no code blocks)
`
}

