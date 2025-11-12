/**
 * Industry-specific product creation forms
 * Each industry has its own form component with custom fields
 */

export { FoodSupplementForm, type FoodSupplementFormData } from './FoodSupplementForm'

// Export a mapping of industry codes to form components
export const INDUSTRY_FORMS = {
  food_supplement: 'FoodSupplementForm',
  // Future industries will be added here
  // chemicals_raw_materials: 'ChemicalsForm',
  // pharmaceuticals: 'PharmaceuticalsForm',
  // cosmetics_personal_care: 'CosmeticsForm',
  // other: 'OtherForm',
} as const

export type IndustryCode = keyof typeof INDUSTRY_FORMS

