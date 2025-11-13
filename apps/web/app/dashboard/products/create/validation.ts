import { z } from 'zod'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'

/**
 * Zod schema for validating product data before publishing
 * This ensures all required fields are filled before a product can be published
 */
export const productPublishSchema = z.object({
  product_name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),
  
  origin_country: z
    .string()
    .min(1, 'Origin country is required'),
  
  manufacturer_name: z
    .string()
    .min(1, 'Manufacturer name is required'),
  
  cas_number: z
    .string()
    .min(1, 'CAS number is required'),
  
  fda_number: z
    .string()
    .min(1, 'FDA number is required'),
  
  category: z
    .string()
    .min(1, 'Category is required'),
  
  form: z
    .string()
    .min(1, 'Physical form is required'),
  
  grade: z
    .string()
    .min(1, 'Grade is required'),
  
  applications: z
    .array(z.string())
    .min(1, 'At least one application is required'),
  
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters'),
  
  price_lead_time: z
    .array(
      z.object({
        moq: z.string().optional(),
        price: z.string().optional(),
        lead_time: z.string().optional(),
      })
    )
    .min(1, 'At least one pricing tier is required')
    .refine(
      (tiers) => tiers.some((tier) => {
        const hasMoq = tier.moq && tier.moq.trim() !== ''
        const hasPrice = tier.price && tier.price.trim() !== ''
        const hasLeadTime = tier.lead_time && tier.lead_time.trim() !== ''
        return hasMoq && hasPrice && hasLeadTime
      }),
      {
        message: 'At least one pricing tier must have MOQ, price, and lead time',
      }
    ),
  
  packaging_type: z
    .string()
    .min(1, 'Packaging type is required'),
  
  // Optional fields (not required for publishing)
  net_weight: z.string().optional(),
  payment_terms: z.string().optional(),
  incoterm: z.string().optional(),
  
  // Provide sample - must be 'yes' or 'no'
  provide_sample: z
    .enum(['yes', 'no'], {
      errorMap: () => ({ message: 'Please specify if you provide samples' }),
    }),
  
  // Product images - at least one required
  product_images: z
    .array(z.union([z.string(), z.instanceof(File)]))
    .min(1, 'At least one product image is required'),
  
  // Documents - at least one document required (COA, TDS, MSDS, or spec sheet)
  coa_file: z.string().optional(),
  tds_file: z.string().optional(),
  msds_file: z.string().optional(),
  spec_sheet: z.string().optional(),
  
  // Sample fields (optional in base schema, validated conditionally)
  sample_type: z.string().optional(),
  sample_price: z.union([z.string(), z.number()]).optional(),
  sample_quantity: z.union([z.string(), z.number()]).optional(),
  sample_lead_time: z.string().optional(),
}).refine(
  (data) => {
    // If provide_sample is 'yes', validate sample fields
    if (data.provide_sample === 'yes') {
      // Sample type is required
      if (!data.sample_type || data.sample_type.trim() === '') {
        return false
      }
      // If sample type includes 'Paid', sample price is required
      if (data.sample_type.includes('Paid') && (!data.sample_price || data.sample_price.toString().trim() === '')) {
        return false
      }
      // Sample quantity and lead time are required
      if (!data.sample_quantity || data.sample_quantity.toString().trim() === '') {
        return false
      }
      if (!data.sample_lead_time || data.sample_lead_time.trim() === '') {
        return false
      }
    }
    return true
  },
  {
    message: 'Sample information is incomplete',
    path: ['provide_sample'],
  }
).refine(
  (data) => {
    // If provide_sample is 'yes', validate sample type
    if (data.provide_sample === 'yes' && (!data.sample_type || data.sample_type.trim() === '')) {
      return false
    }
    return true
  },
  {
    message: 'Sample type is required when providing samples',
    path: ['sample_type'],
  }
).refine(
  (data) => {
    // If provide_sample is 'yes' and sample type includes 'Paid', validate sample price
    if (data.provide_sample === 'yes' && data.sample_type?.includes('Paid')) {
      if (!data.sample_price || data.sample_price.toString().trim() === '') {
        return false
      }
    }
    return true
  },
  {
    message: 'Sample price is required for paid samples',
    path: ['sample_price'],
  }
).refine(
  (data) => {
    // If provide_sample is 'yes', validate sample quantity
    if (data.provide_sample === 'yes' && (!data.sample_quantity || data.sample_quantity.toString().trim() === '')) {
      return false
    }
    return true
  },
  {
    message: 'Sample quantity is required when providing samples',
    path: ['sample_quantity'],
  }
).refine(
  (data) => {
    // If provide_sample is 'yes', validate sample lead time
    if (data.provide_sample === 'yes' && (!data.sample_lead_time || data.sample_lead_time.trim() === '')) {
      return false
    }
    return true
  },
  {
    message: 'Sample lead time is required when providing samples',
    path: ['sample_lead_time'],
  }
)

export type ProductPublishFormData = z.infer<typeof productPublishSchema>

