/**
 * Industry Module Loader
 * 
 * Provides a generic interface to load industry-specific extraction schemas,
 * merge strategies, and document types dynamically.
 */

export interface IndustryExtractionSchema {
  INDUSTRY_CODE: string
  INDUSTRY_NAME: string
  getExtractionSystemPrompt: () => string
  getMergeSystemPrompt: () => string
  getProductDocumentTypes: () => string[]
}

/**
 * Load extraction schema for a specific industry
 */
export async function loadIndustrySchema(industryCode: string): Promise<IndustryExtractionSchema | null> {
  try {
    // Normalize industry code (convert to kebab-case for file paths)
    const normalizedCode = industryCode.replace(/_/g, '-')
    
    // Dynamically import the industry module
    const module = await import(`./${normalizedCode}/extraction-schema`)
    
    return {
      INDUSTRY_CODE: module.INDUSTRY_CODE,
      INDUSTRY_NAME: module.INDUSTRY_NAME,
      getExtractionSystemPrompt: module.getExtractionSystemPrompt,
      getMergeSystemPrompt: module.getMergeSystemPrompt,
      getProductDocumentTypes: module.getProductDocumentTypes,
    }
  } catch (error) {
    console.error(`[Industry Loader] Failed to load schema for industry: ${industryCode}`, error)
    return null
  }
}

/**
 * Get supported industries (currently enabled)
 */
export function getSupportedIndustries(): string[] {
  return [
    'food_supplement',
    // Future industries will be added here as they become available
    // 'chemicals_raw_materials',
    // 'pharmaceuticals',
    // 'cosmetics_personal_care',
  ]
}

/**
 * Check if an industry is supported
 */
export function isIndustrySupported(industryCode: string): boolean {
  return getSupportedIndustries().includes(industryCode)
}

/**
 * Get default industry code
 */
export function getDefaultIndustry(): string {
  return 'food_supplement'
}

