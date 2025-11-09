import { withApiHandler } from '@/lib/impersonation'
import { productsResponseSchema, createProductSchema, productSchema } from '@/lib/api/schemas'

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
      .eq('organization_id', context.organizationId)
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

/**
 * EXAMPLE: Create a product for current user's organization
 * Automatically supports impersonation + Zod validation
 */
export const POST = withApiHandler(
  '/api/products',
  'POST',
  'create_product',
  async ({ context, supabase, request }) => {
    const rawBody = await request.json()
    
    // Validate request body with Zod (throws if invalid)
    const validatedInput = createProductSchema.parse(rawBody)
    
    // Automatically scoped to effective organization and user
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...validatedInput,
        organization_id: context.organizationId, // Uses impersonated org if applicable
        created_by: context.userId, // Uses impersonated user if applicable
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Validate response with Zod
    const product = productSchema.parse(data)
    
    return {
      product,
      context: {
        isImpersonating: context.isImpersonating,
      },
    }
  },
  { requireOrg: true }
)

