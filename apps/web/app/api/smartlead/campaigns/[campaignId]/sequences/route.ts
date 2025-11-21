/**
 * Smartlead Campaign Sequences API
 * 
 * GET /api/smartlead/campaigns/[campaignId]/sequences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

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

    // Get sequences from Smartlead
    console.log(`[Smartlead Sequences API] Getting sequences for campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.getCampaignSequences(campaign.smartlead_campaign_id);

    if (!result.success) {
      console.error('[Smartlead Sequences API] Failed to get sequences:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to get campaign sequences from Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sequences: result.data || []
    });

  } catch (error) {
    console.error('[Smartlead Sequences API] Unexpected error getting sequences:', {
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

