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

    // Fetch campaign data to get email_count, duration_days, and start_date for schedule calculation
    const { data: campaignData, error: campaignFetchError } = await supabase
      .from('campaigns')
      .select('email_count, duration_days, start_date, timezone, sending_days, sending_hours, min_time_between_emails')
      .eq('campaign_id', campaign_id)
      .single();

    if (campaignFetchError) {
      console.error('Failed to fetch campaign data:', campaignFetchError);
      return NextResponse.json(
        { error: 'Failed to fetch campaign data' },
        { status: 500 }
      );
    }

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

    // Auto-configure campaign schedule based on duration_days
    try {
      const emailCount = campaignData?.email_count || 0;
      const durationDays = campaignData?.duration_days || 1;
      
      // Calculate max_new_leads_per_day: distribute emails evenly over duration
      // Round up to ensure all emails are sent within the duration
      const maxNewLeadsPerDay = durationDays > 0 
        ? Math.ceil(emailCount / durationDays)
        : emailCount; // If duration is 0 or invalid, use email count

      // Use campaign settings or defaults
      const timezone = campaignData?.timezone || 'America/New_York';
      const sendingDays = campaignData?.sending_days || [1, 2, 3, 4, 5]; // Mon-Fri default
      const sendingHours = campaignData?.sending_hours || { start: '09:00', end: '17:00' };
      const minTimeBetweenEmails = campaignData?.min_time_between_emails || 30;
      
      // Use start_date if provided, otherwise use current date/time
      // If start_date is in the past, use current date/time instead
      let scheduleStartTime: string | undefined;
      if (campaignData?.start_date) {
        const startDate = new Date(campaignData.start_date);
        const now = new Date();
        // Only use start_date if it's in the future
        if (startDate > now) {
          scheduleStartTime = startDate.toISOString();
        } else {
          // If start_date is in the past, use current date/time
          scheduleStartTime = now.toISOString();
        }
      }

      console.log(`[Smartlead Campaign API] Auto-configuring schedule:`, {
        email_count: emailCount,
        duration_days: durationDays,
        max_new_leads_per_day: maxNewLeadsPerDay,
        timezone,
        sending_days: sendingDays,
        sending_hours: sendingHours,
        min_time_between_emails: minTimeBetweenEmails,
        schedule_start_time: scheduleStartTime,
      });

      const scheduleResult = await smartlead.updateCampaignSchedule(
        result.data.id.toString(),
        {
          timezone,
          days_of_the_week: sendingDays,
          start_hour: typeof sendingHours === 'object' && 'start' in sendingHours 
            ? sendingHours.start 
            : '09:00',
          end_hour: typeof sendingHours === 'object' && 'end' in sendingHours 
            ? sendingHours.end 
            : '17:00',
          min_time_btw_emails: minTimeBetweenEmails,
          max_new_leads_per_day: maxNewLeadsPerDay,
          ...(scheduleStartTime && { schedule_start_time: scheduleStartTime }),
        }
      );

      if (scheduleResult.success) {
        console.log(`[Smartlead Campaign API] ✅ Successfully configured campaign schedule with max ${maxNewLeadsPerDay} leads/day`);
        
        // Update database with calculated max_leads_per_day
        await supabase
          .from('campaigns')
          .update({ 
            max_leads_per_day: maxNewLeadsPerDay,
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign_id);
      } else {
        console.error(`[Smartlead Campaign API] ⚠️ Failed to configure schedule:`, scheduleResult.error);
        // Don't fail campaign creation if schedule update fails
      }
    } catch (scheduleError) {
      // Don't fail campaign creation if schedule configuration fails
      console.error('[Smartlead Campaign API] Error configuring schedule:', scheduleError);
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
          .map((id: string) => allTemplates?.find(t => t.template_id === id))
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

    // Auto-add all connected email accounts to the campaign
    try {
      console.log(`[Smartlead Campaign API] Fetching all email accounts to auto-add to campaign`);
      
      const emailAccountsResult = await smartlead.getAllEmailAccounts();
      
      if (emailAccountsResult.success && emailAccountsResult.data && emailAccountsResult.data.length > 0) {
        // Extract email account IDs
        const emailAccountIds = emailAccountsResult.data
          .map((account: any) => account.id)
          .filter((id: any): id is number => typeof id === 'number');
        
        if (emailAccountIds.length > 0) {
          console.log(`[Smartlead Campaign API] Auto-adding ${emailAccountIds.length} email accounts to campaign`);
          
          const addAccountsResult = await smartlead.addEmailAccountsToCampaign(
            result.data.id.toString(),
            emailAccountIds
          );
          
          if (addAccountsResult.success) {
            console.log(`[Smartlead Campaign API] ✅ Successfully added ${emailAccountIds.length} email accounts to campaign`);
          } else {
            console.error(`[Smartlead Campaign API] ⚠️ Failed to add email accounts:`, addAccountsResult.error);
          }
        } else {
          console.log(`[Smartlead Campaign API] No valid email account IDs found`);
        }
      } else {
        console.log(`[Smartlead Campaign API] No email accounts found or failed to fetch:`, emailAccountsResult.error);
      }
    } catch (emailAccountError) {
      // Don't fail campaign creation if auto-adding email accounts fails
      console.error('[Smartlead Campaign API] Error auto-adding email accounts:', emailAccountError);
    }

    // Add 2 mock leads for testing
    try {
      console.log(`[Smartlead Campaign API] Adding 2 mock leads to campaign for testing`);
      
      const mockLeads = [
        {
          email: 'test.lead1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company 1',
          custom_fields: {
            Title: 'CEO',
            Location: 'New York, USA'
          }
        },
        {
          email: 'test.lead2@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          company_name: 'Test Company 2',
          custom_fields: {
            Title: 'Marketing Director',
            Location: 'San Francisco, USA'
          }
        }
      ];

      const addLeadsResult = await smartlead.addLeads(
        result.data.id.toString(),
        mockLeads
      );

      if (addLeadsResult.success) {
        console.log(`[Smartlead Campaign API] ✅ Successfully added 2 mock leads to campaign`);
      } else {
        console.error(`[Smartlead Campaign API] ⚠️ Failed to add mock leads:`, addLeadsResult.error);
        // Don't fail campaign creation if adding mock leads fails
      }
    } catch (mockLeadsError) {
      // Don't fail campaign creation if adding mock leads fails
      console.error('[Smartlead Campaign API] Error adding mock leads:', mockLeadsError);
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