/**
 * Map snake_case field names to camelCase for form compatibility
 */
const fieldNameMap: Record<string, string> = {
  product_name: 'productName',
  origin_country: 'originCountry',
  manufacturer_name: 'manufacturerName',
  cas_number: 'casNumber',
  fda_number: 'fdaNumber',
  category: 'category',
  form: 'form',
  grade: 'grade',
  applications: 'applications',
  description: 'description',
  price_lead_time: 'priceTiers', // Map to camelCase for form
  packaging_type: 'packagingType',
  net_weight: 'netWeight',
  payment_terms: 'paymentTerms',
  incoterm: 'incoterm',
  provide_sample: 'provideSample',
  sample_type: 'sampleType',
  sample_price: 'samplePrice',
  sample_quantity: 'sampleQuantity',
  sample_lead_time: 'sampleLeadTime',
  product_images: 'productImages',
  coa_file: 'coaFile',
  tds_file: 'tdsFile',
  msds_file: 'msdsFile',
  spec_sheet: 'specSheet',
}

/**
 * Convert snake_case path to camelCase for form errors
 */
function mapErrorPath(path: string): string {
  const parts = path.split('.')
  if (parts.length === 1) {
    return fieldNameMap[parts[0]] || parts[0]
  }
  // For nested paths, map the first part and keep the rest
  const firstPart = fieldNameMap[parts[0]] || parts[0]
  return [firstPart, ...parts.slice(1)].join('.')
}

/**
 * Validate product data for publishing
 * Returns validation errors in a format compatible with React Hook Form
 * Maps snake_case field names to camelCase for form compatibility
 * 
 * @param data - Product form data
 * @param uploadedFiles - Optional array of uploaded files to check for documents
 */
export function validateProductForPublish(
  data: FoodSupplementProductData,
  uploadedFiles?: Array<{ extraction: { review_status?: string; document_type?: string } }>
): { isValid: boolean; errors: Record<string, string> } {
  try {
    // Convert camelCase to snake_case for validation if needed
    const dataForValidation = {
      product_name: (data as any).productName || data.product_name,
      origin_country: (data as any).originCountry || data.origin_country,
      manufacturer_name: (data as any).manufacturerName || data.manufacturer_name,
      cas_number: (data as any).casNumber || data.cas_number,
      fda_number: (data as any).fdaNumber || data.fda_number,
      category: (data as any).category || data.category,
      form: (data as any).form || data.form,
      grade: (data as any).grade || data.grade,
      applications: (data as any).applications || data.applications || [],
      description: (data as any).description || data.description,
      price_lead_time: (data as any).priceTiers || (data as any).price_lead_time || data.price_lead_time || [],
      packaging_type: (data as any).packagingType || data.packaging_type,
      net_weight: (data as any).netWeight || data.net_weight || '',
      payment_terms: (data as any).paymentTerms || data.payment_terms || '',
      incoterm: (data as any).incoterm || data.incoterm || '',
      provide_sample: (data as any).provideSample || data.provide_sample || 'no',
      sample_type: (data as any).sampleType || data.sample_type,
      sample_price: (data as any).samplePrice || data.sample_price,
      sample_quantity: (data as any).sampleQuantity || data.sample_quantity,
      sample_lead_time: (data as any).sampleLeadTime || data.sample_lead_time,
      product_images: (data as any).productImages || (data as any).product_images || data.product_images || [],
      coa_file: (data as any).coaFile || data.coa_file || '',
      tds_file: (data as any).tdsFile || data.tds_file || '',
      msds_file: (data as any).msdsFile || data.msds_file || '',
      spec_sheet: (data as any).specSheet || data.spec_sheet || '',
    }
    
    // Validate documents - at least one document is required
    // Check both direct file fields and uploaded files
    const hasDirectDocument = 
      (dataForValidation.coa_file && dataForValidation.coa_file.trim() !== '') ||
      (dataForValidation.tds_file && dataForValidation.tds_file.trim() !== '') ||
      (dataForValidation.msds_file && dataForValidation.msds_file.trim() !== '') ||
      (dataForValidation.spec_sheet && dataForValidation.spec_sheet.trim() !== '')
    
    // Check if there are any reviewed uploaded files
    const hasUploadedDocument = uploadedFiles?.some(
      (file) => file.extraction.review_status === 'reviewed'
    ) || false
    
    if (!hasDirectDocument && !hasUploadedDocument) {
      return {
        isValid: false,
        errors: {
          documents: 'At least one document (COA, TDS, MSDS, or Spec Sheet) is required',
        },
      }
    }
    
    productPublishSchema.parse(dataForValidation)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        const mappedPath = mapErrorPath(path)
        errors[mappedPath] = err.message
        
        // Also add error for the root field if it's a nested error
        if (path.includes('.')) {
          const rootField = path.split('.')[0]
          const mappedRoot = fieldNameMap[rootField] || rootField
          if (!errors[mappedRoot]) {
            errors[mappedRoot] = err.message
          }
        }
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { _form: 'Validation failed' } }
  }
}

