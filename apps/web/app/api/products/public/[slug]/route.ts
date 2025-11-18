import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { determineAccessLevel } from '@/lib/api/access-tokens'
import { filterProductObject } from '@/lib/api/field-filtering'

// Create admin Supabase client for public organization queries
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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

    // SECURITY: Always check if authenticated user owns this product
    // Never trust URL parameters for access control!
    let isMerchant = false
    
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Get product organization
      const { data: product } = await supabase
        .from('products')
        .select('org_id')
        .eq('product_id', slug)
        .single()

      if (product) {
        // Verify user is member of product's organization
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, organization_id, metadata, org_role')
          .eq('id', user.id)
          .single()

        // Grant merchant access if user owns this product
        isMerchant = !!userProfile && userProfile.organization_id === product.org_id
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
    // Merchants can preview draft products, others can only see published
    let query = supabase
      .from('products')
      .select('*')
      .eq('product_id', slug)
    
    // Only add status filter if not a merchant (merchants can see drafts for preview)
    if (!isMerchant) {
      query = query.eq('status', 'published')
    }
    
    const { data: product, error } = await query.single()

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get organization info for metadata
    // SECURITY: Use admin client for public endpoint (anonymous access)
    // Only selecting public-safe branding fields for product display
    // See lib/api/organization-filtering.ts for full list of safe fields
    const { data: organization } = await supabaseAdmin
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

