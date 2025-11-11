import { z } from 'zod'

/**
 * Zod schemas for API request/response validation
 * Use these with React Hook Form and API validation
 */

// Product schemas
export const productSchema = z.object({
  product_id: z.string().uuid(),
  org_id: z.string().uuid(),
  product_name: z.string().min(1, 'Product name is required'),
  industry_code: z.string().min(1, 'Industry code is required'),
  template_id: z.string().uuid().nullable(),
  template_version_snapshot: z.any().nullable(), // JSONB
  status: z.enum(['draft', 'published']).default('draft'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Schema for creating a product (initial step - just product name)
export const createProductInitSchema = z.object({
  product_name_raw: z.string().min(1, 'Product name is required').max(200),
})

// Schema for creating a product with full data
export const createProductSchema = z.object({
  product_name: z.string().min(1, 'Product name is required').max(200),
  industry_code: z.string().min(1, 'Industry code is required'),
  template_id: z.string().uuid().nullable().optional(),
  template_version_snapshot: z.any().nullable().optional(), // JSONB - will be set from template
  status: z.enum(['draft', 'published']).default('draft').optional(),
  // Product data based on template (dynamic fields)
  product_data: z.record(z.any()).optional(), // Dynamic fields from template
})

// Schema for updating a product
export const updateProductSchema = z.object({
  product_name: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'published']).optional(),
  product_data: z.record(z.any()).optional(), // Dynamic fields from template
})

export const productsResponseSchema = z.object({
  products: z.array(productSchema),
  context: z.object({
    isImpersonating: z.boolean(),
    organizationId: z.string().uuid(),
  }).optional(),
})

// Response schema for product creation with template
export const createProductWithTemplateResponseSchema = z.object({
  product: productSchema,
  template: z.any(), // TemplateSchema
  template_id: z.string().uuid(),
  context: z.object({
    isImpersonating: z.boolean(),
  }).optional(),
})

// Organization schemas
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  domain: z.string(),
  slug: z.string(),
  primary_color: z.string(),
  secondary_color: z.string(),
  accent_color: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const organizationsResponseSchema = z.object({
  organizations: z.array(organizationSchema),
  meta: z.object({
    isImpersonating: z.boolean(),
    adminId: z.string().uuid(),
  }).optional(),
})

// Campaign schemas
export const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  organization_id: z.string().uuid(),
  status: z.enum(['draft', 'scheduled', 'active', 'completed', 'cancelled']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createCampaignSchema = campaignSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, 'Campaign name is required'),
})

// RFQ schemas
export const rfqSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  buyer_email: z.string().email(),
  message: z.string(),
  status: z.enum(['pending', 'responded', 'closed']),
  created_at: z.string().datetime(),
})

// Type exports for TypeScript
export type Product = z.infer<typeof productSchema>
export type CreateProductInitInput = z.infer<typeof createProductInitSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductsResponse = z.infer<typeof productsResponseSchema>
export type CreateProductWithTemplateResponse = z.infer<typeof createProductWithTemplateResponseSchema>

export type Organization = z.infer<typeof organizationSchema>
export type OrganizationsResponse = z.infer<typeof organizationsResponseSchema>

export type Campaign = z.infer<typeof campaignSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>

export type RFQ = z.infer<typeof rfqSchema>

// Template schemas
export const getTemplateRequestSchema = z.object({
  product_name_raw: z.string().min(1),
  org_id: z.string().uuid().optional(),
})

export const templateResponseSchema = z.object({
  template: z.any(), // TemplateSchema from template-validation
  template_id: z.string().uuid(), // UUID from database
  version: z.string(),
  source: z.enum(['database', 'ai_generated', 'ai_generated_and_saved', 'manual']),
  industry_code: z.string(),
  industry_name: z.string().optional(), // Industry name for display
  warning: z.string().optional(),
  is_generating: z.boolean().optional(), // True if template is being generated
})

export type GetTemplateRequest = z.infer<typeof getTemplateRequestSchema>
export type TemplateResponse = z.infer<typeof templateResponseSchema>

