/**
 * Smartlead Campaign API Routes
 * 
 * Handles campaign creation, management, and analytics via Smartlead API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';
import { normalizeSmartleadStatus } from '@/lib/smartlead/utils';

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
    console.log(`[Smartlead Campaign API] ============================================`);
    console.log(`[Smartlead Campaign API] 🚀 CALLING SMARTLEAD API: createCampaign`);
    console.log(`[Smartlead Campaign API] Campaign ID (local): ${campaign_id}`);
    console.log(`[Smartlead Campaign API] Campaign Name: ${campaign_name}`);
    console.log(`[Smartlead Campaign API] User: ${user.id}`);
    console.log(`[Smartlead Campaign API] ============================================`);

    const result = await smartlead.createCampaign({
      name: campaign_name,
      // client_id is optional - can be set later if needed
    });

    console.log(`[Smartlead Campaign API] Smartlead API response received:`, {
      success: result.success,
      smartlead_campaign_id: result.data?.id,
      error: result.error,
    });

    if (!result.success || !result.data) {
      console.error('[Smartlead Campaign API] Failed to create campaign:', {
        error: result.error,
        campaign_id,
        campaign_name,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create campaign in Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    console.log('[Smartlead Campaign API] Campaign created successfully:', {
      campaign_id,
      smartlead_campaign_id: result.data.id,
    });

    // Fetch the campaign from Smartlead to get the actual status
    // (The create response might not include all fields)
    const campaignResult = await smartlead.getCampaign(result.data.id.toString());
    
    // Use Smartlead status directly (convert to lowercase for database)
    const smartleadStatus = campaignResult.success && campaignResult.data?.status 
      ? campaignResult.data.status 
      : result.data.status || 'DRAFTED';
    const normalizedStatus = normalizeSmartleadStatus(smartleadStatus);

    console.log('[Smartlead Campaign API] Syncing status:', {
      smartlead_status: smartleadStatus,
      normalized_status: normalizedStatus,
    });

    // Update campaign in database with Smartlead ID and synced status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        smartlead_campaign_id: result.data.id,
        status: normalizedStatus,
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

    // Auto-populate sequences from admin's default sequences if configured
    try {
      // Get admin's default sequence configuration
      const { data: defaultConfig } = await supabase
        .from('admin_default_sequences')
        .select('template_ids')
        .single();

      const templateIds = defaultConfig?.template_ids || [];

      if (templateIds.length > 0) {
        console.log(`[Smartlead Campaign API] Auto-populating ${templateIds.length} default sequences`);
        
        // Get template sequences in order
        const { data: allTemplates } = await supabase
          .from('global_sequence_templates')
          .select('*')
          .in('template_id', templateIds)
          .eq('is_active', true);

        // Sort templates by the order in template_ids
        const templateSequences = templateIds
          .map(id => allTemplates?.find(t => t.template_id === id))
          .filter(Boolean);

        if (templateSequences && templateSequences.length > 0) {
          // Get placeholder context for replacement
          const { data: campaignData } = await supabase
            .from('campaigns')
            .select(`
              product_id,
              org_id,
              display_name,
              campaign_name,
              created_by
            `)
            .eq('campaign_id', campaign_id)
            .single();

          // Get product and org data
          let productName: string | undefined;
          let orgName: string | undefined;
          
          if (campaignData?.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('product_name, org_id, organizations:org_id(name)')
              .eq('product_id', campaignData.product_id)
              .single();
            
            productName = product?.product_name;
            orgName = (product?.organizations as any)?.name;
          }

          // Get user profile
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', campaignData?.created_by)
            .single();

          // Import placeholder utilities
          const { replacePlaceholdersInSequence } = await import('@/lib/smartlead/placeholders');
          
          // Build placeholder context
          const productUrl = campaignData?.product_id
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com'}/products/${campaignData.product_id}`
            : undefined;
          
          const placeholderContext = {
            productUrl,
            productName,
            userOrgName: orgName,
            userName: userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Team',
            campaignName: campaignData?.display_name || campaignData?.campaign_name,
          };

          // Prepare sequences for Smartlead
          const sequencesForSmartlead = templateSequences.map((template: any) => {
            const { subject, emailBody } = replacePlaceholdersInSequence(
              template.subject || '',
              template.email_body,
              placeholderContext
            );

            return {
              seq_number: template.seq_number,
              seq_delay_details: { delay_in_days: template.delay_days || 1 },
              subject: subject || undefined,
              email_body: emailBody,
            };
          });

          // Save sequences to Smartlead
          const sequencesResult = await smartlead.saveCampaignSequences(
            result.data.id.toString(),
            sequencesForSmartlead
          );

          if (sequencesResult.success) {
            console.log(`[Smartlead Campaign API] ✅ Auto-populated ${sequencesForSmartlead.length} sequences from template`);
          } else {
            console.error(`[Smartlead Campaign API] ⚠️ Failed to auto-populate sequences:`, sequencesResult.error);
          }
        }
      }
    } catch (autoPopulateError) {
      // Don't fail campaign creation if auto-populate fails
      console.error('[Smartlead Campaign API] Error auto-populating sequences:', autoPopulateError);
    }

    return NextResponse.json({
      success: true,
      smartlead_campaign_id: result.data.id,
      campaign: result.data
    });

  } catch (error) {
    console.error('[Smartlead Campaign API] Unexpected error creating campaign:', {
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
    console.log(`[Smartlead Campaign API] Getting campaign:`, {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
    });

    const smartlead = createSmartleadClient();
    const result = await smartlead.getCampaign(campaign.smartlead_campaign_id);

    if (!result.success || !result.data) {
      console.error('[Smartlead Campaign API] Failed to get campaign:', {
        error: result.error,
        campaign_id: campaignId,
        smartlead_campaign_id: campaign.smartlead_campaign_id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to get campaign from Smartlead',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    console.log('[Smartlead Campaign API] Campaign retrieved successfully:', {
      campaign_id: campaignId,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
    });

    return NextResponse.json({
      success: true,
      campaign: result.data
    });

  } catch (error) {
    console.error('[Smartlead Campaign API] Unexpected error getting campaign:', {
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

