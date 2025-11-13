import { withApiHandler } from '@/lib/impersonation'
import { productSchema } from '@/lib/api/schemas'

/**
 * Get a single product by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params
  
  return withApiHandler(
    '/api/products/[id]',
    'GET',
    'get_product',
    async ({ context, supabase }) => {
      if (!productId) {
        throw new Error('Product ID is required')
      }
    
      // Get product
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .eq('org_id', context.organizationId) // Ensure user can only access their org's products
        .single()
      
      if (error) throw error
      
      if (!product) {
        throw new Error('Product not found or you do not have permission to access it')
      }
      
      // Validate response
      const validatedProduct = productSchema.parse(product)
      
      return validatedProduct
    },
    { requireOrg: true }
  )(request)
}

