import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

/**
 * Get dashboard statistics for the authenticated user's organization
 * GET /api/dashboard/stats
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

    const orgId = profile.organization_id

    // Fetch all statistics in parallel
    const [
      { count: productsCount } = { count: 0 },
      { count: publishedProductsCount } = { count: 0 },
      { count: draftProductsCount } = { count: 0 },
      { count: rfqsCount } = { count: 0 },
      { count: newRfqsCount } = { count: 0 },
      { count: respondedRfqsCount } = { count: 0 },
    ] = await Promise.all([
      // Total products
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId),
      
      // Published products
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'published'),
      
      // Draft products
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'draft'),
      
      // Total RFQs
      supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId),
      
      // New RFQs
      supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'new'),
      
      // Responded RFQs
      supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['responded', 'won']),
    ])

    return NextResponse.json({
      products: {
        total: productsCount || 0,
        published: publishedProductsCount || 0,
        draft: draftProductsCount || 0,
      },
      rfqs: {
        total: rfqsCount || 0,
        new: newRfqsCount || 0,
        responded: respondedRfqsCount || 0,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

