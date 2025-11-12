/**
 * Hardcoded industry options for Pitchivo
 * These replace the database-driven industries table
 */

export interface Industry {
  code: string
  name: string
  description: string
  enabled: boolean
  comingSoon?: boolean
}

export const INDUSTRIES: Industry[] = [
  {
    code: 'food_supplement',
    name: 'Food Supplements & Ingredients',
    description: 'Companies producing nutritional supplements, food ingredients, and related products',
    enabled: true,
    comingSoon: false,
  },
  {
    code: 'chemicals_raw_materials',
    name: 'Chemicals & Raw Materials',
    description: 'Companies producing chemicals, raw materials, and industrial compounds',
    enabled: false,
    comingSoon: true,
  },
  {
    code: 'pharmaceuticals',
    name: 'Pharmaceuticals',
    description: 'Companies in the pharmaceutical industry producing medicines and healthcare products',
    enabled: false,
    comingSoon: true,
  },
  {
    code: 'cosmetics_personal_care',
    name: 'Cosmetics & Personal Care',
    description: 'Companies producing cosmetics, personal care products, and beauty items',
    enabled: false,
    comingSoon: true,
  },
  {
    code: 'other',
    name: 'Other',
    description: 'Other industries not specifically categorized',
    enabled: false,
    comingSoon: true,
  },
]

/**
 * Get all industries
 */
export function getAllIndustries(): Industry[] {
  return INDUSTRIES
}

/**
 * Get only enabled industries
 */
export function getEnabledIndustries(): Industry[] {
  return INDUSTRIES.filter((ind) => ind.enabled)
}

/**
 * Get industry by code
 */
export function getIndustryByCode(code: string): Industry | undefined {
  return INDUSTRIES.find((ind) => ind.code === code)
}

/**
 * Get industry name by code
 */
export function getIndustryName(code: string): string {
  const industry = getIndustryByCode(code)
  return industry?.name || code
}

/**
 * Check if industry is enabled
 */
export function isIndustryEnabled(code: string): boolean {
  const industry = getIndustryByCode(code)
  return industry?.enabled || false
}

/**
 * Get available industry codes for AI detection
 */
export function getAvailableIndustryCodes(): string[] {
  return getEnabledIndustries().map((ind) => ind.code)
}

/**
 * Get industries formatted for AI detection
 */
export function getIndustriesForAI(): Array<{ industry_code: string; industry_name: string }> {
  return getEnabledIndustries().map((ind) => ({
    industry_code: ind.code,
    industry_name: ind.name,
  }))
}

