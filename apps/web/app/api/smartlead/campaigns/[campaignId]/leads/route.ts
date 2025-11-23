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
  const { campaignId } = await params;
  
  console.log(`[Smartlead Leads API] ============================================`);
  console.log(`[Smartlead Leads API] 🚀 GET /api/smartlead/campaigns/${campaignId}/leads`);
  console.log(`[Smartlead Leads API] Campaign ID: ${campaignId}`);
  console.log(`[Smartlead Leads API] ============================================`);

  try {
    const supabase = await createClient();
    
    // Check authentication
    console.log(`[Smartlead Leads API] Checking authentication...`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[Smartlead Leads API] ❌ Authentication failed:`, {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log(`[Smartlead Leads API] ✅ Authenticated user: ${user.id}`);

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
        { error: 'Campaign not configured' },
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
    console.log(`[Smartlead Leads API] 🚀 CALLING SMARTLEAD API: listLeads`);
    console.log(`[Smartlead Leads API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);
    console.log(`[Smartlead Leads API] Pagination: offset=${offset}, limit=${limit}`);

    const smartlead = createSmartleadClient();
    const result = await smartlead.listLeads(campaign.smartlead_campaign_id.toString(), {
      offset,
      limit,
    });
    
    console.log(`[Smartlead Leads API] Smartlead API response:`, {
      success: result.success,
      leads_count: result.data?.data?.length || 0,
      total_leads: result.data?.total_leads,
      error: result.error,
    });

    if (!result.success) {
      console.error('[Smartlead Leads API] Failed to get leads:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to get leads',
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
        { error: 'Campaign not configured' },
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
    console.log(`[Smartlead Leads API] 🚀 CALLING SMARTLEAD API: addLead/addLeads`);
    console.log(`[Smartlead Leads API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);
    console.log(`[Smartlead Leads API] Leads to add: ${Array.isArray(leads) ? leads.length : 1}`);

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
      sample_lead: transformedLeads[0] ? {
        email: transformedLeads[0].email,
        first_name: transformedLeads[0].first_name,
        company_name: transformedLeads[0].company_name,
        has_custom_fields: !!transformedLeads[0].custom_fields,
      } : null,
    });
    
    let result;
    if (transformedLeads.length === 1) {
      console.log(`[Smartlead Leads API] Using addLead (single lead)`);
      result = await smartlead.addLead(campaign.smartlead_campaign_id.toString(), transformedLeads[0]);
    } else {
      console.log(`[Smartlead Leads API] Using addLeads (bulk: ${transformedLeads.length} leads)`);
      result = await smartlead.addLeads(campaign.smartlead_campaign_id.toString(), transformedLeads);
    }
    
    console.log(`[Smartlead Leads API] Smartlead API response:`, {
      success: result.success,
      error: result.error,
    });

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
          error: 'Failed to add leads',
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
 * Supports two formats:
 * 1. DELETE /api/smartlead/campaigns/[campaignId]/leads/[leadId] - Direct lead_id
 * 2. DELETE /api/smartlead/campaigns/[campaignId]/leads?email=xxx - Email lookup (fallback)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; leadId?: string }> }
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

    const { campaignId, leadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Must have either leadId in path or email in query
    if (!leadId && !email) {
      return NextResponse.json(
        { error: 'Missing lead_id in path or email parameter' },
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
        { error: 'Campaign not configured' },
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

    const smartlead = createSmartleadClient();
    let smartleadLeadId: string | null = null;

    // If we have leadId in path, use it directly
    if (leadId) {
      smartleadLeadId = leadId;
      console.log(`[Smartlead Leads API] Removing lead using lead_id:`, {
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        lead_id: leadId,
      });
    } else if (email) {
      // Need to look up lead_id from email (fallback)
      console.log(`[Smartlead Leads API] Looking up lead_id for email:`, {
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        email,
      });

      // List leads and find the one with matching email
      const listResult = await smartlead.listLeads(campaign.smartlead_campaign_id.toString(), {
        offset: 0,
        limit: 1000, // Get enough leads to find the match
      });

      if (!listResult.success || !listResult.data?.data) {
        console.error('[Smartlead Leads API] Failed to list leads for lookup:', listResult.error);
        return NextResponse.json(
          { 
            error: 'Failed to lookup lead',
            details: listResult.error?.message || listResult.error?.error || 'Unknown error',
          },
          { status: 500 }
        );
      }

      // Find lead with matching email
      const leads = listResult.data.data;
      const matchingLead = leads.find((item: any) => {
        const lead = item.lead || item;
        return lead.email?.toLowerCase() === email.toLowerCase();
      });

      if (!matchingLead) {
        return NextResponse.json(
          { error: 'Lead not found in campaign' },
          { status: 404 }
        );
      }

      const lead = matchingLead.lead || matchingLead;
      smartleadLeadId = lead.id?.toString() || matchingLead.campaign_lead_map_id?.toString();

      if (!smartleadLeadId) {
        return NextResponse.json(
          { error: 'Could not determine lead_id from Smartlead response' },
          { status: 500 }
        );
      }

      console.log(`[Smartlead Leads API] Found lead_id ${smartleadLeadId} for email ${email}`);
    }

    // Remove lead from Smartlead using the lead_id
    if (!smartleadLeadId) {
      return NextResponse.json(
        { error: 'Could not determine lead_id' },
        { status: 400 }
      );
    }

    console.log(`[Smartlead Leads API] Removing lead from campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      smartlead_lead_id: smartleadLeadId,
      email: email || 'N/A',
    });

    const result = await smartlead.removeLead(campaign.smartlead_campaign_id.toString(), smartleadLeadId);

    if (!result.success) {
      console.error('[Smartlead Leads API] Failed to remove lead:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        smartlead_lead_id: smartleadLeadId,
        email: email || 'N/A',
      });
      return NextResponse.json(
        { 
          error: 'Failed to remove lead',
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

