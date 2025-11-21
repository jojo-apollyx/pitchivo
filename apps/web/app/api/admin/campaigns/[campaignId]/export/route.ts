/**
 * Export Campaign Data API
 * GET /api/admin/campaigns/[campaignId]/export
 * 
 * Exports comprehensive campaign data including leads, analytics, and campaign info
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        organizations(name),
        products(product_name)
      `)
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if user is admin or has access to this organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin, organization_id')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_pitchivo_admin || false
    const hasOrgAccess = profile?.organization_id === campaign.org_id

    if (!isAdmin && !hasOrgAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Export leads from Smartlead if available, otherwise from database
    let csvData = ''
    
    if (campaign.smartlead_campaign_id) {
      // Export from Smartlead
      const smartlead = createSmartleadClient()
      const result = await smartlead.exportCampaignLeads(campaign.smartlead_campaign_id.toString())

      if (!result.success || !result.data) {
        console.error('[Export Campaign API] Smartlead export failed:', result.error)
        // Fall back to database export
        const { data: leads, error } = await supabase
          .from('campaign_leads')
          .select('*')
          .eq('campaign_id', campaignId)

        if (error) throw error

        // Generate CSV from database
        const headers = ['Email', 'Name', 'Title', 'Company', 'Status', 'Last Contacted', 'Opens', 'Clicks', 'Replies']
        const rows = (leads || []).map((lead: any) => [
          lead.email,
          lead.name || '',
          lead.title || '',
          lead.company || '',
          lead.status,
          lead.last_contacted || '',
          lead.open_count || 0,
          lead.click_count || 0,
          lead.reply_count || 0,
        ])
        
        csvData = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      } else {
        csvData = result.data
      }
    } else {
      // Export from our database
      const { data: leads, error } = await supabase
        .from('campaign_leads')
        .select('*')
        .eq('campaign_id', campaignId)

      if (error) throw error

      // Generate CSV
      const headers = ['Email', 'Name', 'Title', 'Company', 'Status', 'Last Contacted', 'Opens', 'Clicks', 'Replies']
      const rows = (leads || []).map((lead: any) => [
        lead.email,
        lead.name || '',
        lead.title || '',
        lead.company || '',
        lead.status,
        lead.last_contacted || '',
        lead.open_count || 0,
        lead.click_count || 0,
        lead.reply_count || 0,
      ])
      
      csvData = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    }
    
    const displayName = campaign.display_name || campaign.campaign_name || 'campaign'
    // Sanitize filename - remove special characters that aren't allowed in filenames
    const sanitizedName = displayName.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50)
    const filename = `campaign-${sanitizedName}-${new Date().toISOString().split('T')[0]}.csv`
    
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('[Export Campaign API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export campaign data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

