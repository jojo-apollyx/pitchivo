import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAccessToken } from '@/lib/api/access-tokens'

/**
 * Request a new access token based on previous RFQ submission
 * POST /api/products/tokens/refresh
 * 
 * Allows users with expired tokens to get new access if they submitted an RFQ
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { product_id, email } = body

    // Validate inputs
    if (!product_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, email' },
        { status: 400 }
      )
    }

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user has submitted an RFQ for this product
    const { data: rfqs, error: rfqError } = await supabase
      .from('product_rfqs')
      .select('rfq_id, product_id, org_id, submitted_at')
      .eq('product_id', product_id)
      .eq('email', email)
      .order('submitted_at', { ascending: false })
      .limit(1)

    if (rfqError || !rfqs || rfqs.length === 0) {
      return NextResponse.json(
        {
          error:
            'No RFQ found for this email and product. Please submit an RFQ first.',
        },
        { status: 404 }
      )
    }

    const rfq = rfqs[0]

    // Check if RFQ was submitted recently (within last 90 days)
    const rfqDate = new Date(rfq.submitted_at)
    const daysSinceRfq =
      (new Date().getTime() - rfqDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceRfq > 90) {
      return NextResponse.json(
        {
          error:
            'Your RFQ is older than 90 days. Please submit a new RFQ to request access.',
        },
        { status: 403 }
      )
    }

    // Generate a new token with after_rfq access
    const result = await createAccessToken(
      {
        productId: product_id,
        orgId: rfq.org_id,
        channelId: `rfq_refresh_${rfq.rfq_id}`,
        channelName: 'RFQ Token Refresh',
        accessLevel: 'after_rfq',
        expiresInDays: 30, // New token valid for 30 days
        notes: `Refresh token for RFQ ${rfq.rfq_id}, requested by ${email}`,
      },
      supabase
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate token' },
        { status: 500 }
      )
    }

    // Build full URL
    const baseUrl =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    const fullUrl = `${baseUrl}${result.url}`

    // TODO: Send email with new link (integrate with your email service)
    // For now, just return the token
    // In production, you'd send an email and return success without exposing token

    return NextResponse.json({
      success: true,
      message: 'New access token generated. Check your email for the link.',
      // In production, remove these and only send via email:
      token: result.token,
      url: fullUrl,
      expires_in_days: 30,
    })
  } catch (error: any) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

