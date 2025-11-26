import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Delete specific product or organization with cascade
 */
export async function DELETE(request: NextRequest) {
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

    let totalDeleted = 0
    const deletedTables: Record<string, number> = {}

    if (type === 'product') {
      console.log(`🗑️ Deleting product ${id} with cascade...`)

      // Get campaigns for this product
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('campaign_id')
        .eq('product_id', id)

      if (campaigns && campaigns.length > 0) {
        const campaignIds = campaigns.map((c) => c.campaign_id)

        // Count and delete campaign activities
        const { count: activitiesCount } = await supabase
          .from('campaign_activities')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
        await supabase.from('campaign_activities').delete().in('campaign_id', campaignIds)
        deletedTables['campaign_activities'] = activitiesCount || 0
        totalDeleted += activitiesCount || 0

        // Count and delete scheduled emails
        const { count: emailsCount } = await supabase
          .from('scheduled_emails')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
        await supabase.from('scheduled_emails').delete().in('campaign_id', campaignIds)
        deletedTables['scheduled_emails'] = emailsCount || 0
        totalDeleted += emailsCount || 0

        // Count and delete email templates
        const { count: templatesCount } = await supabase
          .from('brevo_email_templates')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
        await supabase.from('brevo_email_templates').delete().in('campaign_id', campaignIds)
        deletedTables['brevo_email_templates'] = templatesCount || 0
        totalDeleted += templatesCount || 0

        // Delete campaigns
        await supabase.from('campaigns').delete().eq('product_id', id)
        deletedTables['campaigns'] = campaigns.length
        totalDeleted += campaigns.length
      }

      // Count and delete RFQs
      const { count: rfqsCount } = await supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id)
      await supabase.from('product_rfqs').delete().eq('product_id', id)
      deletedTables['product_rfqs'] = rfqsCount || 0
      totalDeleted += rfqsCount || 0

      // Count and delete tracking
      const { count: trackingCount } = await supabase
        .from('product_view_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id)
      await supabase.from('product_view_tracking').delete().eq('product_id', id)
      deletedTables['product_view_tracking'] = trackingCount || 0
      totalDeleted += trackingCount || 0

      // Delete the product itself
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('product_id', id)

      if (productError) {
        throw new Error(`Failed to delete product: ${productError.message}`)
      }

      deletedTables['products'] = 1
      totalDeleted += 1

      console.log(`✅ Product deleted successfully. Total records: ${totalDeleted}`)

      return NextResponse.json({
        success: true,
        message: 'Product deleted successfully',
        deletedTables,
        totalDeleted,
      })
    } else if (type === 'organization') {
      console.log(`🗑️ Deleting organization ${id} with cascade...`)

      // Get all products for this organization
      const { data: products } = await supabase
        .from('products')
        .select('product_id')
        .eq('org_id', id)

      if (products && products.length > 0) {
        const productIds = products.map((p) => p.product_id)

        // Get all campaigns for these products
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('campaign_id')
          .in('product_id', productIds)

        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map((c) => c.campaign_id)

          // Delete campaign-related data
          await supabase.from('campaign_activities').delete().in('campaign_id', campaignIds)
          await supabase.from('scheduled_emails').delete().in('campaign_id', campaignIds)
          await supabase.from('brevo_email_templates').delete().in('campaign_id', campaignIds)

          // Delete campaigns
          const { error: campaignsError } = await supabase
            .from('campaigns')
            .delete()
            .in('product_id', productIds)
          if (!campaignsError) {
            deletedTables['campaigns'] = campaigns.length
            totalDeleted += campaigns.length
          }
        }

        // Count and delete RFQs
        const { count: rfqsCount } = await supabase
          .from('product_rfqs')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds)
        await supabase.from('product_rfqs').delete().in('product_id', productIds)
        deletedTables['product_rfqs'] = rfqsCount || 0
        totalDeleted += rfqsCount || 0

        // Count and delete tracking
        const { count: trackingCount } = await supabase
          .from('product_view_tracking')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds)
        await supabase.from('product_view_tracking').delete().in('product_id', productIds)
        deletedTables['product_view_tracking'] = trackingCount || 0
        totalDeleted += trackingCount || 0

        // Delete products
        await supabase.from('products').delete().eq('org_id', id)
        deletedTables['products'] = products.length
        totalDeleted += products.length
      }

      // Count and delete user profiles (note: this doesn't delete auth.users, just the profiles)
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
      await supabase.from('user_profiles').delete().eq('organization_id', id)
      deletedTables['user_profiles'] = usersCount || 0
      totalDeleted += usersCount || 0

      // Count and delete subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', id)
      await supabase.from('subscriptions').delete().eq('org_id', id)
      deletedTables['subscriptions'] = subscriptionsCount || 0
      totalDeleted += subscriptionsCount || 0

      // Count and delete document extractions
      const { count: documentsCount } = await supabase
        .from('document_extractions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
      await supabase.from('document_extractions').delete().eq('organization_id', id)
      deletedTables['document_extractions'] = documentsCount || 0
      totalDeleted += documentsCount || 0

      // Delete the organization itself
      const { error: orgError } = await supabase.from('organizations').delete().eq('id', id)

      if (orgError) {
        throw new Error(`Failed to delete organization: ${orgError.message}`)
      }

      deletedTables['organizations'] = 1
      totalDeleted += 1

      console.log(`✅ Organization deleted successfully. Total records: ${totalDeleted}`)

      return NextResponse.json({
        success: true,
        message: 'Organization deleted successfully',
        deletedTables,
        totalDeleted,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "product" or "organization"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Error deleting:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

