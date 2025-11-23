import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { determineAccessLevel } from '@/lib/api/access-tokens'
import { filterProductObject } from '@/lib/api/field-filtering'
import { cookies } from 'next/headers'

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

    // SECURITY: Always check if authenticated user owns this product
    // Never trust URL parameters for access control!
    
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Determine access level first to get product ID from token if slug is a token
    const cookieStore = await cookies()
    const initialAccessInfo = await determineAccessLevel(
      supabase,
      false, // Will check merchant status after we know product ID
      undefined, // Don't pass productId yet - let token lookup determine it
      cookieStore,
      slug // Pass slug to check if it's a token
    )
    
    // Get actual product ID - either from token lookup or from slug (if slug is product ID)
    let actualProductId = slug
    if (initialAccessInfo.productId) {
      // Product ID retrieved from token lookup
      actualProductId = initialAccessInfo.productId
    }
    
    // Now check merchant status with actual product ID
    let isMerchant = false
    if (user) {
      // Get product organization using actual product ID
      const { data: product } = await supabase
        .from('products')
        .select('org_id')
        .eq('product_id', actualProductId)
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

    // Re-determine access level with merchant status now that we know product ID
    const accessInfo = await determineAccessLevel(
      supabase,
      isMerchant,
      actualProductId,
      cookieStore,
      slug
    )
    
    // SECURITY: If user accessed with a valid token, store it in a secure cookie
    // This prevents them from removing token from URL and refreshing to get higher access
    if (accessInfo.shouldSetCookie && accessInfo.cookieToken && actualProductId) {
      const cookieName = `product_token_${actualProductId}`
      const cookieValue = accessInfo.cookieToken
      
      // Get token expiration from database to set cookie expiration
      const { data: tokenData } = await supabase
        .from('product_access_tokens')
        .select('expires_at')
        .eq('token_id', accessInfo.tokenId)
        .single()
      
      // Calculate cookie expiration (match token expiration or 90 days max)
      let maxAge = 90 * 24 * 60 * 60 // 90 days in seconds
      if (tokenData?.expires_at) {
        const expiresAt = new Date(tokenData.expires_at)
        const now = new Date()
        const secondsUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
        if (secondsUntilExpiry > 0 && secondsUntilExpiry < maxAge) {
          maxAge = secondsUntilExpiry
        }
      }
      
      // Set secure HTTP-only cookie to remember token access
      // SECURITY: This prevents users from removing the token from URL and refreshing
      // to get higher access. The cookie maintains their access level.
      cookieStore.set(cookieName, cookieValue, {
        httpOnly: true, // Prevent JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection while allowing navigation
        maxAge: maxAge, // Match token expiration
        path: '/', // Available site-wide but cookie name is product-specific
      })
    }

    // Get product by product_id (use actual product ID, not slug which might be a token)
    // Merchants can preview draft products, others can only see published
    let query = supabase
      .from('products')
      .select('*')
      .eq('product_id', actualProductId)
    
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

