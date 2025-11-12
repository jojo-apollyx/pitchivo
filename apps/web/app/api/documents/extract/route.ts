import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for AI processing

/**
 * Extract data from uploaded document using Azure OpenAI
 * Supports: GPT-4o, GPT-4.5, GPT-5, o1, o3, or any vision-capable model
 * POST /api/documents/extract
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get document extraction record
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError || !extraction) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update status to analyzing
    await supabase
      .from('document_extractions')
      .update({ analysis_status: 'analyzing' })
      .eq('id', fileId)

    // Get signed URL for file access
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(extraction.storage_path, 3600) // 1 hour expiry

    if (urlError || !signedUrlData?.signedUrl) {
      await supabase
        .from('document_extractions')
        .update({ 
          analysis_status: 'failed',
          error_message: 'Failed to create file access URL'
        })
        .eq('id', fileId)
      return NextResponse.json({ error: 'Failed to access file' }, { status: 500 })
    }

    // Download file to base64 for GPT-4
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(extraction.storage_path)

    if (downloadError || !fileData) {
      await supabase
        .from('document_extractions')
        .update({ 
          analysis_status: 'failed',
          error_message: 'Failed to download file'
        })
        .eq('id', fileId)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Convert file to base64 for AI
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64File = buffer.toString('base64')
    const mimeType = extraction.mime_type
    const fileDataUrl = `data:${mimeType};base64,${base64File}`

    // Initialize Azure OpenAI with Vercel AI SDK
    const azure = createAzure({
      resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
    })

    // Use whatever deployment you have configured (GPT-4o, GPT-4.5, GPT-5, o1, o3, etc.)
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    
    if (!deploymentName) {
      throw new Error('AZURE_OPENAI_DEPLOYMENT or AZURE_OPENAI_DEPLOYMENT_NAME not configured in .env.local')
    }

    console.log(`[Document Extraction] Using Azure OpenAI deployment: ${deploymentName}`)
    const model = azure(deploymentName)

    // System prompt for extraction based on industry-standard template
    const systemPrompt = `You are a specialized AI assistant for extracting structured data from technical documents in the food supplement and ingredients industry.

Extract all relevant information from documents (COA, TDS, MSDS, Specification Sheets). Return data grouped by category for better organization.

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no code blocks.

Extract into these groups (omit empty groups):

{
  "document_type": "COA" | "TDS" | "MSDS" | "Specification_Sheet" | "Certificate" | "Other",
  "confidence_score": number (0-1),
  
  "basic": {
    "product_name": string,
    "product_aliases": string,
    "category": string,
    "description": string,
    "application": string[],
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
    "manufacturer_name": string,
    "factory_address": string,
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
    "warranty_policy": string
  }
}

Guidelines:
- Extract ONLY information clearly visible in the document
- For numerical values, extract numbers without units
- For presence/absence tests, use exact enum values
- Group related fields together
- Omit fields/groups with no data
- Be precise with technical specifications`

    // Generate extraction using Vercel AI SDK
    const response = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this ${extraction.filename} document and extract all relevant product information. Focus on technical specifications, test results, manufacturer details, and safety information.`
            },
            {
              type: 'image',
              image: fileDataUrl
            }
          ]
        }
      ],
      temperature: 0.1,
    })

    // Parse the JSON response
    let result: any
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const textContent = response.text.trim()
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : textContent
      result = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.text)
      throw new Error('Failed to parse extraction results')
    }

    // Prepare summary
    const detectedGroups = Object.keys(result).filter(key => 
      typeof result[key] === 'object' && 
      result[key] !== null &&
      !Array.isArray(result[key]) &&
      !['document_type', 'confidence_score'].includes(key)
    )

    const fileSummary = {
      document_type: result.document_type,
      confidence_score: result.confidence_score,
      detected_groups: detectedGroups,
      extraction_timestamp: new Date().toISOString(),
      file_size: extraction.file_size,
      mime_type: extraction.mime_type
    }

    // Prepare extracted values - keep grouped structure + flatten for primary fields
    const extractedValues: any = {
      // Store full grouped data
      _grouped: {
        basic: result.basic || {},
        origin: result.origin || {},
        physical: result.physical || {},
        chemical: result.chemical || {},
        microbial: result.microbial || {},
        nutrition: result.nutrition || {},
        allergen: result.allergen || {},
        health_usage: result.health_usage || {},
        formulation: result.formulation || {},
        quality: result.quality || {},
        compliance: result.compliance || {},
        packaging: result.packaging || {},
        supplier: result.supplier || {},
        sustainability: result.sustainability || {},
        commercial: result.commercial || {}
      },
      
      // Primary fields (for existing form)
      productName: result.basic?.product_name,
      category: result.basic?.category,
      description: result.basic?.description,
      applications: result.basic?.application,
      originCountry: result.basic?.origin_country,
      casNumber: result.basic?.cas_number,
      einecs: result.basic?.einecs_number,
      appearance: result.basic?.appearance,
      
      // Physical
      form: result.physical?.form,
      color: result.physical?.color,
      odor: result.physical?.odor,
      taste: result.physical?.taste,
      particleSize: result.physical?.particle_size_range,
      bulkDensity: result.physical?.bulk_density,
      solubility: result.physical?.solubility_water,
      
      // Chemical
      assay: result.chemical?.assay_min,
      moisture: result.chemical?.moisture_max,
      ashContent: result.chemical?.ash_max,
      ph: result.chemical?.ph_value,
      lead: result.chemical?.lead_max,
      arsenic: result.chemical?.arsenic_max,
      cadmium: result.chemical?.cadmium_max,
      mercury: result.chemical?.mercury_max,
      pesticideResidue: result.chemical?.pesticide_residue,
      
      // Microbial
      totalPlateCount: result.microbial?.total_plate_count_max,
      yeastMold: result.microbial?.yeast_mold_max,
      eColiPresence: result.microbial?.e_coli,
      salmonellaPresence: result.microbial?.salmonella,
      staphylococcusPresence: result.microbial?.staphylococcus_aureus,
      
      // Allergen
      allergenInfo: result.allergen?.allergen_statement,
      
      // Compliance
      gmoStatus: result.compliance?.is_gmo === 'Yes' ? 'Contains_GMO' : result.compliance?.is_gmo === 'No' ? 'GMO_Free' : 'Unknown',
      irradiationStatus: result.chemical?.radiation_treatment === 'Yes' ? 'Irradiated' : result.chemical?.radiation_treatment === 'No' ? 'Non_Irradiated' : 'Unknown',
      certificates: result.compliance?.specification_standard,
      
      // Packaging
      packagingType: result.packaging?.packaging_type?.[0],
      netWeight: result.packaging?.net_weight_per_package,
      storageConditions: result.packaging?.storage_conditions ? [result.packaging.storage_conditions] : [],
      
      // Supplier
      manufacturerName: result.supplier?.manufacturer_name,
      
      // Commercial
      shelfLife: result.commercial?.shelf_life_months,
    }

    // Remove undefined values
    Object.keys(extractedValues).forEach(key => {
      if (extractedValues[key as keyof typeof extractedValues] === undefined) {
        delete extractedValues[key as keyof typeof extractedValues]
      }
    })

    // Update extraction record
    const { data: updatedExtraction, error: updateError } = await supabase
      .from('document_extractions')
      .update({
        raw_extracted_data: { ai_response: result },
        file_summary: fileSummary,
        extracted_values: extractedValues,
        analysis_status: 'completed'
      })
      .eq('id', fileId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to save extraction results' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Extraction completed successfully',
      extraction: updatedExtraction
    })

  } catch (error) {
    console.error('Extraction error:', error)
    
    // Try to update status to failed
    try {
      const { fileId } = await request.json()
      if (fileId) {
        const supabase = await createClient()
        await supabase
          .from('document_extractions')
          .update({ 
            analysis_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', fileId)
      }
    } catch {}

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

