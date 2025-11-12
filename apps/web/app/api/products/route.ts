import { withApiHandler } from '@/lib/impersonation'
import { productsResponseSchema, createProductSchema, productSchema } from '@/lib/api/schemas'
import { detectProductIndustry } from '@/lib/api/industry-detection'
import { getIndustriesForAI, getIndustryByCode } from '@/lib/constants/industries'
import { z } from 'zod'

/**
 * EXAMPLE: Get products for current user's organization
 * Automatically supports impersonation + Zod validation
 */
export const GET = withApiHandler(
  '/api/products',
  'GET',
  'list_products',
  async ({ context, supabase }) => {
    // Query automatically scoped to effective organization (impersonated if applicable)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', context.organizationId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Validate response with Zod
    const response = {
      products: data || [],
      context: {
        isImpersonating: context.isImpersonating,
        organizationId: context.organizationId,
      },
    }
    
    return productsResponseSchema.parse(response) // Zod validation ensures type safety
  },
  { requireOrg: true }
)

// Schema for industry detection response
const industryDetectionResponseSchema = z.object({
  industry_code: z.string(),
  industry_name: z.string(),
})

// Schema for initial product creation request (just product name)
const productNameInitSchema = z.object({
  product_name_raw: z.string().min(1, 'Product name is required'),
})

/**
 * Create a product for current user's organization
 * Flow:
 * 1. If product_name_raw provided, detect industry and return it
 * 2. If full product data provided, create product
 */
export const POST = withApiHandler(
  '/api/products',
  'POST',
  'create_product',
  async ({ context, supabase, request }) => {
    const rawBody = await request.json()
    
    // Check if this is initial request (just product name) or full product creation
    if (rawBody.product_name_raw && !rawBody.product_name) {
      // Step 1: Detect industry for the product
      const initInput = productNameInitSchema.parse(rawBody)
      
      // Get organization info
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, industry, description')
        .eq('id', context.organizationId)
        .single()

      if (orgError || !org) {
        throw new Error('Organization not found')
      }

      // Get available industries from hardcoded constants
      const availableIndustries = getIndustriesForAI()

      if (availableIndustries.length === 0) {
        throw new Error('No industries available')
      }

      // Use AI to detect the most suitable industry for this product
      const detectedIndustryCode = await detectProductIndustry({
        productName: initInput.product_name_raw,
        orgContext: {
          orgName: org.name,
          orgIndustry: org.industry || undefined,
          orgDescription: org.description || undefined,
        },
        availableIndustries,
      })

      // Get industry details from hardcoded constants
      const industry = getIndustryByCode(detectedIndustryCode)

      if (!industry || !industry.enabled) {
        throw new Error(`Detected industry ${detectedIndustryCode} is not available`)
      }

      // Return industry detection response
      return industryDetectionResponseSchema.parse({
        industry_code: industry.code,
        industry_name: industry.name,
      })
    }

    // Step 2: Create product with full data
    const validatedInput = createProductSchema.parse(rawBody)
    
    // Get organization to get industry_code if not provided
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('industry')
      .eq('id', context.organizationId)
      .single()

    if (orgError || !org) {
      throw new Error('Organization not found')
    }

    const industryCode = validatedInput.industry_code || org.industry
    if (!industryCode) {
      throw new Error('Industry code is required')
    }

    // Create product (no template fields)
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        org_id: context.organizationId,
        product_name: validatedInput.product_name,
        industry_code: industryCode,
        status: validatedInput.status || 'draft',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Validate response
    const validatedProduct = productSchema.parse(product)

    return {
      product: validatedProduct,
      context: {
        isImpersonating: context.isImpersonating,
      },
    }
  },
  { requireOrg: true }
)

