/**
 * PDF Document Handler
 * Optimized handler for Azure OpenAI Vision API
 * 
 * Best practices:
 * - PDFs are sent directly to Azure OpenAI without conversion
 * - Supports multi-page PDFs (Azure handles pagination)
 * - Works with both text-based and scanned PDFs
 * - Azure extracts text and images automatically
 * - No local OCR needed - reduces processing time
 * 
 * Limitations:
 * - Maximum file size: Check Azure limits (typically 20MB for vision API)
 * - Password-protected PDFs are not supported
 * - Maximum pages: Check Azure model limits
 */

import type { 
  ExtractionResult, 
  DocumentExtractionOptions 
} from './types'

/**
 * Validate PDF file format by checking magic numbers
 */
function isValidPdf(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  if (buffer.length < 5) return false
  return buffer[0] === 0x25 && // %
         buffer[1] === 0x50 && // P
         buffer[2] === 0x44 && // D
         buffer[3] === 0x46 && // F
         buffer[4] === 0x2D    // -
}

/**
 * Extract content from PDF
 * PDFs are processed directly by Azure OpenAI Vision API - no local processing needed
 * This approach is optimal for accuracy and handles both text and scanned PDFs
 */
export async function extractPdfContent(
  pdfBuffer: Buffer,
  options: DocumentExtractionOptions = {}
): Promise<ExtractionResult> {
  // Validate PDF format
  if (!isValidPdf(pdfBuffer)) {
    throw new Error(
      'Invalid PDF file format. The file may be corrupted or is not a valid PDF document.'
    )
  }
  
  // Validate file size (Azure typically has a 20MB limit for vision API)
  const maxSize = 20 * 1024 * 1024 // 20MB
  if (pdfBuffer.length > maxSize) {
    throw new Error(
      `PDF file is too large (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB). ` +
      `Maximum supported size is ${maxSize / 1024 / 1024}MB for Azure OpenAI Vision API.`
    )
  }
  
  // Check for password protection by looking for /Encrypt in PDF
  const pdfString = pdfBuffer.toString('latin1', 0, Math.min(1024, pdfBuffer.length))
  if (pdfString.includes('/Encrypt')) {
    throw new Error(
      'PDF file appears to be password-protected or encrypted. ' +
      'Please remove the password and try again.'
    )
  }
  
  // Return metadata indicating PDF should be processed with vision API
  // Azure OpenAI supports PDF files directly via Chat Completions API
  // The actual extraction happens in the route handler
  return {
    content: '', // No text extraction needed - Azure handles it
    metadata: {
      method: 'azure-vision-pdf',
      confidence: 'high'
      // Azure will handle page detection, OCR, and text extraction automatically
    }
  }
}

/**
 * Detect PDF type (not used currently but available for future optimization)
 */
export async function detectPdfType(
  pdfBuffer: Buffer
): Promise<'text-based' | 'scanned' | 'mixed'> {
  // This is a placeholder for future optimization
  // Currently, we send all PDFs to Azure Vision API which handles both types
  // In the future, we could detect text-based PDFs and use text extraction
  // to save vision API costs
  return 'mixed'
}

/**
 * Prepare PDF for vision processing (converts to base64 data URL)
 */
export function preparePdfForVision(pdfBuffer: Buffer): string {
  return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
}
