import { NextRequest } from 'next/server'
import { withApiHandler } from '@/lib/impersonation'

/**
 * EXAMPLE: Get products for current user's organization
 * Automatically supports impersonation - NO BOILERPLATE!
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
    
    return {
      products: data || [],
      context: {
        isImpersonating: context.isImpersonating,
        organizationId: context.organizationId,
      },
    }
  },
  { requireOrg: true } // Automatically validates org exists
)

/**
 * EXAMPLE: Create a product for current user's organization
 * Automatically supports impersonation - NO BOILERPLATE!
 */
export const POST = withApiHandler(
  '/api/products',
  'POST',
  'create_product',
  async ({ context, supabase, request }) => {
    const body = await request.json()
    
    // Automatically scoped to effective organization and user
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...body,
        organization_id: context.organizationId, // Uses impersonated org if applicable
        created_by: context.userId, // Uses impersonated user if applicable
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      product: data,
      context: {
        isImpersonating: context.isImpersonating,
      },
    }
  },
  { requireOrg: true }
)

