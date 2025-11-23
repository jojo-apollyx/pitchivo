/**
 * DELETE /api/smartlead/campaigns/[campaignId]/leads/[leadId]
 * Remove lead from campaign using lead_id directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; leadId: string }> }
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

    // Remove lead from Smartlead using lead_id
    console.log(`[Smartlead Leads API] Removing lead using lead_id:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      lead_id: leadId,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.removeLead(campaign.smartlead_campaign_id.toString(), leadId);

    if (!result.success) {
      console.error('[Smartlead Leads API] Failed to remove lead:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        lead_id: leadId,
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

