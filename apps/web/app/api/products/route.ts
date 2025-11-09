import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getEffectiveContext, logApiAccess } from '@/lib/impersonation'

/**
 * EXAMPLE: Get products for current user's organization
 * Automatically supports impersonation
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get effective context (handles impersonation automatically)
    const context = await getEffectiveContext()
    
    // 2. Log the API access with impersonation info
    await logApiAccess('/api/products', 'GET', 'list_products', {
      organizationId: context.organizationId,
    })
    
    // 3. Validate organization context
    if (!context.organizationId) {
      return NextResponse.json(
        { error: 'No organization context' },
        { status: 400 }
      )
    }
    
    // 4. Query data scoped to effective organization
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', context.organizationId) // Automatically uses impersonated org
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // 5. Log successful response
    console.log('[Products API] Returning', data?.length, 'products for org', context.organizationId)
    
    return NextResponse.json({
      products: data || [],
      context: {
        isImpersonating: context.isImpersonating,
        organizationId: context.organizationId,
      },
    })
  } catch (error: any) {
    console.error('[Products API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * EXAMPLE: Create a product for current user's organization
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getEffectiveContext()
    const body = await request.json()
    
    await logApiAccess('/api/products', 'POST', 'create_product', {
      organizationId: context.organizationId,
      productName: body.name,
    })
    
    if (!context.organizationId) {
      return NextResponse.json(
        { error: 'No organization context' },
        { status: 400 }
      )
    }
    
    // Automatically scope to effective organization
    const supabase = await createServerClient()
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
    
    console.log('[Products API] Created product:', data.id, 'for org', context.organizationId)
    
    return NextResponse.json({
      product: data,
      context: {
        isImpersonating: context.isImpersonating,
      },
    })
  } catch (error: any) {
    console.error('[Products API] Error creating product:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

