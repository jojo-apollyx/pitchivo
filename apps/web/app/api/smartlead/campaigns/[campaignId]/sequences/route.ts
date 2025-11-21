/**
 * Smartlead Campaign Sequences API
 * 
 * GET /api/smartlead/campaigns/[campaignId]/sequences
 * POST /api/smartlead/campaigns/[campaignId]/sequences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';
import { replacePlaceholdersInSequence, getPlaceholderContext, replacePlaceholders } from '@/lib/smartlead/placeholders';

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
    const { sequences } = body;

    if (!sequences || !Array.isArray(sequences)) {
      return NextResponse.json(
        { error: 'Invalid request: sequences array is required' },
        { status: 400 }
      );
    }

    // Get campaign from database with product and org info
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .select(`
        smartlead_campaign_id,
        org_id,
        product_id,
        display_name,
        campaign_name,
        created_by,
        products:product_id (
          product_id,
          product_name,
          organizations:org_id (
            name
          )
        )
      `)
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
      .select('is_pitchivo_admin, organization_id, full_name, first_name, last_name, email')
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

    // Get user profile for campaign creator if available
    let userProfile = null;
    if (campaign.created_by) {
      const { data: creatorProfile } = await supabase
        .from('user_profiles')
        .select('full_name, first_name, last_name, email')
        .eq('id', campaign.created_by)
        .single();
      userProfile = creatorProfile;
    } else {
      // Fallback to current user profile
      userProfile = profile;
    }

    // Get placeholder context
    const placeholderContext = await getPlaceholderContext(campaign as any, userProfile || undefined);

    // Process sequences: replace placeholders before sending to Smartlead
    const processedSequences = sequences.map((seq: any) => {
      const { subject, emailBody } = replacePlaceholdersInSequence(
        seq.subject,
        seq.email_body,
        placeholderContext
      );

      return {
        id: seq.id, // Include when updating existing sequence
        seq_number: seq.seq_number,
        seq_delay_details: { delay_in_days: seq.delay_days || seq.seq_delay_details?.delay_in_days || 1 },
        subject: subject || undefined, // Empty string becomes undefined for same-thread follow-ups
        email_body: emailBody,
        seq_variants: seq.seq_variants?.map((variant: any) => ({
          subject: replacePlaceholders(variant.subject || '', placeholderContext),
          email_body: replacePlaceholders(variant.email_body || '', placeholderContext),
          variant_label: variant.variant_label,
        })),
      };
    });

    console.log(`[Smartlead Sequences API] Saving sequences for campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      sequences_count: processedSequences.length,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.saveCampaignSequences(
      campaign.smartlead_campaign_id,
      processedSequences
    );

    if (!result.success) {
      console.error('[Smartlead Sequences API] Failed to save sequences:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to save campaign sequences to Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sequences saved successfully',
    });

  } catch (error) {
    console.error('[Smartlead Sequences API] Unexpected error saving sequences:', {
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

