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
      // Preview product deletion with comprehensive related data check
      const tables: Record<string, { count: number; sampleIds: string[]; description: string }> = {}
      
      // Get product info first
      const { data: product } = await supabase
        .from('products')
        .select('org_id')
        .eq('product_id', id)
        .single()

      // 1. Campaigns
      const { data: campaigns, count: campaignsCount } = await supabase
        .from('campaigns')
        .select('campaign_id', { count: 'exact' })
        .eq('product_id', id)
        .limit(5)
      
      if (campaignsCount && campaignsCount > 0) {
        tables['campaigns'] = {
          count: campaignsCount,
          sampleIds: campaigns?.map(c => c.campaign_id) || [],
          description: 'Marketing campaigns for this product'
        }
      }

      // Get campaign IDs for related data
      const campaignIds = campaigns?.map(c => c.campaign_id) || []

      // 2. Campaign Leads (for each campaign)
      if (campaignIds.length > 0) {
        const { data: leads, count: leadsCount } = await supabase
          .from('campaign_leads')
          .select('lead_id, email', { count: 'exact' })
          .in('campaign_id', campaignIds)
          .limit(5)
        
        if (leadsCount && leadsCount > 0) {
          tables['campaign_leads'] = {
            count: leadsCount,
            sampleIds: leads?.map(l => `${l.email} (${l.lead_id.substring(0, 8)}...)`) || [],
            description: 'Lead contacts added to campaigns'
          }
        }

        // 3. Scheduled Emails
        const { data: scheduled, count: scheduledCount } = await supabase
          .from('scheduled_emails')
          .select('scheduled_email_id, recipient_email, status', { count: 'exact' })
          .in('campaign_id', campaignIds)
          .limit(5)
        
        if (scheduledCount && scheduledCount > 0) {
          tables['scheduled_emails'] = {
            count: scheduledCount,
            sampleIds: scheduled?.map(s => `${s.recipient_email} (${s.status})`) || [],
            description: 'Scheduled and sent emails for campaigns'
          }
        }

        // 4. Email Events
        const { data: events, count: eventsCount } = await supabase
          .from('email_events')
          .select('event_id, event_type', { count: 'exact' })
          .in('campaign_id', campaignIds)
          .limit(5)
        
        if (eventsCount && eventsCount > 0) {
          tables['email_events'] = {
            count: eventsCount,
            sampleIds: events?.map(e => `${e.event_type} (${e.event_id.substring(0, 8)}...)`) || [],
            description: 'Email tracking events (opens, clicks, bounces, etc.)'
          }
        }

        // 5. Campaign Activities
        const { data: activities, count: activitiesCount } = await supabase
          .from('campaign_activities')
          .select('activity_id, activity_type', { count: 'exact' })
          .in('campaign_id', campaignIds)
          .limit(5)
        
        if (activitiesCount && activitiesCount > 0) {
          tables['campaign_activities'] = {
            count: activitiesCount,
            sampleIds: activities?.map(a => `${a.activity_type} (${a.activity_id.substring(0, 8)}...)`) || [],
            description: 'Campaign activity logs and analytics'
          }
        }
      }

      // 6. Product RFQs
      const { data: rfqs, count: rfqsCount } = await supabase
        .from('product_rfqs')
        .select('rfq_id, buyer_email', { count: 'exact' })
        .eq('product_id', id)
        .limit(5)
      
      if (rfqsCount && rfqsCount > 0) {
        tables['product_rfqs'] = {
          count: rfqsCount,
          sampleIds: rfqs?.map(r => `${r.buyer_email} (${r.rfq_id.substring(0, 8)}...)`) || [],
          description: 'Request for quotes from potential buyers'
        }
      }

      // 7. Product View Tracking
      const { data: tracking, count: trackingCount } = await supabase
        .from('product_view_tracking')
        .select('tracking_id', { count: 'exact' })
        .eq('product_id', id)
        .limit(5)
      
      if (trackingCount && trackingCount > 0) {
        tables['product_view_tracking'] = {
          count: trackingCount,
          sampleIds: tracking?.map(t => t.tracking_id.substring(0, 12) + '...') || [],
          description: 'Product page view analytics and tracking'
        }
      }

      // 8. Document Extractions (from organization)
      if (product) {
        const { data: docs, count: docsCount } = await supabase
          .from('document_extractions')
          .select('extraction_id, document_type', { count: 'exact' })
          .eq('organization_id', product.org_id)
          .limit(5)
        
        if (docsCount && docsCount > 0) {
          tables['document_extractions'] = {
            count: docsCount,
            sampleIds: docs?.map(d => `${d.document_type} (${d.extraction_id.substring(0, 8)}...)`) || [],
            description: 'Uploaded documents and extracted data'
          }
        }
      }

      // Calculate total records
      const totalRecords = 1 + Object.values(tables).reduce((sum, table) => sum + table.count, 0)

      return NextResponse.json({
        success: true,
        type: 'product',
        tables,
        totalRecords,
        // Legacy format for backward compatibility
        relatedData: {
          campaigns: tables['campaigns']?.count || 0,
          rfqs: tables['product_rfqs']?.count || 0,
          tracking: tables['product_view_tracking']?.count || 0,
          documents: tables['document_extractions']?.count || 0,
        },
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

