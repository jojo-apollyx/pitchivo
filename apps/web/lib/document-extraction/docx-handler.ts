/**
 * DOCX Document Handler
 * Handles DOCX file extraction using Mammoth
 * Best practices:
 * - Validates file format before processing
 * - Handles corrupted files gracefully
 * - Preserves text structure
 * - Extracts embedded content warnings
 */

import mammoth from 'mammoth'
import type { ExtractionResult } from './types'

/**
 * Validate DOCX file format by checking magic numbers
 */
function isValidDocx(buffer: Buffer): boolean {
  // DOCX files are ZIP archives starting with PK\x03\x04
  if (buffer.length < 4) return false
  return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04
}

/**
 * Extract content from DOCX file with robust error handling
 */
export async function extractDocxContent(
  docxBuffer: Buffer
): Promise<ExtractionResult> {
  // Validate file format
  if (!isValidDocx(docxBuffer)) {
    throw new Error(
      'Invalid DOCX file format. The file may be corrupted or is not a valid DOCX document.'
    )
  }
  
  // Validate file size (prevent memory issues with extremely large files)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (docxBuffer.length > maxSize) {
    throw new Error(
      `DOCX file is too large (${(docxBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum supported size is ${maxSize / 1024 / 1024}MB.`
    )
  }
  
  try {
    // Extract text with options to preserve structure
    const result = await mammoth.extractRawText({ 
      buffer: docxBuffer 
    })
    
    // Log any extraction warnings (e.g., unsupported formatting)
    if (result.messages && result.messages.length > 0) {
      const warnings = result.messages.filter(msg => msg.type === 'warning')
      const errors = result.messages.filter(msg => msg.type === 'error')
      
      if (warnings.length > 0) {
        console.warn('[DOCX Handler] Extraction warnings:', warnings)
      }
      if (errors.length > 0) {
        console.error('[DOCX Handler] Extraction errors:', errors)
      }
    }
    
    // Validate extracted content
    if (!result.value || result.value.trim().length === 0) {
      console.warn('[DOCX Handler] Document appears to be empty or contains no extractable text')
      return {
        content: '',
        metadata: {
          method: 'mammoth',
          wordCount: 0,
          confidence: 'low'
        }
      }
    }
    
    const wordCount = result.value.split(/\s+/).filter(word => word.length > 0).length
    
    return {
      content: result.value,
      metadata: {
        method: 'mammoth',
        wordCount,
        confidence: 'high'
      }
    }
  } catch (error) {
    console.error('[DOCX Handler] Extraction error:', error)
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('zip')) {
        throw new Error(
          'DOCX extraction failed: File appears to be corrupted or is not a valid DOCX format. ' +
          'Please ensure the file is a valid Microsoft Word document (.docx).'
        )
      }
      if (error.message.includes('memory')) {
        throw new Error(
          'DOCX extraction failed: Insufficient memory to process this document. ' +
          'The file may be too large or contain too many embedded objects.'
        )
      }
    }
    
    throw new Error(
      `DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Please verify the file is not password-protected or corrupted.'
    )
  }
}

