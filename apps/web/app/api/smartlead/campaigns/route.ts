/**
 * Smartlead Campaign API Routes
 * 
 * Handles campaign creation, management, and analytics via Smartlead API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

/**
 * POST /api/smartlead/campaigns
 * Create a new campaign in Smartlead
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { campaign_id, campaign_name } = body;

    if (!campaign_id || !campaign_name) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, campaign_name' },
        { status: 400 }
      );
    }

    // Create Smartlead client
    const smartlead = createSmartleadClient();

    // Create campaign in Smartlead
    const result = await smartlead.createCampaign({
      name: campaign_name,
      settings: {
        track_settings: {
          open_tracking: true,
          click_tracking: true,
        },
      },
    });

    if (!result.success || !result.data) {
      console.error('Failed to create Smartlead campaign:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to create campaign in Smartlead',
          details: result.error?.message 
        },
        { status: 500 }
      );
    }

    // Update campaign in database with Smartlead ID
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        smartlead_campaign_id: result.data.id,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign_id);

    if (updateError) {
      console.error('Failed to update campaign with Smartlead ID:', updateError);
      // Note: Campaign was created in Smartlead but database update failed
      // Consider implementing cleanup or retry logic
      return NextResponse.json(
        { error: 'Failed to update campaign with Smartlead ID' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      smartlead_campaign_id: result.data.id,
      campaign: result.data
    });

  } catch (error) {
    console.error('Error creating Smartlead campaign:', error);
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
 * GET /api/smartlead/campaigns?campaign_id=xxx
 * Get campaign details from Smartlead
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaign_id parameter' },
        { status: 400 }
      );
    }

    // Get campaign from database to retrieve Smartlead ID
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

    // Get campaign details from Smartlead
    const smartlead = createSmartleadClient();
    const result = await smartlead.getCampaign(campaign.smartlead_campaign_id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          error: 'Failed to get campaign from Smartlead',
          details: result.error?.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: result.data
    });

  } catch (error) {
    console.error('Error getting Smartlead campaign:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

