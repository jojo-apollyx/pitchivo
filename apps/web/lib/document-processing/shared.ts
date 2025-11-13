/**
 * Shared Document Processing Utilities
 * 
 * Generic utilities used across all industries for document upload,
 * extraction, and processing. Industry-specific logic is handled separately.
 */

import { createClient } from '@/lib/supabase/server'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'
import { AzureOpenAI } from 'openai'
import { jsonrepair } from 'jsonrepair'
import {
  extractDocumentContent,
  detectDocumentType
} from '@/lib/document-extraction'

export interface DocumentExtractionContext {
  fileId: string
  buffer: Buffer
  mimeType: string
  filename: string
  extractedContent?: string
  extractionMetadata?: any
  needsVision: boolean
}

export interface AIExtractionOptions {
  systemPrompt: string
  includeImages?: boolean
  temperature?: number
  maxTokens?: number
}

/**
 * Prepare document for extraction - download and extract basic content
 */
export async function prepareDocumentForExtraction(
  fileId: string
): Promise<DocumentExtractionContext | { error: string; status: number }> {
  const supabase = await createClient()

  // Get document extraction record
  const { data: extraction, error: fetchError } = await supabase
    .from('document_extractions')
    .select('*')
    .eq('id', fileId)
    .single()

  if (fetchError || !extraction) {
    return { error: 'Document not found', status: 404 }
  }

  // Update status to analyzing
  await supabase
    .from('document_extractions')
    .update({ 
      analysis_status: 'analyzing',
      error_message: null
    })
    .eq('id', fileId)

  // Get signed URL for file access
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(extraction.storage_path, 3600)

  if (urlError || !signedUrlData?.signedUrl) {
    await supabase
      .from('document_extractions')
      .update({ 
        analysis_status: 'failed',
        error_message: 'Failed to create file access URL'
      })
      .eq('id', fileId)
    return { error: 'Failed to access file', status: 500 }
  }

  // Download file
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
    return { error: 'Failed to download file', status: 500 }
  }

  // Convert file to buffer
  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = extraction.mime_type
  
  // Detect document type and extract content
  const docType = detectDocumentType(mimeType, extraction.filename)
  console.log(`[Document Processing] Processing ${docType} file: ${extraction.filename}`)
  
  let extractedContent: string = ''
  let extractionMetadata: any = {}
  let needsVision = false
  
  if (docType === 'image' || docType === 'pdf') {
    // Images and PDFs are handled with vision API
    needsVision = true
  } else {
    // DOCX, XLSX - extract text content
    const docExtraction = await extractDocumentContent(buffer, mimeType, extraction.filename)
    extractedContent = docExtraction.content
    extractionMetadata = docExtraction.metadata
    needsVision = false
  }

  return {
    fileId,
    buffer,
    mimeType,
    filename: extraction.filename,
    extractedContent,
    extractionMetadata,
    needsVision
  }
}

/**
 * Run AI extraction with given system prompt
 * EXACT copy from working implementation (commit c4febae)
 */
