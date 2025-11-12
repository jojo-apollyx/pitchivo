/**
 * Document Extractor
 * Main unified interface for document extraction across all file types
 * Designed to be reusable across multiple industries
 */

import type { 
  DocumentType, 
  ExtractionResult, 
  DocumentExtractionOptions,
  AiProcessingOptions 
} from './types'
import { extractPdfContent } from './pdf-handler'
import { extractDocxContent } from './docx-handler'
import { extractExcelContent } from './excel-handler'
import { processPdfWithVision } from './ai-processor'

/**
 * Detect document type from MIME type or file extension
 */
export function detectDocumentType(mimeType: string, filename?: string): DocumentType {
  const normalizedMime = mimeType.toLowerCase()
  
  if (normalizedMime === 'application/pdf') {
    return 'pdf'
  }
  
  if (
    normalizedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    normalizedMime === 'application/msword'
  ) {
    return 'docx'
  }
  
  if (
    normalizedMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    normalizedMime === 'application/vnd.ms-excel'
  ) {
    return 'xlsx'
  }
  
  if (normalizedMime.startsWith('image/')) {
    return 'image'
  }
  
  // Fallback to filename extension
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx' || ext === 'doc') return 'docx'
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`)
}

/**
 * Extract content from any supported document type
 * This is the main entry point for document extraction
 */
export async function extractDocumentContent(
  buffer: Buffer,
  mimeType: string,
  filename?: string,
  options: DocumentExtractionOptions = {}
): Promise<ExtractionResult> {
  const docType = detectDocumentType(mimeType, filename)
  
  console.log(`[Document Extractor] Extracting ${docType} document: ${filename || 'unnamed'}`)
  
  switch (docType) {
    case 'pdf':
      return await extractPdfContent(buffer, options)
      
    case 'docx':
      return await extractDocxContent(buffer)
      
    case 'xlsx':
    case 'xls':
      return extractExcelContent(buffer, options)
      
    case 'image':
      // Images are handled directly by vision API in the extract route
      // Return empty content - the actual processing happens in the route
      return {
        content: '',
        metadata: {
          method: 'direct-image'
        }
      }
      
    default:
      throw new Error(`Unsupported document type: ${docType}`)
  }
}

/**
 * Process document with AI (for scanned PDFs or when additional AI processing is needed)
 * This handles the vision API integration for PDFs that need OCR
 */
export async function processDocumentWithAI(
  buffer: Buffer,
  mimeType: string,
  systemPrompt: string,
  options: DocumentExtractionOptions & AiProcessingOptions = {}
): Promise<{ content: string; processingTimeMs: number }> {
  const docType = detectDocumentType(mimeType)
  
  if (docType === 'pdf') {
    // Check if PDF needs vision processing
    const extraction = await extractPdfContent(buffer, options)
    
    if (extraction.metadata.method === 'vision-ocr') {
      // Use vision API for scanned/mixed PDFs
      const result = await processPdfWithVision(buffer, systemPrompt, options)
      return {
        content: result.response,
        processingTimeMs: result.processingTimeMs
      }
    } else {
      // Text-based PDF - return extracted text
      return {
        content: extraction.content,
        processingTimeMs: 0
      }
    }
  }
  
  // For other types, extract first then process if needed
  const extraction = await extractDocumentContent(buffer, mimeType, undefined, options)
  
  return {
    content: extraction.content,
    processingTimeMs: 0
  }
}

/**
 * Check if document requires vision API processing
 */
export async function requiresVisionProcessing(
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  const docType = detectDocumentType(mimeType)
  
  if (docType === 'image') {
    return true
  }
  
  if (docType === 'pdf') {
    const extraction = await extractPdfContent(buffer)
    return extraction.metadata.method === 'vision-ocr'
  }
  
  return false
}

