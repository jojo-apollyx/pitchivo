import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

/**
 * Get all RFQs for the authenticated user's organization
 * GET /api/rfqs?status=new&productId=xxx&search=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status')
    const productIdFilter = searchParams.get('productId')
    const searchQuery = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const offset = (page - 1) * pageSize

    // Build query with count
    let query = supabase
      .from('product_rfqs')
      .select(`
        *,
        products (
          product_id,
          product_name,
          industry_code,
          product_data
        )
      `, { count: 'exact' })
      .eq('org_id', profile.organization_id)
      .order('submitted_at', { ascending: false })

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (productIdFilter && productIdFilter !== 'all') {
      query = query.eq('product_id', productIdFilter)
    }

    // Apply search filter (server-side)
    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`
      )
    }

    // Apply pagination
    const { data: rfqs, error, count } = await query
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching RFQs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch RFQs' },
        { status: 500 }
      )
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0

    return NextResponse.json({
      rfqs: rfqs || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('RFQ fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update RFQ status
 * PATCH /api/rfqs
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const body = await request.json()
    const { rfq_id, status, response_message } = body

    if (!rfq_id || !status) {
      return NextResponse.json(
        { error: 'rfq_id and status are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this RFQ
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 403 }
      )
    }

    // Check RFQ belongs to user's organization
    const { data: rfq, error: rfqError } = await supabase
      .from('product_rfqs')
      .select('org_id')
      .eq('rfq_id', rfq_id)
      .single()

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      )
    }

    if (rfq.org_id !== profile.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update RFQ
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // If marking as responded, set response fields
    if (status === 'responded' || status === 'won') {
      updateData.responded_at = new Date().toISOString()
      updateData.responded_by = user.id
      if (response_message) {
        updateData.response_message = response_message
      }
    }

    const { data: updatedRfq, error: updateError } = await supabase
      .from('product_rfqs')
      .update(updateData)
      .eq('rfq_id', rfq_id)
      .select(`
        *,
        products (
          product_id,
          product_name,
          industry_code,
          product_data
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating RFQ:', updateError)
      return NextResponse.json(
        { error: 'Failed to update RFQ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rfq: updatedRfq,
    })
  } catch (error) {
    console.error('RFQ update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

