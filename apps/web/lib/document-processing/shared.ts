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

  // Flatten grouped data
  const flattenedData: Record<string, any> = {}
  
  if (extractedData._grouped) {
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

  Object.entries(extractedData).forEach(([key, value]) => {
    if (key !== '_grouped' && value !== null && value !== undefined && value !== '') {
      flattenedData[key] = value
    }
  })

  const extractedValues = {
    ...flattenedData,
    _grouped: extractedData._grouped || {}
  }

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
