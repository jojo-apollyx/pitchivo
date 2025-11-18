import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Preview deletion for specific product or organization
 * Shows what related data will be deleted
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Pitchivo admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'product' or 'organization'
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and id' },
        { status: 400 }
      )
    }

    if (type === 'product') {
      // Preview product deletion
      const relatedData = {
        campaigns: 0,
        rfqs: 0,
        tracking: 0,
        documents: 0,
      }

      // Count campaigns
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id)
      relatedData.campaigns = campaignsCount || 0

      // Count RFQs
      const { count: rfqsCount } = await supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id)
      relatedData.rfqs = rfqsCount || 0

      // Count tracking records (product_view_tracking)
      const { count: trackingCount } = await supabase
        .from('product_view_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id)
      relatedData.tracking = trackingCount || 0

      // Count document extractions
      const { data: product } = await supabase
        .from('products')
        .select('org_id')
        .eq('product_id', id)
        .single()

      if (product) {
        const { count: docsCount } = await supabase
          .from('document_extractions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', product.org_id)
        relatedData.documents = docsCount || 0
      }

      const totalRecords =
        1 + // product itself
        relatedData.campaigns +
        relatedData.rfqs +
        relatedData.tracking +
        relatedData.documents

      return NextResponse.json({
        success: true,
        type: 'product',
        relatedData,
        totalRecords,
      })
    } else if (type === 'organization') {
      // Preview organization deletion
      const relatedData = {
        products: 0,
        users: 0,
        campaigns: 0,
        rfqs: 0,
        subscriptions: 0,
        documents: 0,
      }

      // Count products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', id)
      relatedData.products = productsCount || 0

      // Count users
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
      relatedData.users = usersCount || 0

      // Count campaigns (from products)
      const { data: products } = await supabase
        .from('products')
        .select('product_id')
        .eq('org_id', id)

      if (products && products.length > 0) {
        const productIds = products.map((p) => p.product_id)

        const { count: campaignsCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds)
        relatedData.campaigns = campaignsCount || 0

        const { count: rfqsCount } = await supabase
          .from('product_rfqs')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds)
        relatedData.rfqs = rfqsCount || 0
      }

      // Count subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', id)
      relatedData.subscriptions = subscriptionsCount || 0

      // Count documents
      const { count: documentsCount } = await supabase
        .from('document_extractions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
      relatedData.documents = documentsCount || 0

      const totalRecords =
        1 + // organization itself
        relatedData.products +
        relatedData.users +
        relatedData.campaigns +
        relatedData.rfqs +
        relatedData.subscriptions +
        relatedData.documents

      return NextResponse.json({
        success: true,
        type: 'organization',
        relatedData,
        totalRecords,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "product" or "organization"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Error previewing deletion:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

