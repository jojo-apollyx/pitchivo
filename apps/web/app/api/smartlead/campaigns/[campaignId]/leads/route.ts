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
      .maybeSingle();

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

    // Check if user is admin or has access to this organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin, organization_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_pitchivo_admin || false;
    const hasOrgAccess = profile?.organization_id === campaign.org_id;

    if (!isAdmin && !hasOrgAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Get leads from Smartlead
    console.log(`[Smartlead Leads API] Getting leads for campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      offset,
      limit,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.listLeads(campaign.smartlead_campaign_id.toString(), {
      offset,
      limit,
    });

    if (!result.success) {
      console.error('[Smartlead Leads API] Failed to get leads:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to get leads from Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    // listLeads now returns { data: { data: [...], total_leads, offset, limit } }
    const leadsData = result.data?.data || [];
    const totalLeads = result.data?.total_leads || 0;

    return NextResponse.json({
      success: true,
      leads: leadsData,
      total_leads: totalLeads,
      offset: result.data?.offset || offset,
      limit: result.data?.limit || limit,
    });

  } catch (error) {
    console.error('[Smartlead Leads API] Unexpected error getting leads:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
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
      .maybeSingle();

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

    // Check if user is admin or has access to this organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin, organization_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_pitchivo_admin || false;
    const hasOrgAccess = profile?.organization_id === campaign.org_id;

    if (!isAdmin && !hasOrgAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Add leads to Smartlead
    console.log(`[Smartlead Leads API] Adding leads to campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      leads_count: Array.isArray(leads) ? leads.length : 1,
    });

    const smartlead = createSmartleadClient();
    const leadsArray = Array.isArray(leads) ? leads : [leads];
    
    // Transform lead data: move 'title' to custom_fields.Title
    const transformedLeads = leadsArray.map((lead: any) => {
      const { title, ...rest } = lead;
      const custom_fields = {
        ...(lead.custom_fields || {}),
        ...(title ? { Title: title } : {}),
      };
      return {
        ...rest,
        ...(Object.keys(custom_fields).length > 0 ? { custom_fields } : {}),
      };
    });
    
    console.log('[Smartlead Leads API] Transformed leads:', {
      original_count: leadsArray.length,
      transformed_count: transformedLeads.length,
      sample_lead: transformedLeads[0],
    });
    
    let result;
    if (transformedLeads.length === 1) {
      result = await smartlead.addLead(campaign.smartlead_campaign_id.toString(), transformedLeads[0]);
    } else {
      result = await smartlead.addLeads(campaign.smartlead_campaign_id.toString(), transformedLeads);
    }

    if (!result.success) {
      console.error('[Smartlead Leads API] Failed to add leads:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        leads_count: transformedLeads.length,
        transformed_lead_sample: transformedLeads[0],
      });
      return NextResponse.json(
        { 
          error: 'Failed to add leads to Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${transformedLeads.length} lead(s)`,
      data: result.data
    });

  } catch (error) {
    console.error('[Smartlead Leads API] Unexpected error adding leads:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
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
      .maybeSingle();

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

    // Check if user is admin or has access to this organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin, organization_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_pitchivo_admin || false;
    const hasOrgAccess = profile?.organization_id === campaign.org_id;

    if (!isAdmin && !hasOrgAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Remove lead from Smartlead
    console.log(`[Smartlead Leads API] Removing lead from campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      email,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.removeLead(campaign.smartlead_campaign_id, email);

    if (!result.success) {
      console.error('[Smartlead Leads API] Failed to remove lead:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        email,
      });
      return NextResponse.json(
        { 
          error: 'Failed to remove lead from Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead removed successfully'
    });

  } catch (error) {
    console.error('[Smartlead Leads API] Unexpected error removing lead:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

