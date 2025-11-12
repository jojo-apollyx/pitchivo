/**
 * Document Extraction Types
 * Type definitions for the reusable document extraction system
 */

export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'xls' | 'image'

export type PdfDetectionType = 'text-based' | 'scanned' | 'mixed'

export type ExtractionMethod = 
  | 'text-extraction' 
  | 'vision-ocr' 
  | 'mammoth' 
  | 'xlsx'
  | 'direct-image'
  | 'azure-vision-pdf'

export interface ExtractionMetadata {
  method: ExtractionMethod
  pageCount?: number
  processedPages?: number
  wordCount?: number
  totalSheets?: number
  sheetNames?: string[]
  confidence?: 'high' | 'medium' | 'low'
  pdfType?: PdfDetectionType
}

export interface ExtractionResult {
  content: string
  metadata: ExtractionMetadata
  structuredData?: Record<string, any> // For Excel files
}

export interface PdfDetectionResult {
  type: PdfDetectionType
  text: string
  confidence: 'high' | 'medium' | 'low'
  totalPages: number
  avgCharsPerPage: number
  textDensity: number
}

export interface DocumentExtractionOptions {
  /**
   * Maximum number of PDF pages to process (default: 20)
   * Set to null for unlimited
   */
  maxPages?: number | null
  
  /**
   * Image quality/scale for PDF to image conversion (default: 2.5)
   */
  imageScale?: number
  
  /**
   * Maximum image height for PDF rendering (default: 1998)
   */
  maxImageHeight?: number
  
  /**
   * Whether to extract structured data from Excel files
   */
  extractExcelStructured?: boolean
}

export interface AiProcessingOptions {
  /**
   * Custom prompt for AI processing
   */
  prompt?: string
  
  /**
   * Schema for structured data extraction
   */
  schema?: Record<string, any>
  
  /**
   * Temperature for AI generation (default: 0.3)
   */
  temperature?: number
  
  /**
   * Max tokens for AI response (default: 4000)
   */
  maxTokens?: number
}

export interface AiProcessingResult {
  response: string
  structuredData?: Record<string, any>
  processingTimeMs: number
}

