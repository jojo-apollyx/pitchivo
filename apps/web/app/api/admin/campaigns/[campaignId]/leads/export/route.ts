/**
 * Export Leads API
 * GET /api/admin/campaigns/[campaignId]/leads/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get campaign to check Smartlead sync
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('smartlead_campaign_id, campaign_name, display_name')
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.smartlead_campaign_id) {
      // Export from Smartlead directly
      const response = await fetch(
        `https://server.smartlead.ai/api/v1/campaigns/${campaign.smartlead_campaign_id}/leads-export?api_key=${process.env.SMARTLEAD_API_KEY}`
      )

      if (!response.ok) {
        throw new Error('Failed to export from Smartlead')
      }

      const csvData = await response.text()
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-${campaign.display_name || campaign.campaign_name}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
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
      
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-${campaign.display_name || campaign.campaign_name}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

  } catch (error) {
    console.error('[Export Leads API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export leads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

