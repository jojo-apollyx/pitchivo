import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAccessToken } from '@/lib/api/access-tokens'
import { AccessLevel } from '@/lib/api/field-filtering'

/**
 * Generate a new access token for a product channel
 * POST /api/products/tokens/generate
 * 
 * Requires authentication (merchant only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      product_id,
      channel_id,
      channel_name,
      access_level,
      expires_in_days,
      notes,
    } = body

    // Validate required fields
    if (!product_id || !channel_id || !access_level) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, channel_id, access_level' },
        { status: 400 }
      )
    }

    // Validate access level
    const validLevels: AccessLevel[] = ['public', 'after_click', 'after_rfq']
    if (!validLevels.includes(access_level)) {
      return NextResponse.json(
        { error: `Invalid access_level. Must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      )
    }

    // Get product and verify user has access
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('product_id, org_id')
      .eq('product_id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify user is member of product's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.organization_id !== product.org_id) {
      return NextResponse.json(
        { error: 'You do not have permission to create tokens for this product' },
        { status: 403 }
      )
    }

    // Create the token
    const result = await createAccessToken(
      {
        productId: product_id,
        orgId: product.org_id,
        channelId: channel_id,
        channelName: channel_name,
        accessLevel: access_level,
        expiresInDays: expires_in_days,
        createdBy: user.id,
        notes: notes,
      },
      supabase
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create token' },
        { status: 500 }
      )
    }

    // Build full URL
    const baseUrl =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    const fullUrl = `${baseUrl}${result.url}`

    return NextResponse.json({
      success: true,
      token: result.token,
      token_id: result.tokenId,
      url: fullUrl,
      access_level: access_level,
      channel_id: channel_id,
      expires_in_days: expires_in_days || null,
    })
  } catch (error: any) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

