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
  const { campaignId } = await params;
  
  console.log(`[Smartlead Sequences API] ============================================`);
  console.log(`[Smartlead Sequences API] 🚀 GET /api/smartlead/campaigns/${campaignId}/sequences`);
  console.log(`[Smartlead Sequences API] Campaign ID: ${campaignId}`);
  console.log(`[Smartlead Sequences API] ============================================`);

  try {
    const supabase = await createClient();
    
    // Check authentication
    console.log(`[Smartlead Sequences API] Checking authentication...`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[Smartlead Sequences API] ❌ Authentication failed:`, {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log(`[Smartlead Sequences API] ✅ Authenticated user: ${user.id}`);

    // Get campaign from database
    console.log(`[Smartlead Sequences API] Fetching campaign from database...`);
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .select('smartlead_campaign_id, org_id')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (dbError || !campaign) {
      console.error(`[Smartlead Sequences API] ❌ Campaign not found:`, {
        campaignId,
        dbError: dbError?.message,
        hasCampaign: !!campaign,
      });
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    console.log(`[Smartlead Sequences API] ✅ Campaign found:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      org_id: campaign.org_id,
    });

    if (!campaign.smartlead_campaign_id) {
      console.error(`[Smartlead Sequences API] ❌ Campaign not integrated with Smartlead`);
      return NextResponse.json(
        { error: 'Campaign not integrated with Smartlead' },
        { status: 400 }
      );
    }

    // Check if user is admin or has access to this organization
    console.log(`[Smartlead Sequences API] Checking authorization...`);
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error(`[Smartlead Sequences API] ❌ Failed to fetch user profile:`, profileError);
    }

    const isAdmin = profile?.is_pitchivo_admin || false;
    const hasOrgAccess = profile?.organization_id === campaign.org_id;

    console.log(`[Smartlead Sequences API] Authorization check:`, {
      user_id: user.id,
      isAdmin,
      user_org_id: profile?.organization_id,
      campaign_org_id: campaign.org_id,
      hasOrgAccess,
    });

    if (!isAdmin && !hasOrgAccess) {
      console.error(`[Smartlead Sequences API] ❌ Forbidden: User does not have access`, {
        user_id: user.id,
        isAdmin,
        user_org_id: profile?.organization_id,
        campaign_org_id: campaign.org_id,
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    console.log(`[Smartlead Sequences API] ✅ Authorization granted`);

    // Get sequences from Smartlead
    console.log(`[Smartlead Sequences API] 🚀 CALLING SMARTLEAD API: getCampaignSequences`);
    console.log(`[Smartlead Sequences API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);
    const smartlead = createSmartleadClient();
    const result = await smartlead.getCampaignSequences(campaign.smartlead_campaign_id);
    
    console.log(`[Smartlead Sequences API] Smartlead API response:`, {
      success: result.success,
      sequences_count: result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0,
      error: result.error,
    });

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
  const { campaignId } = await params;
  
  console.log(`[Smartlead Sequences API] ============================================`);
  console.log(`[Smartlead Sequences API] 🚀 POST /api/smartlead/campaigns/${campaignId}/sequences`);
  console.log(`[Smartlead Sequences API] Campaign ID: ${campaignId}`);
  console.log(`[Smartlead Sequences API] ============================================`);

  try {
    const supabase = await createClient();
    
    // Check authentication
    console.log(`[Smartlead Sequences API] Checking authentication...`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[Smartlead Sequences API] ❌ Authentication failed:`, {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log(`[Smartlead Sequences API] ✅ Authenticated user: ${user.id}`);

    const body = await request.json();
    const { sequences } = body;
    console.log(`[Smartlead Sequences API] Request body:`, {
      sequences_count: sequences?.length || 0,
      sequences: sequences?.map((s: any) => ({ seq_number: s.seq_number, has_subject: !!s.subject })),
    });

    if (!sequences || !Array.isArray(sequences)) {
      console.error(`[Smartlead Sequences API] ❌ Invalid request: sequences array is required`);
      return NextResponse.json(
        { error: 'Invalid request: sequences array is required' },
        { status: 400 }
      );
    }

    // Get campaign from database with product and org info
    console.log(`[Smartlead Sequences API] Fetching campaign from database...`);
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
      console.error(`[Smartlead Sequences API] ❌ Campaign not found:`, {
        campaignId,
        dbError: dbError?.message,
        hasCampaign: !!campaign,
      });
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    console.log(`[Smartlead Sequences API] ✅ Campaign found:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
      org_id: campaign.org_id,
      display_name: campaign.display_name,
    });

    if (!campaign.smartlead_campaign_id) {
      console.error(`[Smartlead Sequences API] ❌ Campaign not integrated with Smartlead`);
      return NextResponse.json(
        { error: 'Campaign not integrated with Smartlead' },
        { status: 400 }
      );
    }

    // Check if user is admin or has access to this organization
    console.log(`[Smartlead Sequences API] Checking authorization...`);
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin, organization_id, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error(`[Smartlead Sequences API] ❌ Failed to fetch user profile:`, profileError);
    }

    const isAdmin = profile?.is_pitchivo_admin || false;
    const hasOrgAccess = profile?.organization_id === campaign.org_id;

    console.log(`[Smartlead Sequences API] Authorization check:`, {
      user_id: user.id,
      isAdmin,
      user_org_id: profile?.organization_id,
      campaign_org_id: campaign.org_id,
      hasOrgAccess,
    });

    if (!isAdmin && !hasOrgAccess) {
      console.error(`[Smartlead Sequences API] ❌ Forbidden: User does not have access`, {
        user_id: user.id,
        isAdmin,
        user_org_id: profile?.organization_id,
        campaign_org_id: campaign.org_id,
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    console.log(`[Smartlead Sequences API] ✅ Authorization granted`);

    // Get user profile for campaign creator if available
    let userProfile = null;
    if (campaign.created_by) {
      const { data: creatorProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', campaign.created_by)
        .single();
      userProfile = creatorProfile;
    } else {
      // Fallback to current user profile
      userProfile = profile;
    }

    // Get placeholder context
    console.log(`[Smartlead Sequences API] Getting placeholder context...`);
    const placeholderContext = await getPlaceholderContext(campaign as any, userProfile || undefined);
    console.log(`[Smartlead Sequences API] Placeholder context:`, {
      hasProductUrl: !!placeholderContext.productUrl,
      productName: placeholderContext.productName,
      userOrgName: placeholderContext.userOrgName,
      userName: placeholderContext.userName,
      campaignName: placeholderContext.campaignName,
    });

    // Process sequences: replace placeholders before sending to Smartlead
    console.log(`[Smartlead Sequences API] Processing ${sequences.length} sequences...`);
    const processedSequences = sequences.map((seq: any) => {
      const { subject, emailBody } = replacePlaceholdersInSequence(
        seq.subject,
        seq.email_body,
        placeholderContext
      );

      // Smartlead API uses 'seq_variants' in POST but returns 'sequence_variants' in GET
      // Handle both field names for compatibility
      const variants = seq.seq_variants || seq.sequence_variants;
      
      return {
        id: seq.id, // Include when updating existing sequence
        seq_number: seq.seq_number,
        seq_delay_details: { delay_in_days: seq.delay_days || seq.seq_delay_details?.delay_in_days || 1 },
        subject: subject || undefined, // Empty string becomes undefined for same-thread follow-ups
        email_body: emailBody,
        seq_variants: variants?.map((variant: any) => ({
          subject: replacePlaceholders(variant.subject || '', placeholderContext),
          email_body: replacePlaceholders(variant.email_body || '', placeholderContext),
          variant_label: variant.variant_label,
        })),
      };
    });

    console.log(`[Smartlead Sequences API] 🚀 CALLING SMARTLEAD API: saveCampaignSequences`);
    console.log(`[Smartlead Sequences API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);
    console.log(`[Smartlead Sequences API] Sequences to save: ${processedSequences.length}`);
    processedSequences.forEach((seq, idx) => {
      console.log(`[Smartlead Sequences API]   Sequence ${idx + 1}: seq_number=${seq.seq_number}, delay=${seq.seq_delay_details?.delay_in_days} days, has_subject=${!!seq.subject}, variants_count=${seq.seq_variants?.length || 0}`);
      if (seq.seq_variants && seq.seq_variants.length > 0) {
        seq.seq_variants.forEach((v: any, vIdx: number) => {
          console.log(`[Smartlead Sequences API]     Variant ${vIdx + 1}: label=${v.variant_label}, has_subject=${!!v.subject}`);
        });
      }
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.saveCampaignSequences(
      campaign.smartlead_campaign_id,
      processedSequences
    );

    console.log(`[Smartlead Sequences API] Smartlead API response:`, {
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      console.error('[Smartlead Sequences API] ❌ FAILED to save sequences:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
        error_message: result.error?.message || result.error?.error,
        error_status_code: result.error?.status_code,
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

    console.log(`[Smartlead Sequences API] ✅ Successfully saved ${processedSequences.length} sequences to Smartlead`);
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

