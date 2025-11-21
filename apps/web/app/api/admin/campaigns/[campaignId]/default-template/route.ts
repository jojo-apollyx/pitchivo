/**
 * Default Template API Route
 * 
 * POST /api/admin/campaigns/[campaignId]/default-template
 * Update the default template name for a campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient();
    const { campaignId } = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { default_template_name } = body;

    // Check if user is admin or has access to this campaign's organization
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('org_id')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check authorization
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

    // Update the default template name
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        default_template_name: default_template_name || null,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId);

    if (updateError) {
      console.error('[Default Template API] Error updating default template:', updateError);
      return NextResponse.json(
        { error: 'Failed to update default template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      default_template_name: default_template_name || null,
    });

  } catch (error) {
    console.error('[Default Template API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

