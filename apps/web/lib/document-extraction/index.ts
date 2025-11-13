/**
 * Document Extraction Library
 * Reusable document extraction system for multiple industries
 * 
 * Main exports for easy importing
 */

export * from './types'
export * from './config'
export * from './extractor'
export * from './pdf-handler'
export * from './docx-handler'
export * from './excel-handler'
export * from './ai-processor'

// Re-export commonly used functions
export {
  extractDocumentContent,
  detectDocumentType,
  processDocumentWithAI,
  requiresVisionProcessing
} from './extractor'

export {
  extractPdfContent
} from './pdf-handler'

export {
  extractDocxContent
} from './docx-handler'

export {
  extractExcelContent
} from './excel-handler'

export {
  processWithAI,
  processPdfWithVision,
  extractStructuredData
} from './ai-processor'

