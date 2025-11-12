/**
 * AI Processor
 * Handles Azure OpenAI integration for document processing
 */

import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'
import type { 
  ExtractionResult, 
  AiProcessingOptions, 
  AiProcessingResult,
  DocumentExtractionOptions 
} from './types'
import { getAzureOpenAIConfig } from './config'

const DEFAULT_AI_OPTIONS: Required<Pick<AiProcessingOptions, 'temperature' | 'maxTokens'>> = {
  temperature: 0.3,
  maxTokens: 4000
}

/**
 * Process extracted content with Azure OpenAI
 */
export async function processWithAI(
  extractedContent: ExtractionResult,
  options: AiProcessingOptions = {}
): Promise<AiProcessingResult> {
  const startTime = Date.now()
  const opts = { ...DEFAULT_AI_OPTIONS, ...options }
  
  try {
    const config = getAzureOpenAIConfig()
    const azure = createAzure({
      resourceName: config.resourceName,
      apiKey: config.apiKey
    })
    
    const model = azure(config.visionDeployment)
    
    const systemPrompt = options.prompt 
      ? `You are a document analysis assistant. ${options.prompt}`
      : `You are a document analysis assistant. Analyze the provided document content and respond to the user's request accurately and concisely.`
    
    const userMessage = extractedContent.content || 'Please analyze this document.'
    
    const response = await generateText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: opts.temperature
    })
    
    return {
      response: response.text,
      processingTimeMs: Date.now() - startTime
    }
  } catch (error) {
    console.error('[AI Processor] Processing error:', error)
    throw new Error(
      `AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Process PDF with vision API - passes PDF directly to Azure OpenAI
 */
export async function processPdfWithVision(
  pdfBuffer: Buffer,
  systemPrompt: string,
  options: DocumentExtractionOptions & AiProcessingOptions = {}
): Promise<AiProcessingResult> {
  const startTime = Date.now()
  const aiOpts = { ...DEFAULT_AI_OPTIONS, ...options }
  
  try {
    const config = getAzureOpenAIConfig()
    const azure = createAzure({
      resourceName: config.resourceName,
      apiKey: config.apiKey
    })
    
    const model = azure(config.visionDeployment)
    
    // Convert PDF buffer to base64 for Azure OpenAI
    const base64 = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`
    
    // Call Azure OpenAI Vision API with PDF directly
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
              text: 'Extract all text content from this PDF document. Maintain the structure, formatting, and order. If there are tables, preserve them in a readable format.'
            },
            {
              type: 'image' as const,
              image: dataUrl
            }
          ]
        }
      ],
      temperature: aiOpts.temperature
    })
    
    return {
      response: response.text,
      processingTimeMs: Date.now() - startTime
    }
  } catch (error) {
    console.error('[AI Processor] Vision processing error:', error)
    throw new Error(
      `PDF Vision extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract structured JSON data from document
 */
export async function extractStructuredData(
  extractedContent: ExtractionResult,
  schema: Record<string, any>,
  options: AiProcessingOptions = {}
): Promise<Record<string, any>> {
  const opts = { ...DEFAULT_AI_OPTIONS, ...options }
  
  try {
    const config = getAzureOpenAIConfig()
    const azure = createAzure({
      resourceName: config.resourceName,
      apiKey: config.apiKey
    })
    
    const model = azure(config.visionDeployment)
    
    const prompt = `Extract the following information from the document and return ONLY a valid JSON object with this structure:

${JSON.stringify(schema, null, 2)}

Document content:
${extractedContent.content}

Return ONLY the JSON object, no additional text.`
    
    const response = await generateText({
      model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0 // Lower temperature for structured extraction
      // Note: response_format may not be available in all SDK versions
      // The model should still return JSON if prompted correctly
    })
    
    // Parse JSON from response (handle potential markdown wrapping)
    const textContent = response.text.trim()
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : textContent
    
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('[AI Processor] Structured extraction error:', error)
    throw new Error(
      `Structured extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

