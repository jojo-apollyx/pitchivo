/**
 * Template schema validation utilities
 */

export interface TemplateSchema {
  [key: string]: any
}

export function validateGeneratedTemplate(schema: TemplateSchema): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Basic validation
  if (!schema || typeof schema !== 'object') {
    errors.push('Schema must be a valid object')
    return { isValid: false, errors }
  }

  // Add more validation as needed
  if (!schema.sections || !Array.isArray(schema.sections)) {
    errors.push('Schema must have a sections array')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

