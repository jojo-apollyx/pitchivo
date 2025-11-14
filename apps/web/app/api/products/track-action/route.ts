import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Track user actions on product pages
 * POST /api/products/track-action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      access_id,
      product_id,
      action_type,
      action_target,
      action_metadata,
    } = body

    if (!access_id || !product_id || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields: access_id, product_id, action_type' },
        { status: 400 }
      )
    }

    const validActionTypes = [
      'page_view',
      'field_reveal',
      'document_view',
      'document_download',
      'rfq_submit',
      'email_click',
      'phone_click',
      'link_click',
      'share_click',
    ]

    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json(
        { error: `Invalid action_type. Must be one of: ${validActionTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get org_id from access log
    const { data: accessLog, error: accessError } = await supabase
      .from('product_access_logs')
      .select('org_id')
      .eq('access_id', access_id)
      .single()

    if (accessError || !accessLog) {
      return NextResponse.json(
        { error: 'Access log not found' },
        { status: 404 }
      )
    }

    // Insert action
    const { data: action, error: insertError } = await supabase
      .from('product_access_actions')
      .insert({
        access_id,
        product_id,
        org_id: accessLog.org_id,
        action_type,
        action_target: action_target || null,
        action_metadata: action_metadata || {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting action:', insertError)
      return NextResponse.json(
        { error: 'Failed to track action', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      action_id: action.action_id,
    })
  } catch (error) {
    console.error('Track action error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