export async function runAIExtraction(
  context: DocumentExtractionContext,
  options: AIExtractionOptions
): Promise<{ extractedData: any; rawResponse: string } | { error: string }> {
  const visionDeploymentName = process.env.AZURE_OPENAI_VISION_DEPLOYMENT
  
  if (!visionDeploymentName) {
    return {
      error: 'AZURE_OPENAI_VISION_DEPLOYMENT is required for document extraction'
    }
  }

  const azureEndpoint = `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com`
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY!
  
  const azure = createAzure({
    resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
    apiKey: azureApiKey,
  })
  
  const model = azure(visionDeploymentName)

  try {
    let rawExtraction: string

    // Handle PDFs with Azure OpenAI Responses API
    if (context.mimeType === 'application/pdf') {
      console.log(`[AI Extraction] Using Azure Responses API for PDF...`)
      
      // Initialize Azure OpenAI client - EXACT from working version
      const openaiClient = new AzureOpenAI({
        apiKey: azureApiKey,
        endpoint: azureEndpoint,
        apiVersion: '2025-03-01-preview'
      })
      
      // Combine system and user prompts
      const fullPrompt = `${options.systemPrompt}

User Request: Analyze this document (${context.filename}) and extract all relevant information. First identify the document type, then extract data using the appropriate schema. Extract only information that is clearly visible in the document.`
      
      // Upload PDF file - EXACT from working version
      console.log(`[AI Extraction] Uploading PDF file...`)
      // Convert Buffer to File object with proper filename for the SDK
      // Azure OpenAI needs the filename with extension to detect file type
      const uint8Array = new Uint8Array(context.buffer)
      const fileBlob = new Blob([uint8Array], { type: context.mimeType })
      const fileObject = new File([fileBlob], context.filename, { type: context.mimeType })
      const file = await openaiClient.files.create({
        file: fileObject,
        purpose: 'assistants'
      })
      
      const fileId = file.id
      console.log(`[AI Extraction] File uploaded with ID: ${fileId}`)
      
      // Call Responses API - EXACT from working version
      console.log(`[AI Extraction] Calling Responses API...`)
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
      
      // Extract text from response
      rawExtraction = (responsesResult as any).output?.[0]?.content?.[0]?.text 
        || (responsesResult as any).output_text 
        || ''
      
      console.log(`[AI Extraction] Responses API completed`)
    } 
    // Handle images
    else if (context.mimeType.startsWith('image/')) {
      console.log(`[AI Extraction] Using Chat Completions API for image...`)
      
      const base64Data = context.buffer.toString('base64')
      const dataUrl = `data:${context.mimeType};base64,${base64Data}`
      
      const response = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this document (${context.filename}) and extract all relevant information. First identify the document type, then extract data using the appropriate schema.`
              },
              {
                type: 'image' as const,
                image: dataUrl
              }
            ]
          }
        ],
        temperature: options.temperature ?? 0.1
      })
      
      rawExtraction = response.text
    }
    // Handle text documents
    else if (context.extractedContent) {
      console.log(`[AI Extraction] Using text extraction...`)
      
      const userPrompt = `Analyze this document (${context.filename}) and extract all relevant information. First identify the document type, then extract data using the appropriate schema.

=== Document Content ===
${context.extractedContent}`
      
      const response = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: options.temperature ?? 0.1
      })
      
      rawExtraction = response.text
    } else {
      return { error: 'No content available for extraction' }
    }

    // Clean up response
    let cleanedResponse = rawExtraction.trim()
    
    // Remove markdown code blocks
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/i, '').replace(/\n?```$/i, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/i, '')
    }
    
    // Try to extract JSON object if there's extra text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }
    
    // Parse JSON with better error handling using jsonrepair library
    let extractedData
    try {
      // First try standard JSON.parse
      extractedData = JSON.parse(cleanedResponse)
      
      // Handle double-encoded JSON (AI returning "{ ... }" instead of { ... })
      // If the result is a string, try parsing it again
      if (typeof extractedData === 'string') {
        console.log('[AI Extraction] Detected double-encoded JSON, parsing again...')
        extractedData = JSON.parse(extractedData)
      }
    } catch (parseError) {
      console.error('[AI Extraction] JSON Parse Error:', parseError)
      console.error('[AI Extraction] Response length:', cleanedResponse.length)
      console.error('[AI Extraction] Response preview:', cleanedResponse.substring(0, 500))
      
      // Extract error position if available
      const errorMatch = parseError instanceof Error ? parseError.message.match(/position (\d+)/) : null
      const errorPos = errorMatch ? parseInt(errorMatch[1], 10) : -1
      
      if (errorPos > 0) {
        console.error('[AI Extraction] Response around error position:', cleanedResponse.substring(Math.max(0, errorPos - 50), Math.min(cleanedResponse.length, errorPos + 50)))
      }
      
      // Try to fix JSON using jsonrepair library
      try {
        console.log('[AI Extraction] Attempting to repair JSON using jsonrepair...')
        const repairedJson = jsonrepair(cleanedResponse)
        extractedData = JSON.parse(repairedJson)
        
        // Check again for double-encoding after repair
        if (typeof extractedData === 'string') {
          console.log('[AI Extraction] Detected double-encoded JSON after repair, parsing again...')
          extractedData = JSON.parse(extractedData)
        }
        
        console.log('[AI Extraction] Successfully repaired and parsed JSON')
      } catch (repairError) {
        // If jsonrepair also fails, try extracting just the JSON object portion
        try {
          const firstBrace = cleanedResponse.indexOf('{')
          const lastBrace = cleanedResponse.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonOnly = cleanedResponse.substring(firstBrace, lastBrace + 1)
            const repairedJson = jsonrepair(jsonOnly)
            extractedData = JSON.parse(repairedJson)
            
            // Check again for double-encoding
            if (typeof extractedData === 'string') {
              console.log('[AI Extraction] Detected double-encoded JSON after extraction, parsing again...')
              extractedData = JSON.parse(extractedData)
            }
            
            console.log('[AI Extraction] Successfully repaired JSON after extracting object portion')
          } else {
            throw repairError
          }
        } catch (finalError) {
          console.error('[AI Extraction] All JSON repair attempts failed:', finalError)
          throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response may contain invalid JSON syntax that could not be repaired.`)
        }
      }
    }
    
    // Ensure we have an object, not a string
    if (typeof extractedData !== 'object' || extractedData === null) {
      console.error('[AI Extraction] Extracted data is not an object:', typeof extractedData)
      throw new Error('AI response did not produce a valid JSON object')
    }

    // Normalize extracted data to convert any complex objects to plain text
    extractedData = normalizeExtractedData(extractedData)

    // Final validation: ensure we're returning an object, not a string
    if (typeof extractedData !== 'object' || extractedData === null || Array.isArray(extractedData)) {
      console.error('[AI Extraction] Post-normalization data is not a valid object:', typeof extractedData)
      console.error('[AI Extraction] Post-normalization value:', extractedData)
      throw new Error(`Normalized data is not a valid object: got ${typeof extractedData}`)
    }

    return { extractedData, rawResponse: rawExtraction }
  } catch (error) {
    console.error('[AI Extraction] Error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to extract data'
    }
  }
}

/**
 * Convert complex objects to plain text strings
 * Recursively processes nested objects and converts them to readable plain text
 */
function convertObjectToPlainText(obj: any, depth: number = 0): string {
  if (depth > 3) {
    // Prevent infinite recursion, return a summary
    return '[Complex data structure]'
  }
  
  if (obj === null || obj === undefined) {
    return ''
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj
      .map(item => convertObjectToPlainText(item, depth + 1))
      .filter(item => item !== '')
      .join(', ')
  }
  
  if (typeof obj === 'object') {
    const parts: string[] = []
    Object.entries(obj).forEach(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const formattedValue = convertObjectToPlainText(value, depth + 1)
      if (formattedValue !== '') {
        parts.push(`${formattedKey}: ${formattedValue}`)
      }
    })
    return parts.join('. ')
  }
  
  return String(obj)
}

/**
 * Recursively transform extracted data to ensure all values are simple types
 * Converts any complex objects to plain text strings
 */
function normalizeExtractedData(data: any, path: string = '', isGrouped: boolean = false): any {
  if (data === null || data === undefined) {
    return data
  }
  
  // If it's already a simple type, return as is
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      // Arrays should only contain simple types
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Convert complex object in array to plain text
        return convertObjectToPlainText(item)
      }
      return normalizeExtractedData(item, `${path}[${index}]`, isGrouped)
    })
  }
  
  // Handle objects
  if (typeof data === 'object') {
    // Special handling for _grouped structure - we want to preserve the group structure
    // but normalize all values within each group
    if (path === '' && data._grouped) {
      const normalized: any = { ...data }
      // Normalize the _grouped structure
      normalized._grouped = normalizeExtractedData(data._grouped, '_grouped', true)
      // Normalize other top-level fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== '_grouped') {
          normalized[key] = normalizeExtractedData(value, key, false)
        }
      })
      return normalized
    }
    
    // For grouped data (like basic, physical, chemical, etc.), preserve the structure
    // but ensure all values are simple types
    if (isGrouped || path.startsWith('_grouped.')) {
      const normalized: any = {}
      Object.entries(data).forEach(([key, value]) => {
        // If value is an object, check if it's a complex nested structure
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Check if it has nested objects (complex nesting)
          const hasNestedObjects = Object.values(value).some(
            v => typeof v === 'object' && v !== null && !Array.isArray(v)
          )
          if (hasNestedObjects) {
            // Convert complex nested object to plain text
            normalized[key] = convertObjectToPlainText(value)
          } else {
            // It's a simple flat object - this shouldn't happen in grouped data,
            // but if it does, convert to plain text to be safe
            normalized[key] = convertObjectToPlainText(value)
          }
        } else {
          // Recursively normalize simple values
          normalized[key] = normalizeExtractedData(value, path ? `${path}.${key}` : key, isGrouped)
        }
      })
      return normalized
    }
    
    // For other objects, check if they have complex nesting
    const hasComplexNesting = Object.values(data).some(
      value => typeof value === 'object' && value !== null && !Array.isArray(value)
    )
    
    if (hasComplexNesting) {
      // If this is the top-level object (path === ''), we must preserve it as an object
      // Convert complex nested values to plain text, but keep the structure
      if (path === '') {
        const normalized: any = {}
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Check if it has nested objects (complex nesting)
            const hasNestedObjects = Object.values(value).some(
              v => typeof v === 'object' && v !== null && !Array.isArray(v)
            )
            if (hasNestedObjects) {
              // Convert complex nested object to plain text
              normalized[key] = convertObjectToPlainText(value)
            } else {
              // It's a simple flat object, preserve it
              normalized[key] = normalizeExtractedData(value, key, false)
            }
          } else {
            // Recursively normalize simple values
            normalized[key] = normalizeExtractedData(value, key, false)
          }
        })
        return normalized
      } else {
        // For nested objects, convert to plain text
        return convertObjectToPlainText(data)
      }
    }
    
    // Otherwise, recursively normalize each property
    const normalized: any = {}
    Object.entries(data).forEach(([key, value]) => {
      normalized[key] = normalizeExtractedData(value, path ? `${path}.${key}` : key, isGrouped)
    })
    return normalized
  }
  
  return data
}

/**
 * Check if a value is a placeholder indicating unavailable/unknown data
 */
function isPlaceholderValue(value: any): boolean {
  if (typeof value !== 'string') return false
  
  const normalized = value.trim().toLowerCase()
  const placeholders = [
    'none known',
    'not available',
    'n/a',
    'unknown',
    'not specified',
    'not applicable',
    'none',
    'na',
    'unavailable',
    'n.d.',
    'n.d',
    'nd'
  ]
  
  return placeholders.includes(normalized)
}

/**
 * Clean grouped data structure by removing placeholder values
 */
function cleanGroupedData(groupedData: any): any {
  if (!groupedData || typeof groupedData !== 'object') return groupedData
  
  const cleaned: any = {}
  
  Object.entries(groupedData).forEach(([groupKey, groupValue]) => {
    if (groupValue && typeof groupValue === 'object' && !Array.isArray(groupValue)) {
      const cleanedGroup: any = {}
      Object.entries(groupValue).forEach(([fieldKey, fieldValue]) => {
        // Skip objects (they can't be displayed properly and cause "[object Object]" issues)
        if (typeof fieldValue === 'object' && !Array.isArray(fieldValue) && fieldValue !== null) {
          return
        }
        // Only include fields with meaningful values (not null, undefined, empty, or placeholders)
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '' && !isPlaceholderValue(fieldValue)) {
          cleanedGroup[fieldKey] = fieldValue
        }
      })
      // Only include groups that have at least one field
      if (Object.keys(cleanedGroup).length > 0) {
        cleaned[groupKey] = cleanedGroup
      }
    } else if (Array.isArray(groupValue)) {
      // For arrays, filter out placeholder values
      const cleanedArray = groupValue.filter(item => 
        item !== null && item !== undefined && item !== '' && !isPlaceholderValue(item)
      )
      if (cleanedArray.length > 0) {
        cleaned[groupKey] = cleanedArray
      }
    } else if (groupValue !== null && groupValue !== undefined && groupValue !== '' && !isPlaceholderValue(groupValue)) {
      cleaned[groupKey] = groupValue
    }
  })
  
  return cleaned
}

/**
 * Save extraction results to database
 */
export async function saveExtractionResults(
  fileId: string,
  extractedData: any,
  rawResponse: string
): Promise<{ success: boolean; extraction?: any; error?: string }> {
  const supabase = await createClient()

  // Validate that extractedData is an object (not a string or other type)
  if (typeof extractedData !== 'object' || extractedData === null || Array.isArray(extractedData)) {
    console.error('[Save Results] extractedData is not a valid object:', typeof extractedData)
    console.error('[Save Results] extractedData value:', extractedData)
    return { 
      success: false, 
      error: `Invalid extracted data type: expected object, got ${typeof extractedData}` 
    }
  }

  // Additional check: if it's a string that was accidentally passed as object
  if (typeof extractedData === 'string') {
    console.error('[Save Results] extractedData is a string, attempting to parse...')
    try {
      extractedData = JSON.parse(extractedData)
    } catch (e) {
      console.error('[Save Results] Failed to parse extractedData string:', e)
      return { 
        success: false, 
        error: 'Extracted data is a string and could not be parsed as JSON' 
      }
    }
  }

  // Process extracted data - keep only valid fields (flat snake_case structure)
  const cleanedData: Record<string, any> = {}
  
  Object.entries(extractedData).forEach(([key, value]) => {
    // Skip objects (except arrays which are valid for fields like applications, certificates, etc.)
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return
    }
    // Filter out null, undefined, empty strings, and placeholder values
    if (value !== null && value !== undefined && value !== '' && !isPlaceholderValue(value)) {
      cleanedData[key] = value
    }
  })
  
  const extractedValues = cleanedData

  const { data: updatedExtraction, error: updateError } = await supabase
    .from('document_extractions')
    .update({
      analysis_status: 'completed',
      extracted_values: extractedValues,
      file_summary: {
        document_type: extractedData.document_type,
        summary: extractedData.summary,
        confidence_score: extractedData.confidence_score,
      },
      raw_extracted_data: rawResponse,
      error_message: null
    })
    .eq('id', fileId)
    .select()
    .single()

  if (updateError) {
    console.error('[Save Results] Database update error:', updateError)
    return { success: false, error: 'Failed to save extraction results' }
  }

  return { success: true, extraction: updatedExtraction }
}

/**
 * Handle extraction error
 */
export async function handleExtractionError(
  fileId: string,
  error: Error | string
): Promise<void> {
  const supabase = await createClient()
  const errorMessage = error instanceof Error ? error.message : error

  await supabase
    .from('document_extractions')
    .update({
      analysis_status: 'failed',
      error_message: errorMessage
    })
    .eq('id', fileId)

  console.error('[Document Extraction] Error:', errorMessage)
}

/**
 * Validate request authentication
 */
export async function validateAuthentication(): Promise<
  { user: any } | { error: string; status: number }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  return { user }
}
