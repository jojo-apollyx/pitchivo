/**
 * Smartlead Campaign Pause API
 * 
 * POST /api/smartlead/campaigns/[campaignId]/pause
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

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

    // Pause campaign in Smartlead
    console.log(`[Smartlead Pause API] Pausing campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.pauseCampaign(campaign.smartlead_campaign_id);

    if (!result.success) {
      console.error('[Smartlead Pause API] Failed to pause campaign:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to pause campaign',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    // Update campaign status in database
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign paused successfully'
    });

  } catch (error) {
    console.error('[Smartlead Pause API] Unexpected error pausing campaign:', {
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

