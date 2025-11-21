/**
 * Smartlead Campaign Analytics API
 * 
 * GET /api/smartlead/campaigns/[campaignId]/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  
  console.log(`[Smartlead Analytics API] ============================================`);
  console.log(`[Smartlead Analytics API] 🚀 GET /api/smartlead/campaigns/${campaignId}/analytics`);
  console.log(`[Smartlead Analytics API] Campaign ID: ${campaignId}`);
  console.log(`[Smartlead Analytics API] ============================================`);

  try {
    const supabase = await createClient();
    
    // Check authentication
    console.log(`[Smartlead Analytics API] Checking authentication...`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[Smartlead Analytics API] ❌ Authentication failed:`, {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log(`[Smartlead Analytics API] ✅ Authenticated user: ${user.id}`);

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

    // Get analytics from Smartlead
    console.log(`[Smartlead Analytics API] 🚀 CALLING SMARTLEAD API: getCampaignAnalytics`);
    console.log(`[Smartlead Analytics API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);

    const smartlead = createSmartleadClient();
    const result = await smartlead.getCampaignAnalytics(campaign.smartlead_campaign_id);
    
    console.log(`[Smartlead Analytics API] Smartlead API response:`, {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
    });

    if (!result.success || !result.data) {
      console.error('[Smartlead Analytics API] Failed to get analytics:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to get campaign analytics from Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analytics: result.data
    });

  } catch (error) {
    console.error('[Smartlead Analytics API] Unexpected error getting analytics:', {
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

