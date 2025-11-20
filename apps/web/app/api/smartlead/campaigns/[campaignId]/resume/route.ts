/**
 * Smartlead Campaign Resume API
 * 
 * POST /api/smartlead/campaigns/[campaignId]/resume
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
        { error: 'Campaign not integrated with Smartlead' },
        { status: 400 }
      );
    }

    // Check user has access to this organization
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

    // Resume campaign in Smartlead
    const smartlead = createSmartleadClient();
    const result = await smartlead.resumeCampaign(campaign.smartlead_campaign_id);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to resume campaign in Smartlead',
          details: result.error?.message 
        },
        { status: 500 }
      );
    }

    // Update campaign status in database
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign resumed successfully'
    });

  } catch (error) {
    console.error('Error resuming Smartlead campaign:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

