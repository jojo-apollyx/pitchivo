import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'
import {
  extractDocumentContent,
  detectDocumentType
} from '@/lib/document-extraction'
import { AzureOpenAI } from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for AI processing

/**
 * Extract data from uploaded document using Azure OpenAI
 * 
 * REQUIRES a vision-capable model deployment (NO FALLBACK):
 * - gpt-4o (recommended)
 * - gpt-4o-mini (cost-effective)
 * - gpt-4-turbo
 * - gpt-4-vision-preview
 * 
 * Does NOT support text-only models (gpt-3.5-turbo, gpt-4 without vision)
 * 
 * Environment variables (REQUIRED):
 * - AZURE_OPENAI_VISION_DEPLOYMENT (MANDATORY - no fallback)
 * - AZURE_OPENAI_RESOURCE_NAME
 * - AZURE_OPENAI_API_KEY
 * 
 * POST /api/documents/extract
 */
export async function POST(request: NextRequest) {
  // Store fileId early so it's available in error handling
  let fileId: string | undefined
  let supabase = await createClient()
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    fileId = body.fileId

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

    // Update status to analyzing (clear any previous error messages)
    const { error: updateStatusError } = await supabase
      .from('document_extractions')
      .update({ 
        analysis_status: 'analyzing',
        error_message: null // Clear previous error
      })
      .eq('id', fileId)
    
    if (updateStatusError) {
      console.error('[Document Extraction] Failed to update status to analyzing:', updateStatusError)
      // Continue anyway - the extraction might still work
    }

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

    // Convert file to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = extraction.mime_type
    
    // Use document extraction library to handle different file types
    const docType = detectDocumentType(mimeType, extraction.filename)
    console.log(`[Document Extraction] Processing ${docType} file: ${extraction.filename}`)
    
    // Initialize Azure OpenAI for vision processing
    const visionDeploymentName = process.env.AZURE_OPENAI_VISION_DEPLOYMENT
    
    if (!visionDeploymentName) {
      throw new Error(
        'AZURE_OPENAI_VISION_DEPLOYMENT is required for document extraction. ' +
        'Document extraction requires a vision-capable model and cannot use text-only models. ' +
        'Please set AZURE_OPENAI_VISION_DEPLOYMENT in .env.local to a vision-capable deployment name. ' +
        'Supported models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4-vision-preview'
      )
    }

    const azure = createAzure({
      resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
    })
    
    const model = azure(visionDeploymentName)
    
    // Azure OpenAI endpoint for Responses API
    const azureEndpoint = `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com`
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY!
    
    // Extract document content first (for PDF, DOCX, XLSX)
    let extractedContent: string
    let extractionMetadata: any = {}
    let needsVision = false
    
    if (docType === 'image' || docType === 'pdf') {
      // Images and PDFs are handled directly with Azure OpenAI Vision API
      extractedContent = ''
      needsVision = true
    } else {
      // DOCX, XLSX - extract text content
      const docExtraction = await extractDocumentContent(buffer, mimeType, extraction.filename)
      extractedContent = docExtraction.content
      extractionMetadata = docExtraction.metadata
      needsVision = false
    }

    // System prompt for extraction - adapts to document type
    const systemPrompt = `You are an AI assistant for extracting structured data from documents. First identify the document type, then extract relevant information using the appropriate schema.

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no code blocks.

STEP 1: Identify the document type from these options:
- "COA" (Certificate of Analysis)
- "TDS" (Technical Data Sheet)
- "MSDS" (Material Safety Data Sheet)
- "Specification_Sheet" (Product Specification)
- "Certificate" (General certificate)
- "Driver_License" (Driver's license or ID card)
- "Passport" (Passport document)
- "Invoice" (Invoice or bill)
- "Contract" (Contract or agreement)
- "Other" (Any other document type)

STEP 2: Extract data based on document type:

For FOOD/SUPPLEMENT documents (COA, TDS, MSDS, Specification_Sheet, Certificate):
Use the detailed food industry schema below.

For OTHER documents (Driver_License, Passport, Invoice, Contract, Other):
Only populate fields that are relevant to the document. Leave all food-specific fields empty. Extract what you see:
- For IDs/Licenses: name, date of birth, issue date, expiration date, ID number, issuing authority, address
- For Invoices: invoice number, date, items, amounts, vendor, customer
- For Contracts: parties, dates, terms, amounts
- For Other: extract key information visible in the document

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

CRITICAL EXTRACTION RULES:
1. For NON-FOOD documents (Driver_License, Passport, Invoice, Contract, Other):
   - DO NOT populate food-specific fields (origin, chemical, microbial, nutrition, allergen, health_usage, formulation, quality, compliance, packaging, sustainability)
   - ONLY populate: document_type, confidence_score, basic (description only), supplier (manufacturer_name, factory_address), commercial (dates if applicable)
   - Extract visible information accurately without forcing it into food-related fields

2. For FOOD documents (COA, TDS, MSDS, Specification_Sheet, Certificate):
   - Use all relevant groups as appropriate
   - Extract technical specifications accurately

3. General rules:
   - Extract ONLY information clearly visible in the document
   - For numerical values, extract numbers without units when possible
   - Omit entire groups if they have no relevant data
   - Be precise and accurate - do not make up values
   - If a field doesn't apply to the document type, leave it empty or omit it
   - CRITICAL: Always extract "category" and "application" fields when available in the document:
     * "category": Look for product type, classification, or category mentioned (e.g., "Vitamin C", "Antioxidant", "Preservative")
     * "application": Extract ALL uses/applications mentioned (e.g., sections titled "Applications", "Uses", "Recommended for", or any mention of where/how the product is used)`

    // Generate extraction using Azure OpenAI
    let response: Awaited<ReturnType<typeof generateText>> | { text: string } | undefined
    try {
      if (needsVision) {
        const startTime = Date.now()
        console.log(`[Document Extraction] Starting vision processing for ${docType} file: ${extraction.filename}`)
        
        if (docType === 'pdf') {
          // Use Azure OpenAI Responses API for PDFs (direct PDF support)
          // Documentation: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/responses
          console.log(`[Document Extraction] Using Azure Responses API for PDF...`)
          const visionStart = Date.now()
          
          // Initialize Azure OpenAI client
          const openaiClient = new AzureOpenAI({
            apiKey: azureApiKey,
            endpoint: azureEndpoint,
            apiVersion: '2025-03-01-preview'
          })
          
          // Combine system and user prompts for the Responses API
          const fullPrompt = `${systemPrompt}

User Request: Analyze this document (${extraction.filename}) and extract all relevant information. First identify the document type, then extract data using the appropriate schema. Extract only information that is clearly visible in the document.`
          
          // Step 1: Upload PDF file to Azure OpenAI using SDK
          console.log(`[Document Extraction] Uploading PDF file...`)
          const fileUploadStart = Date.now()
          
          // Convert Buffer to File object with proper filename for the SDK
          // Azure OpenAI needs the filename with extension to detect file type
          const fileBlob = new Blob([buffer], { type: mimeType })
          const fileObject = new File([fileBlob], extraction.filename, { type: mimeType })
          const file = await openaiClient.files.create({
            file: fileObject,
            purpose: 'assistants' // Note: user_data not supported for PDFs
          })
          
          const fileId = file.id
          const uploadTime = Date.now() - fileUploadStart
          console.log(`[Document Extraction] File uploaded with ID: ${fileId} (${uploadTime}ms)`)
          
          // Step 2: Call Azure OpenAI Responses API with file_id using SDK
          console.log(`[Document Extraction] Calling Responses API...`)
          const responseStart = Date.now()
          
          const responsesResult = await openaiClient.responses.create({
            model: visionDeploymentName,
            input: [
              {
                type: "message",
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: fullPrompt
                  },
                  {
                    type: "input_file",
                    file_id: fileId
                  }
                ]
              }
            ]
          } as any)
          
          const responseTime = Date.now() - responseStart
          console.log(`[Document Extraction] Responses API completed (${responseTime}ms)`)
          
          // Extract text from response
          // Response format: { output: [ { content: [ { text: "..." } ] } ] }
          const responseText = (responsesResult as any).output?.[0]?.content?.[0]?.text 
            || (responsesResult as any).output_text 
            || ''
          
          // Create a response-like object for compatibility
          response = {
            text: responseText
          }
          
          const totalTime = Date.now() - startTime
          console.log(
            `[Document Extraction] Total PDF processing: ${totalTime}ms ` +
            `(upload: ${uploadTime}ms, response: ${responseTime}ms)`
          )
        } else {
          // Handle images with Vercel AI SDK (Chat Completions API)
          console.log(`[Document Extraction] Using Chat Completions API for image...`)
          const visionStart = Date.now()
          
          const base64 = buffer.toString('base64')
          const dataUrl = `data:${mimeType};base64,${base64}`
          
          response = await generateText({
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
                    text: `Analyze this document (${extraction.filename}) and extract all relevant information. First identify the document type, then extract data using the appropriate schema. Extract only information that is clearly visible in the document.`
                  },
                  {
                    type: 'image' as const,
                    image: dataUrl
                  }
                ]
              }
            ],
            temperature: 0.1
          })
          
          const visionTime = Date.now() - visionStart
          console.log(`[Document Extraction] Vision API processing took ${visionTime}ms`)
          
          const totalTime = Date.now() - startTime
          console.log(`[Document Extraction] Total vision processing time: ${totalTime}ms`)
        }
      } else {
        // Handle text-based documents (DOCX, XLSX)
        const userPrompt = `Analyze this document (${extraction.filename}) and extract all relevant information. First identify the document type, then extract data using the appropriate schema. Extract only information that is clearly visible in the document.

=== Document Content ===
${extractedContent}`
        
        response = await generateText({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.1
        })
      }
    } catch (visionError: any) {
      // Log the full error for debugging
      console.error('[Document Extraction] Azure OpenAI API Error:', {
        error: visionError,
        message: visionError?.message,
        cause: visionError?.cause,
        deployment: visionDeploymentName,
        mimeType: mimeType,
        filename: extraction.filename,
        docType,
        needsVision
      })
      
      // Check if error is about unsupported file content types
      const errorMessage = visionError?.message || String(visionError)
      const errorString = JSON.stringify(visionError)
      
      if (errorMessage.includes('file content types') || 
          errorMessage.includes('does not support') ||
          errorString.includes('file content types')) {
        throw new Error(
          `The Azure OpenAI deployment "${visionDeploymentName}" (from AZURE_OPENAI_VISION_DEPLOYMENT) does not support vision/image inputs. ` +
          `Document extraction requires a vision-capable model. ` +
          `Please verify: ` +
          `1. The deployment "${visionDeploymentName}" is a vision-capable model (gpt-4o, gpt-4o-mini, gpt-4-turbo, or gpt-4-vision-preview) ` +
          `2. The deployment is properly configured in Azure Portal ` +
          `Original error: ${errorMessage}`
        )
      }
      throw visionError
    }

    // Ensure response was generated (TypeScript guard)
    if (!response) {
      throw new Error('Failed to generate AI response - this should never happen')
    }

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
    
    // Try to update status to failed (if we have fileId)
    if (fileId) {
      try {
        // Re-create supabase client in case it was lost
        if (!supabase) {
          supabase = await createClient()
        }
        
        await supabase
          .from('document_extractions')
          .update({ 
            analysis_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', fileId)
        
        console.log(`[Document Extraction] Updated status to 'failed' for fileId: ${fileId}`)
      } catch (updateError) {
        console.error('[Document Extraction] Failed to update status to failed:', updateError)
      }
    } else {
      console.warn('[Document Extraction] No fileId available to update status')
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

