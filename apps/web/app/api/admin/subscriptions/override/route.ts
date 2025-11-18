/**
 * Admin Subscription Override API
 * Allows admins to manually override quota limits for organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Create admin Supabase client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const body = await request.json()
    const { orgId, emailQuota, qrLinksPerProduct } = body

    // Validate input
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (emailQuota !== undefined && (typeof emailQuota !== 'number' || emailQuota < 0)) {
      return NextResponse.json(
        { error: 'Email quota must be a positive number' },
        { status: 400 }
      )
    }

    if (qrLinksPerProduct !== undefined && (typeof qrLinksPerProduct !== 'number' || qrLinksPerProduct < 0)) {
      return NextResponse.json(
        { error: 'QR links per product must be a positive number' },
        { status: 400 }
      )
    }

    // Get existing subscription
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: any = {
      custom_quota_override: true,
      updated_at: new Date().toISOString()
    }

    if (emailQuota !== undefined) {
      updates.email_quota = emailQuota
    }

    if (qrLinksPerProduct !== undefined) {
      updates.qr_links_per_product = qrLinksPerProduct
    }

    // Update subscription
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(updates)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription quota overridden successfully',
      subscription: data
    })

  } catch (error: any) {
    console.error('Error in subscription override:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve subscription details
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `)
      .eq('org_id', orgId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

