/**
 * DOCX Document Handler
 * Handles DOCX file extraction using Mammoth
 */

import mammoth from 'mammoth'
import type { ExtractionResult } from './types'

/**
 * Extract content from DOCX file
 */
export async function extractDocxContent(
  docxBuffer: Buffer
): Promise<ExtractionResult> {
  try {
    const result = await mammoth.extractRawText({ 
      buffer: docxBuffer 
    })
    
    if (result.messages && result.messages.length > 0) {
      console.warn('[DOCX Handler] Extraction warnings:', result.messages)
    }
    
    const wordCount = result.value.split(/\s+/).filter(word => word.length > 0).length
    
    return {
      content: result.value,
      metadata: {
        method: 'mammoth',
        wordCount
      }
    }
  } catch (error) {
    console.error('[DOCX Handler] Extraction error:', error)
    throw new Error(
      `DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

