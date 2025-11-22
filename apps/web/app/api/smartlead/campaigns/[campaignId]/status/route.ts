/**
 * Smartlead Campaign Status API
 * 
 * POST /api/smartlead/campaigns/[campaignId]/status
 * Update campaign status in Smartlead (PAUSED, START, STOPPED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';
import { normalizeSmartleadStatus } from '@/lib/smartlead/utils';

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
    const { status } = body;

    // Validate status
    const validStatuses = ['PAUSED', 'START', 'STOPPED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get campaign from database
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .select('campaign_id, smartlead_campaign_id, org_id, status')
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

    // Check user has access to this organization
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

    // Update campaign status in Smartlead
    console.log(`[Smartlead Status API] ============================================`);
    console.log(`[Smartlead Status API] Updating campaign status in Smartlead`);
    console.log(`[Smartlead Status API] Campaign ID (local): ${campaignId}`);
    console.log(`[Smartlead Status API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);
    console.log(`[Smartlead Status API] Current status (DB): ${campaign.status}`);
    console.log(`[Smartlead Status API] New status (Smartlead): ${status}`);
    console.log(`[Smartlead Status API] User: ${user.id}`);
    console.log(`[Smartlead Status API] ============================================`);

    const smartlead = createSmartleadClient();
    let result;

    // Use appropriate method based on status
    console.log(`[Smartlead Status API] Calling Smartlead API method for status: ${status}`);
    if (status === 'PAUSED') {
      console.log(`[Smartlead Status API] Calling pauseCampaign(${campaign.smartlead_campaign_id})`);
      result = await smartlead.pauseCampaign(campaign.smartlead_campaign_id.toString());
    } else if (status === 'START') {
      console.log(`[Smartlead Status API] Calling resumeCampaign(${campaign.smartlead_campaign_id})`);
      result = await smartlead.resumeCampaign(campaign.smartlead_campaign_id.toString());
    } else if (status === 'STOPPED') {
      console.log(`[Smartlead Status API] Calling stopCampaign(${campaign.smartlead_campaign_id})`);
      result = await smartlead.stopCampaign(campaign.smartlead_campaign_id.toString());
    } else {
      console.error(`[Smartlead Status API] Unsupported status: ${status}`);
      return NextResponse.json(
        { error: `Unsupported status: ${status}` },
        { status: 400 }
      );
    }

    console.log(`[Smartlead Status API] Smartlead API response:`, {
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      console.error('[Smartlead Status API] ============================================');
      console.error('[Smartlead Status API] ❌ FAILED to update campaign status in Smartlead');
      console.error('[Smartlead Status API] Campaign ID (local):', campaignId);
      console.error('[Smartlead Status API] Smartlead Campaign ID:', campaign.smartlead_campaign_id);
      console.error('[Smartlead Status API] Requested status:', status);
      console.error('[Smartlead Status API] Error:', result.error);
      console.error('[Smartlead Status API] ============================================');
      return NextResponse.json(
        { 
          error: 'Failed to update campaign status in Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    console.log(`[Smartlead Status API] ✅ Successfully updated campaign status in Smartlead`);
    console.log(`[Smartlead Status API] Status changed to: ${status}`);

    // Map Smartlead status to our database status
    const dbStatus = status === 'START' ? 'active' : status.toLowerCase(); // PAUSED -> paused, STOPPED -> stopped

    // Update campaign status in database
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        status: dbStatus,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign status in database:', updateError);
      // Note: Status was updated in Smartlead but database update failed
      // Return success but log the error
    }

    return NextResponse.json({
      success: true,
      message: `Campaign status updated to ${status}`,
      status: dbStatus,
    });

  } catch (error) {
    console.error('[Smartlead Status API] Unexpected error updating campaign status:', {
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

