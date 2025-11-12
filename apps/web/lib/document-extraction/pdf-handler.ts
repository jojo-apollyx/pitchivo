/**
 * PDF Document Handler
 * Simple handler that passes PDFs directly to Azure OpenAI Vision API
 */

import type { 
  ExtractionResult, 
  DocumentExtractionOptions 
} from './types'

/**
 * Extract content from PDF
 * PDFs are processed directly by Azure OpenAI Vision API - no local processing needed
 */
export async function extractPdfContent(
  pdfBuffer: Buffer,
  options: DocumentExtractionOptions = {}
): Promise<ExtractionResult> {
  // Simply return metadata indicating PDF should be processed with vision API
  // Azure OpenAI supports PDF files directly, so we don't need to convert them
  return {
    content: '', // No text extraction needed - Azure handles it
    metadata: {
      method: 'azure-vision-pdf'
      // Azure will handle page detection automatically
    }
  }
}
