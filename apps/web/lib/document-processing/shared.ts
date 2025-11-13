/**
 * Shared Document Processing Utilities
 * 
 * Generic utilities used across all industries for document upload,
 * extraction, and processing. Industry-specific logic is handled separately.
 */

import { createClient } from '@/lib/supabase/server'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'
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

  const azure = createAzure({
    resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
  })
  
  const model = azure(visionDeploymentName)

  let userContent: any[] = []

  // Add text content if available
  if (context.extractedContent) {
    userContent.push({
      type: 'text' as const,
      text: `Document content (extracted text):\n\n${context.extractedContent}`
    })
  }

  // Add images for vision processing
  if (context.needsVision && options.includeImages !== false) {
    const base64Data = context.buffer.toString('base64')
    const dataUrl = `data:${context.mimeType};base64,${base64Data}`
    
    userContent.push({
      type: 'image' as const,
      image: dataUrl
    })
  }

  // If no content, just add a request for extraction
  if (userContent.length === 0) {
    userContent.push({
      type: 'text' as const,
      text: 'Please extract all relevant information from this document.'
    })
  }

  try {
    const { text: rawExtraction } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: options.systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      temperature: options.temperature ?? 0.1,
      maxTokens: options.maxTokens ?? 4000,
    })

    // Clean up response (remove markdown code blocks if present)
    let cleanedResponse = rawExtraction.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    // Parse JSON
    const extractedData = JSON.parse(cleanedResponse)

    return { extractedData, rawResponse: rawExtraction }
  } catch (error) {
    console.error('[AI Extraction] Error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to extract data'
    }
  }
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

  // Flatten grouped data for easier access
  const flattenedData: Record<string, any> = {}
  
  if (extractedData._grouped) {
    // Flatten grouped data
    Object.entries(extractedData._grouped as Record<string, any>).forEach(([groupKey, groupData]) => {
      if (groupData && typeof groupData === 'object') {
        Object.entries(groupData).forEach(([fieldKey, fieldValue]) => {
          if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
            flattenedData[`${groupKey}.${fieldKey}`] = fieldValue
          }
        })
      }
    })
  }

  // Also include top-level fields
  Object.entries(extractedData).forEach(([key, value]) => {
    if (key !== '_grouped' && value !== null && value !== undefined && value !== '') {
      flattenedData[key] = value
    }
  })

  // Store both grouped and flat data
  const extractedValues = {
    ...flattenedData,
    _grouped: extractedData._grouped || {}
  }

  // Update database with results
  const { data: updatedExtraction, error: updateError } = await supabase
    .from('document_extractions')
    .update({
      analysis_status: 'completed',
      extracted_values: extractedValues,
      file_summary: {
        document_type: extractedData.document_type,
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

