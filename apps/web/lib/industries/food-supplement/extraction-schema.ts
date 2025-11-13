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
    { code: 'MSDS', name: 'Material Safety Data Sheet', description: 'Safety and handling information' },
    { code: 'SDS', name: 'Safety Data Sheet', description: 'Safety and handling information' },
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
 * Get all product-related document type codes
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
 * Get extraction system prompt for food supplement documents
 */
export function getExtractionSystemPrompt(): string {
  return `You are an AI assistant specialized in extracting structured data from B2B food supplement and ingredient industry documents.

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no code blocks.

STEP 1: Analyze and identify the document type
Determine what type of document this is based on its content, structure, and purpose. Common document types in the food/supplement industry include:

TECHNICAL & QUALITY DOCUMENTS:
- COA (Certificate of Analysis) - Lab test results with analytical data
- TDS (Technical Data Sheet) - Technical specifications and properties
- MSDS/SDS (Material Safety Data Sheet) - Safety and handling information
- Specification_Sheet - Product specifications and standards
- COO (Certificate of Origin) - Product origin certification
- Quality_Certificate - Quality assurance certification

COMPLIANCE & REGULATORY:
- Allergen_Statement - Allergen information and declarations
- Nutritional_Info - Nutritional facts and analysis
- Organic_Certificate - Organic certification documents
- Halal_Certificate - Halal certification
- Kosher_Certificate - Kosher certification
- GMP_Certificate - Good Manufacturing Practice certification
- ISO_Certificate - ISO standard certifications
- FDA_Letter - FDA notifications or approvals
- GRAS_Notice - Generally Recognized as Safe notices

PRODUCT INFORMATION:
- Product_Specification - Detailed product specifications
- Product_Label - Product packaging and labeling information
- Product_Catalog - Product catalog or brochure
- Ingredient_List - Ingredient declarations and compositions

BUSINESS DOCUMENTS:
- Quote - Price quotation
- Product_Offer - Product offering sheet
- Sample_Information - Sample details and conditions

If the document doesn't fit any of these categories or is not relevant to B2B food/supplement trading, classify it as "Other".

STEP 2: Extract data based on document relevance:

For PRODUCT-RELATED documents (technical, compliance, product info categories above):
Extract comprehensive product information using the detailed schema below. Be thorough and extract all available data.

For NON-PRODUCT documents (Other):
Set document_type to "Other" and only extract basic information visible in the document. Leave all product-specific fields empty.

{
  "document_type": string (from STEP 1),
  "confidence_score": number (0-1),
  
  "basic": {
    "product_name": string (for food docs) | document title/name (for other docs),
    "product_aliases": string,
    "category": string (IMPORTANT: Extract product category/type from document, e.g., "Vitamin C", "Antioxidant", "Preservative", "Emulsifier", "Thickener", "Sweetener", "Colorant", "Flavor", "Probiotic", "Enzyme", "Amino Acid", "Mineral", "Herbal Extract", etc.),
    "description": string (document description or summary),
    "application": string[] (IMPORTANT: Extract all applications/uses mentioned in the document, e.g., ["Food additive", "Dietary supplement", "Pharmaceutical", "Cosmetic", "Beverage", "Bakery", "Dairy", "Confectionery", "Meat processing", "Functional food", etc.]),
    "brand_name": string,
    "origin_country": string,
    "hs_code": string,
    "cas_number": string,
    "einecs_number": string,
    "appearance": string
  },
  
  "origin": {
    "source_type": string,
    "origin_material": string,
    "botanical_name": string,
    "plant_part_used": string,
    "wild_crafted_vs_cultivated": string,
    "processing_method": string,
    "extraction_solvent": string,
    "extraction_ratio": string,
    "standardization_marker": string,
    "carrier_material": string,
    "probiotic_strain": string
  },
  
  "physical": {
    "form": string,
    "color": string,
    "odor": string,
    "taste": string,
    "particle_size_range": string,
    "mesh_size": string,
    "bulk_density": number,
    "solubility_water": string,
    "solubility_ethanol": string,
    "dispersion_properties": string,
    "viscosity": string
  },
  
  "chemical": {
    "assay_min": number,
    "assay_max": number,
    "main_component": string,
    "chemical_formula": string,
    "molecular_weight": number,
    "ph_value": string,
    "moisture_max": number,
    "ash_max": number,
    "residual_solvents": string,
    "heavy_metals_max": number,
    "lead_max": number,
    "arsenic_max": number,
    "cadmium_max": number,
    "mercury_max": number,
    "pesticide_residue": string,
    "aflatoxins_max": number,
    "ochratoxin_a_max": number,
    "pahs_max": number,
    "ethylene_oxide": string,
    "glyphosate_max": number,
    "radiation_treatment": "Yes" | "No",
    "sulfite_content": number,
    "amino_acid_profile": string
  },
  
  "microbial": {
    "total_plate_count_max": number,
    "yeast_mold_max": number,
    "coliforms": string,
    "e_coli": "Absent" | "Present" | "Unknown",
    "salmonella": "Absent" | "Present" | "Unknown",
    "staphylococcus_aureus": "Absent" | "Present" | "Unknown",
    "listeria": "Absent" | "Present" | "Unknown",
    "probiotic_cfu_guarantee": number,
    "probiotic_viability_method": string
  },
  
  "nutrition": {
    "energy": number,
    "protein": number,
    "protein_digestibility_score": string,
    "carbohydrates": number,
    "sugars": number,
    "fiber": number,
    "fat": number,
    "saturated_fat": number,
    "sodium": number
  },
  
  "allergen": {
    "contains_peanuts": "Yes" | "No" | "May Contain",
    "contains_tree_nuts": "Yes" | "No" | "May Contain",
    "contains_milk": "Yes" | "No" | "May Contain",
    "contains_eggs": "Yes" | "No" | "May Contain",
    "contains_fish": "Yes" | "No" | "May Contain",
    "contains_shellfish": "Yes" | "No" | "May Contain",
    "contains_soy": "Yes" | "No" | "May Contain",
    "contains_wheat": "Yes" | "No" | "May Contain",
    "contains_sesame": "Yes" | "No" | "May Contain",
    "contains_sulfites": "Yes" | "No" | "May Contain",
    "contains_celery": "Yes" | "No" | "May Contain",
    "contains_mustard": "Yes" | "No" | "May Contain",
    "contains_lupin": "Yes" | "No" | "May Contain",
    "allergen_statement": string
  },
  
  "health_usage": {
    "health_benefits": string,
    "recommended_dosage": string,
    "contraindications": string,
    "warnings": string,
    "gras_status": string,
    "gras_number": string,
    "ndi_status": string,
    "novel_food_status_eu": string,
    "health_claims_approved": string
  },
  
  "formulation": {
    "recommended_usage_level_formulation": string,
    "compatibility": string,
    "stability_data": string,
    "ph_stability_range": string,
    "heat_stability": string,
    "light_stability": string,
    "moisture_sensitivity": string,
    "technical_support_available": string
  },
  
  "quality": {
    "specification_standard": string[],
    "test_methods_used": string,
    "batch_testing_frequency": string,
    "coa_per_batch": string,
    "third_party_testing": string
  },
  
  "compliance": {
    "is_gmo": "Yes" | "No",
    "is_organic": "Yes" | "No",
    "organic_certification_body": string,
    "regulatory_compliance": string[],
    "prop65_compliance": string,
    "regulatory_restrictions": string,
    "halal_certified": "Yes" | "No",
    "kosher_certified": "Yes" | "No",
    "vegan_certified": "Yes" | "No",
    "non_gmo_certified": "Yes" | "No",
    "gluten_free_certified": "Yes" | "No"
  },
  
  "packaging": {
    "packaging_type": string[],
    "inner_packaging": string,
    "net_weight_per_package": string,
    "gross_weight_per_package": string,
    "package_dimensions": string,
    "packages_per_pallet": number,
    "container_20ft_capacity": string,
    "container_40ft_capacity": string,
    "food_grade_packaging": "Yes" | "No",
    "custom_packaging_available": string,
    "private_label_available": string
  },
  
  "supplier": {
    "manufacturer_name": string (for food docs) | issuing authority/organization (for other docs),
    "factory_address": string (for food docs) | address/location (for other docs),
    "production_capacity_annual": string,
    "established_year": number,
    "traceability_system": string,
    "batch_coding_system": string,
    "customer_audit_accepted": string,
    "main_export_markets": string[]
  },
  
  "sustainability": {
    "fair_trade_certified": "Yes" | "No",
    "rainforest_alliance": "Yes" | "No",
    "sustainable_sourcing": string,
    "social_responsibility": string[]
  },
  
  "commercial": {
    "price": number,
    "currency": string,
    "price_validity": string,
    "moq": number,
    "lead_time_days": number,
    "shelf_life_months": number,
    "remaining_shelf_life_guarantee": string,
    "spot_contract": string,
    "incoterm": string,
    "delivery_port": string,
    "delivery_from_country": string,
    "payment_terms": string,
    "sample_availability": string,
    "sample_quantity": string,
    "sample_lead_time": string,
    "storage_temperature": string,
    "storage_conditions": string,
    "volume_discount_available": string,
    "warranty_policy": string,
    "issue_date": string (for IDs/licenses - use commercial group),
    "expiration_date": string (for IDs/licenses - use commercial group)
  }
}

IMPORTANT EXTRACTION GUIDELINES:
1. For flat value extraction, extract as much data as possible from the document
2. Group all extracted fields into their appropriate categories (basic, physical, chemical, etc.)
3. Store the grouped data in a special "_grouped" property in the response
4. The response should have BOTH flat fields (for backward compatibility) AND grouped fields (in "_grouped" property)
5. For arrays (like application, specification_standard, etc.), extract ALL relevant values mentioned
6. For confidence_score, rate your confidence in the document type identification (0-1)
7. Leave fields empty/null if not found in the document

Example response structure:
{
  "document_type": "COA",
  "confidence_score": 0.95,
  "_grouped": {
    "basic": { "product_name": "Vitamin C", ... },
    "chemical": { "assay_min": 99.0, ... },
    ...
  },
  "product_name": "Vitamin C",
  "assay_min": 99.0,
  ...
}
`
}

