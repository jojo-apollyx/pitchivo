import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Track product page access
 * POST /api/products/track-access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_id,
      access_method, // 'url' or 'qr_code'
      channel_id,
      channel_name,
      session_id,
      visitor_id,
      ip_address,
      user_agent,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      country_code,
      city,
      device_type,
    } = body

    if (!product_id || !access_method || !session_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, access_method, session_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get product to find org_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('org_id')
      .eq('product_id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if this is a unique visit (first visit from this visitor_id to this product)
    let is_unique_visit = true
    if (visitor_id) {
      const { count } = await supabase
        .from('product_access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product_id)
        .eq('visitor_id', visitor_id)
      
      is_unique_visit = (count || 0) === 0
    }

    // Insert access log
    const { data: accessLog, error: insertError } = await supabase
      .from('product_access_logs')
      .insert({
        product_id,
        org_id: product.org_id,
        access_method,
        channel_id: channel_id || null,
        channel_name: channel_name || null,
        session_id,
        visitor_id: visitor_id || null,
        is_unique_visit,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        referrer: referrer || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        country_code: country_code || null,
        city: city || null,
        device_type: device_type || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting access log:', insertError)
      return NextResponse.json(
        { error: 'Failed to track access', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      access_id: accessLog.access_id,
    })
  } catch (error) {
    console.error('Track access error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

