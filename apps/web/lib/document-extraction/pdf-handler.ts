/**
 * PDF Document Handler
 * High-resolution PDF to image conversion for Azure OpenAI Vision API
 * 
 * Uses unpdf and @napi-rs/canvas for high-quality rendering
 * Best practices:
 * - High DPI (300) for maximum quality
 * - Validates file format and size
 * - Handles multi-page PDFs
 * - Detects password protection
 */

import { getDocumentProxy } from 'unpdf'
import { createCanvas } from '@napi-rs/canvas'
import type { 
  ExtractionResult, 
  DocumentExtractionOptions 
} from './types'

const DEFAULT_OPTIONS = {
  maxPages: 20,
  scale: 3.0, // High resolution (300 DPI equivalent)
  maxImageWidth: 2048,
  maxImageHeight: 2048
}

/**
 * Validate PDF file format by checking magic numbers
 */
function isValidPdf(buffer: Buffer): boolean {
  if (buffer.length < 5) return false
  return buffer[0] === 0x25 && // %
         buffer[1] === 0x50 && // P
         buffer[2] === 0x44 && // D
         buffer[3] === 0x46 && // F
         buffer[4] === 0x2D    // -
}

/**
 * Extract content from PDF by converting to high-resolution images
 */
export async function extractPdfContent(
  pdfBuffer: Buffer,
  options: DocumentExtractionOptions = {}
): Promise<ExtractionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Validate PDF format
  if (!isValidPdf(pdfBuffer)) {
    throw new Error(
      'Invalid PDF file format. The file may be corrupted or is not a valid PDF document.'
    )
  }
  
  // Validate file size (reasonable limit for processing)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (pdfBuffer.length > maxSize) {
    throw new Error(
      `PDF file is too large (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB). ` +
      `Maximum supported size is ${maxSize / 1024 / 1024}MB.`
    )
  }
  
  // Check for password protection
  const pdfString = pdfBuffer.toString('latin1', 0, Math.min(2048, pdfBuffer.length))
  if (pdfString.includes('/Encrypt')) {
    throw new Error(
      'PDF file appears to be password-protected or encrypted. ' +
      'Please remove the password and try again.'
    )
  }
  
  try {
    // Load PDF with unpdf - convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(pdfBuffer)
    const pdf = await getDocumentProxy(uint8Array)
    const totalPages = pdf.numPages
    
    console.log(`[PDF Handler] Processing PDF with ${totalPages} pages`)
    
    // Limit pages if specified
    const pagesToProcess = opts.maxPages 
      ? Math.min(totalPages, opts.maxPages) 
      : totalPages
    
    if (pagesToProcess < totalPages) {
      console.warn(
        `[PDF Handler] Processing ${pagesToProcess} of ${totalPages} pages (limited by maxPages option)`
      )
    }
    
    // Return metadata indicating images need to be generated for vision API
    return {
      content: '', // No text - will be extracted by vision API from images
      metadata: {
        method: 'vision-ocr',
        pageCount: totalPages,
        processedPages: pagesToProcess,
        confidence: 'high',
        pdfType: 'mixed'
      }
    }
  } catch (error) {
    console.error('[PDF Handler] Extraction error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error(
          'PDF extraction failed: File is password-protected. ' +
          'Please remove the password and try again.'
        )
      }
      if (error.message.includes('Invalid PDF')) {
        throw new Error(
          'PDF extraction failed: File appears to be corrupted or is not a valid PDF. ' +
          'Please verify the file integrity.'
        )
      }
    }
    
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Please verify the file is not corrupted or password-protected.'
    )
  }
}

/**
 * Detect PDF type (not used currently but available for future optimization)
 */
export async function detectPdfType(
  pdfBuffer: Buffer
): Promise<'text-based' | 'scanned' | 'mixed'> {
  // Always return mixed since we convert all PDFs to images
  return 'mixed'
}

/**
 * Convert PDF pages to high-resolution images for vision API
 * Returns array of base64 encoded image data URLs
 */
export async function preparePdfForVision(
  pdfBuffer: Buffer,
  options: DocumentExtractionOptions = {}
): Promise<string[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    // Load PDF with unpdf - convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(pdfBuffer)
    const pdf = await getDocumentProxy(uint8Array)
    const totalPages = pdf.numPages
    const pagesToProcess = opts.maxPages 
      ? Math.min(totalPages, opts.maxPages) 
      : totalPages
    
    const images: string[] = []
    
    console.log(`[PDF Handler] Converting ${pagesToProcess} pages to images at scale ${opts.scale}`)
    
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: opts.scale })
        
        // Limit image dimensions to prevent memory issues
        let { width, height } = viewport
        if (width > opts.maxImageWidth || height > opts.maxImageHeight) {
          const scale = Math.min(
            opts.maxImageWidth / width,
            opts.maxImageHeight / height
          )
          width = Math.floor(width * scale)
          height = Math.floor(height * scale)
          console.warn(
            `[PDF Handler] Page ${pageNum} scaled down to ${width}x${height} to fit limits`
          )
        }
        
        // Create canvas
        const canvas = createCanvas(Math.floor(width), Math.floor(height))
        const context = canvas.getContext('2d')
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context as any,
          viewport: page.getViewport({ 
            scale: opts.scale * (width / viewport.width) 
          })
        }).promise
        
        // Convert to base64 data URL
        const dataUrl = canvas.toDataURL('image/png')
        images.push(dataUrl)
        
        console.log(`[PDF Handler] Page ${pageNum}/${pagesToProcess} converted (${width}x${height})`)
      } catch (pageError) {
        console.error(`[PDF Handler] Failed to render page ${pageNum}:`, pageError)
        throw new Error(`Failed to render page ${pageNum}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`)
      }
    }
    
    return images
  } catch (error) {
    console.error('[PDF Handler] Failed to convert PDF to images:', error)
    throw new Error(
      `Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
