import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { determineAccessLevel } from '@/lib/api/access-tokens'
import { filterProductObject } from '@/lib/api/field-filtering'

/**
 * Public API endpoint to get product data with access control
 * 
 * SECURITY: This endpoint filters product data based on access level.
 * - No token / public access: Only public fields visible
 * - Valid token: Fields visible based on token's access level
 * - Merchant access: All fields visible
 * 
 * Query params:
 * - token: Access token (optional, for channel-based access)
 * - merchant: Set to 'true' if viewing as merchant (requires auth)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Check if user is authenticated merchant
    let isMerchant = false
    const merchantParam = searchParams.get('merchant')
    if (merchantParam === 'true') {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Verify user is member of product's organization
        const { data: product } = await supabase
          .from('products')
          .select('org_id')
          .eq('product_id', slug)
          .single()

        if (product) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('org_id')
            .eq('org_id', product.org_id)
            .eq('user_id', user.id)
            .single()

          isMerchant = !!membership
        }
      }
    }

    // Determine access level (checks token, merchant status, or defaults to public)
    const accessInfo = await determineAccessLevel(
      searchParams,
      supabase,
      isMerchant,
      slug
    )

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
      .select('name, domain, primary_color, secondary_color, accent_color')
      .eq('id', product.org_id)
      .single()

    // 🔒 SECURITY: Filter product data based on access level
    // This removes fields the user shouldn't see BEFORE sending to client
    const filteredProduct = filterProductObject(product, accessInfo.accessLevel)

    // Add metadata
    return NextResponse.json({
      ...filteredProduct,
      organization_name: organization?.name || null,
      organization_domain: organization?.domain || null,
      organization_theme: {
        primary_color: organization?.primary_color || '#8B5CF6',
        secondary_color: organization?.secondary_color || '#EC4899',
        accent_color: organization?.accent_color || '#F59E0B',
      },
      // Access control metadata (useful for client)
      _access_info: {
        level: accessInfo.accessLevel,
        source: accessInfo.source,
        token_id: accessInfo.tokenId,
        channel_id: accessInfo.channelId,
      },
    })
  } catch (error) {
    console.error('Error fetching public product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

