/**
 * Smartlead Campaign Leads API
 * 
 * GET /api/smartlead/campaigns/[campaignId]/leads - List leads
 * POST /api/smartlead/campaigns/[campaignId]/leads - Add lead(s)
 * DELETE /api/smartlead/campaigns/[campaignId]/leads?email=xxx - Remove lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

/**
 * GET - List all leads in campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { campaignId } = await params;

    // Get campaign from database
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .select('smartlead_campaign_id, org_id')
      .eq('campaign_id', campaignId)
      .single();

    if (dbError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (!campaign.smartlead_campaign_id) {
      return NextResponse.json(
        { error: 'Campaign not integrated with Smartlead' },
        { status: 400 }
      );
    }

    // Check user has access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', campaign.org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get leads from Smartlead
    const smartlead = createSmartleadClient();
    const result = await smartlead.listLeads(campaign.smartlead_campaign_id);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to get leads from Smartlead',
          details: result.error?.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: result.data || []
    });

  } catch (error) {
    console.error('Error getting Smartlead campaign leads:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Add lead(s) to campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { campaignId } = await params;
    const body = await request.json();
    const { leads } = body; // Array of lead objects or single lead object

    if (!leads) {
      return NextResponse.json(
        { error: 'Missing leads data' },
        { status: 400 }
      );
    }

    // Get campaign from database
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .select('smartlead_campaign_id, org_id')
      .eq('campaign_id', campaignId)
      .single();

    if (dbError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (!campaign.smartlead_campaign_id) {
      return NextResponse.json(
        { error: 'Campaign not integrated with Smartlead' },
        { status: 400 }
      );
    }

    // Check user has access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', campaign.org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Add leads to Smartlead
    const smartlead = createSmartleadClient();
    const leadsArray = Array.isArray(leads) ? leads : [leads];
    
    let result;
    if (leadsArray.length === 1) {
      result = await smartlead.addLead(campaign.smartlead_campaign_id, leadsArray[0]);
    } else {
      result = await smartlead.addLeads(campaign.smartlead_campaign_id, leadsArray);
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to add leads to Smartlead',
          details: result.error?.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${leadsArray.length} lead(s)`,
      data: result.data
    });

  } catch (error) {
    console.error('Error adding leads to Smartlead campaign:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove lead from campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { campaignId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    // Get campaign from database
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .select('smartlead_campaign_id, org_id')
      .eq('campaign_id', campaignId)
      .single();

    if (dbError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (!campaign.smartlead_campaign_id) {
      return NextResponse.json(
        { error: 'Campaign not integrated with Smartlead' },
        { status: 400 }
      );
    }

    // Check user has access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', campaign.org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Remove lead from Smartlead
    const smartlead = createSmartleadClient();
    const result = await smartlead.removeLead(campaign.smartlead_campaign_id, email);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to remove lead from Smartlead',
          details: result.error?.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead removed successfully'
    });

  } catch (error) {
    console.error('Error removing lead from Smartlead campaign:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

