import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createRfqUpgradeToken } from '@/lib/api/access-tokens'

const rfqSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  phone: z.string().optional(),
  message: z.string().min(10),
  quantity: z.string().optional(),
  targetDate: z.string().optional(),
})

/**
 * Submit RFQ for a product
 * POST /api/products/rfq
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = rfqSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const supabase = await createClient()

    // Get product and org_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('org_id, product_name')
      .eq('product_id', data.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Store RFQ in product_rfqs table (if it exists)
    // If table doesn't exist yet, we'll just track the action
    let rfqId = null
    try {
      const { data: rfqData, error: rfqError } = await supabase
        .from('product_rfqs')
        .insert({
          product_id: data.product_id,
          org_id: product.org_id,
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          message: data.message,
          quantity: data.quantity,
          target_date: data.targetDate,
          status: 'new',
          submitted_at: new Date().toISOString(),
        })
        .select('rfq_id')
        .single()

      if (!rfqError && rfqData) {
        rfqId = rfqData.rfq_id
      }
    } catch (error) {
      console.log('RFQ table not found or error storing RFQ:', error)
      // Continue - we'll still track the action
    }

    // Get the most recent access_id for this product and visitor
    const sessionId = request.headers.get('x-session-id') || 'unknown'
    
    // Find or create access log for tracking
    const { data: accessLogs } = await supabase
      .from('product_access_logs')
      .select('access_id')
      .eq('product_id', data.product_id)
      .eq('session_id', sessionId)
      .order('accessed_at', { ascending: false })
      .limit(1)
      .single()

    const accessId = accessLogs?.access_id

    // Track RFQ submission as an action
    if (accessId) {
      await supabase
        .from('product_access_actions')
        .insert({
          access_id: accessId,
          product_id: data.product_id,
          org_id: product.org_id,
          action_type: 'rfq_submit',
          action_target: 'rfq_form',
          action_metadata: {
            rfq_id: rfqId,
            name: data.name,
            email: data.email,
            company: data.company,
            phone: data.phone,
            quantity: data.quantity,
            targetDate: data.targetDate,
            message: data.message,
          },
        })
    }

    // ✨ NEW: Generate upgrade token for after_rfq access
    const tokenResult = await createRfqUpgradeToken(
      data.product_id,
      product.org_id,
      rfqId || `rfq_${Date.now()}`,
      supabase
    )

    if (!tokenResult.success) {
      console.error('Failed to generate upgrade token:', tokenResult.error)
      // Don't fail the RFQ, just log the error
    }

    // Build full URL for redirect
    const baseUrl =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    const upgradeUrl = tokenResult.success
      ? `${baseUrl}${tokenResult.url}`
      : null

    // TODO: Send email notification to product owner

    return NextResponse.json({
      success: true,
      message: 'RFQ submitted successfully',
      rfq_id: rfqId,
      // Return upgrade token for client to redirect
      upgrade_token: tokenResult.token,
      upgrade_url: upgradeUrl,
    })
  } catch (error) {
    console.error('RFQ submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

