/**
 * Template schema validation utilities
 * Validates AI-generated product templates to ensure they're usable
 */

import { z } from 'zod'

// Field type enum
export const FieldType = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  TEXTAREA: 'textarea',
  DATE: 'date',
  FILE: 'file',
  IMAGE: 'image',
  TABLE: 'table',
} as const

// Visibility enum
export const Visibility = {
  PUBLIC: 'public',
  TARGET_ONLY: 'target_only',
  AFTER_RFQ: 'after_rfq',
} as const

// Search normalization enum
export const SearchNormalize = {
  KEYWORD: 'keyword',
  NUMERIC: 'numeric',
  RANGE: 'range',
  HS_CODE: 'hs_code',
  CAS_NUMBER: 'cas_number',
  NONE: 'none',
} as const

// Validation rules schema
const validationRulesSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  regex: z.string().optional(),
  required: z.boolean().optional(),
}).optional()

// Field schema
const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Key must be lowercase_snake_case starting with letter'),
  label: z.string().min(1, 'Label is required'),
  type: z.enum([
    FieldType.TEXT,
    FieldType.NUMBER,
    FieldType.SELECT,
    FieldType.MULTISELECT,
    FieldType.TEXTAREA,
    FieldType.DATE,
    FieldType.FILE,
    FieldType.IMAGE,
    FieldType.TABLE,
  ]),
  required: z.boolean().default(false),
  visibility: z.enum([
    Visibility.PUBLIC,
    Visibility.TARGET_ONLY,
    Visibility.AFTER_RFQ,
  ]).default(Visibility.PUBLIC),
  search_normalize: z.enum([
    SearchNormalize.KEYWORD,
    SearchNormalize.NUMERIC,
    SearchNormalize.RANGE,
    SearchNormalize.HS_CODE,
    SearchNormalize.CAS_NUMBER,
    SearchNormalize.NONE,
  ]).default(SearchNormalize.NONE),
  unit: z.string().optional(),
  unit_options: z.array(z.string()).optional(),
  unit_type: z.enum(['fixed', 'select']).optional(),
  placeholder: z.string().optional(),
  help: z.string().optional(),
  options: z.array(z.string()).optional(), // For select/multiselect
  accepted: z.array(z.string()).optional(), // For file/image types
  validation_rules: validationRulesSchema,
})

// Section schema
const sectionSchema = z.object({
  section_id: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Section ID must be lowercase_snake_case'),
  title: z.string().min(1, 'Section title is required'),
  fields: z.array(fieldSchema).min(1, 'Section must have at least one field'),
})

// Template schema
export const templateSchema = z.object({
  template_id: z.string().optional(), // Optional - set by database when saved
  industry: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semantic (e.g., 1.0.0)'),
  sections: z.array(sectionSchema).min(1, 'Template must have at least one section'),
  meta: z.object({
    source: z.string(),
    generated_at: z.string().datetime(),
    industry_context: z.string().optional(),
  }),
})

export type TemplateSchema = z.infer<typeof templateSchema>
export type FieldSchema = z.infer<typeof fieldSchema>
export type SectionSchema = z.infer<typeof sectionSchema>

/**
 * Validate a generated template schema
 */
export function validateGeneratedTemplate(schemaJson: unknown): {
  valid: boolean
  errors: string[]
  template?: TemplateSchema
} {
  try {
    const template = templateSchema.parse(schemaJson)
    
    const errors: string[] = []
    
    // Check for required sections
    const requiredSections = ['basic_info', 'specifications', 'commercial']
    const sectionIds = template.sections.map(s => s.section_id)
    for (const required of requiredSections) {
      if (!sectionIds.includes(required)) {
        errors.push(`Missing required section: ${required}`)
      }
    }
    
    // Check for required fields across all sections
    const allFields = template.sections.flatMap(s => s.fields)
    const fieldKeys = allFields.map(f => f.key)
    
    // Check for duplicate keys
    const duplicates = fieldKeys.filter((key, index) => fieldKeys.indexOf(key) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate field keys: ${[...new Set(duplicates)].join(', ')}`)
    }
    
    // Check for required fields
    const requiredFields = ['product_name', 'price', 'moq']
    const missingRequired = requiredFields.filter(req => !fieldKeys.includes(req))
    if (missingRequired.length > 0) {
      errors.push(`Missing required fields: ${missingRequired.join(', ')}`)
    }
    
    // Validate field-specific requirements
    for (const section of template.sections) {
      for (const field of section.fields) {
        // Select/multiselect must have options
        if ((field.type === FieldType.SELECT || field.type === FieldType.MULTISELECT) && !field.options) {
          errors.push(`Field '${field.key}' (${field.type}) must have options`)
        }
        
        // File/image types should have accepted formats
        if ((field.type === FieldType.FILE || field.type === FieldType.IMAGE) && !field.accepted) {
          errors.push(`Field '${field.key}' (${field.type}) should specify accepted formats`)
        }
        
        // Unit handling validation
        if (field.unit && field.unit_options) {
          errors.push(`Field '${field.key}' cannot have both 'unit' and 'unit_options'`)
        }
        
        if (field.unit_options && !field.unit_type) {
          errors.push(`Field '${field.key}' with 'unit_options' must specify 'unit_type'`)
        }
      }
    }
    
    if (errors.length > 0) {
      return { valid: false, errors }
    }
    
    return { valid: true, errors: [], template }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      }
    }
    return {
      valid: false,
      errors: [`Invalid JSON structure: ${error instanceof Error ? error.message : 'Unknown error'}`],
    }
  }
}

/**
 * Normalize a template schema (fix common issues)
 */
export function normalizeTemplateSchema(schemaJson: any): TemplateSchema {
  // Fix unit handling - convert old format to new format
  if (schemaJson.sections) {
    for (const section of schemaJson.sections) {
      if (section.fields) {
        for (const field of section.fields) {
          // Convert old unit format: {type: "select", options: [...]} to new format
          if (field.unit && typeof field.unit === 'object') {
            if (field.unit.type === 'select' && field.unit.options) {
              field.unit_options = field.unit.options
              field.unit_type = 'select'
              delete field.unit
            } else if (typeof field.unit === 'string') {
              // Keep as is if it's already a string
            } else {
              delete field.unit
            }
          }
          
          // Fix regex_normalize -> search_normalize
          if (field.regex_normalize && !field.search_normalize) {
            field.search_normalize = field.regex_normalize
            delete field.regex_normalize
          }
          
          // Ensure all keys are lowercase_snake_case
          if (field.key) {
            field.key = field.key.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^([^a-z])/, '_$1')
          }
        }
      }
    }
  }
  
  // Validate after normalization
  const validation = validateGeneratedTemplate(schemaJson)
  if (!validation.valid) {
    throw new Error(`Template validation failed: ${validation.errors.join('; ')}`)
  }
  
  return validation.template!
}

