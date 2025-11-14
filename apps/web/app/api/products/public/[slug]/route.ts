import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Public API endpoint to get product data for SEO metadata
 * No authentication required - for public product pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Get product by product_id (slug is productId for now)
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', slug)
      .eq('status', 'published') // Only return published products
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get organization info for metadata
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, domain')
      .eq('id', product.org_id)
      .single()

    return NextResponse.json({
      ...product,
      organization_name: organization?.name || null,
      organization_domain: organization?.domain || null,
    })
  } catch (error) {
    console.error('Error fetching public product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

