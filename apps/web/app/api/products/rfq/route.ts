import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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

    // TODO: Store RFQ in database (create rfqs table if needed)
    // For now, we'll just track it as an action
    // In production, you'd want a dedicated rfqs table

    // Get the most recent access_id for this product and visitor
    // This is a simplified approach - in production, you'd track this better
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

    // TODO: Send email notification to product owner
    // TODO: Store RFQ in dedicated rfqs table

    return NextResponse.json({
      success: true,
      message: 'RFQ submitted successfully',
    })
  } catch (error) {
    console.error('RFQ submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