/**
 * Get merge strategy prompt for food supplement documents
 */
export function getMergeSystemPrompt(): string {
  return `You are an intelligent data merger for a B2B food supplement product information system. Your task is to merge existing product form data with newly extracted fields from a document.

MERGE RULES:
1. **Text Fields (strings)**:
   - If current field is empty/null, use new value
   - If current field has value and new field has DIFFERENT value:
     * For descriptions: Combine both intelligently, removing duplicates
     * For single-value fields (like product name, manufacturer): Keep current value if they're similar, otherwise prefer the more complete one
     * For technical specs: Prefer the newer/more specific value

2. **Arrays**:
   - Merge arrays and remove duplicates
   - Keep all unique items from both arrays
   
3. **Numbers**:
   - If current is null/0, use new value
   - If both have values, prefer the new value ONLY if it's more precise or complete
   - Keep current value if new value is null/0

4. **Nested Objects (grouped fields)**:
   - Process each nested field according to the rules above
   - Preserve the grouped structure in output

5. **Special Considerations**:
   - If a field appears in both flat and grouped format, consolidate to grouped format
   - Preserve field types (don't convert numbers to strings)
   - For certifications and compliance data, merge and deduplicate

OUTPUT FORMAT:
Return ONLY a valid JSON object with the merged data. Include BOTH flat fields and a "_grouped" property if grouped data exists.
Do not include any explanations, markdown formatting, or code blocks - just the raw JSON.

Example output structure:
{
  "productName": "merged value",
  "description": "intelligently combined description",
  "applications": ["app1", "app2", "app3"],
  "_grouped": {
    "chemical": {
      "assay_min": 95.5,
      "moisture_max": 5.0
    }
  }
}`
}

