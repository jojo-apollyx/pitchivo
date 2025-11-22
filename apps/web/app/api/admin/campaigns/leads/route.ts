import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { createSmartleadClient } from '@/lib/smartlead'

// Create admin Supabase client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET: Fetch leads for a campaign
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status') // active, bounced, unsubscribed, invalid

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId parameter' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('campaign_leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('added_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching campaign leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaign leads', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ leads: data || [] })
  } catch (error: any) {
    console.error('Error in GET campaign leads:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Add leads to a campaign (batch)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { campaignId, leads } = body

    console.log(`[Admin Campaign Leads API] ============================================`);
    console.log(`[Admin Campaign Leads API] 🚀 POST /api/admin/campaigns/leads`);
    console.log(`[Admin Campaign Leads API] Campaign ID: ${campaignId}`);
    console.log(`[Admin Campaign Leads API] Leads count: ${leads?.length || 0}`);
    console.log(`[Admin Campaign Leads API] ============================================`);

    if (!campaignId || !leads || !Array.isArray(leads) || leads.length === 0) {
      console.error(`[Admin Campaign Leads API] ❌ Validation failed:`, {
        hasCampaignId: !!campaignId,
        hasLeads: !!leads,
        isArray: Array.isArray(leads),
        leadsLength: leads?.length || 0,
      });
      return NextResponse.json(
        { error: 'Missing required fields or invalid leads array' },
        { status: 400 }
      )
    }

    // Validate each lead object
    for (const lead of leads) {
      if (!lead.email || !lead.name || !lead.company) {
        console.error(`[Admin Campaign Leads API] ❌ Invalid lead:`, {
          hasEmail: !!lead.email,
          hasName: !!lead.name,
          hasCompany: !!lead.company,
          lead,
        });
        return NextResponse.json(
          { error: 'Each lead must have email, name, and company' },
          { status: 400 }
        )
      }
    }

    // Get campaign to retrieve smartlead_campaign_id
    console.log(`[Admin Campaign Leads API] Fetching campaign from database...`);
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('smartlead_campaign_id, campaign_name')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (campaignError || !campaign) {
      console.error(`[Admin Campaign Leads API] ❌ Campaign not found:`, {
        campaignId,
        error: campaignError?.message,
      });
      return NextResponse.json(
        { error: 'Campaign not found', details: campaignError?.message },
        { status: 404 }
      );
    }

    console.log(`[Admin Campaign Leads API] ✅ Campaign found:`, {
      campaign_id: campaignId,
      campaign_name: campaign.campaign_name,
      smartlead_campaign_id: campaign.smartlead_campaign_id,
    });

    // Prepare batch insert data for database
    const leadsData = leads.map((lead: any) => ({
      campaign_id: campaignId,
      email: lead.email,
      name: lead.name,
      title: lead.title || null,
      company: lead.company,
      country: lead.country || null,
      industry: lead.industry || null,
      phone: lead.phone || null,
      linkedin_url: lead.linkedin_url || null,
      status: lead.status || 'active',
      notes: lead.notes || null,
      added_at: lead.added_at || new Date().toISOString(),
      last_contacted: lead.last_contacted || null
    }))

    // Save to database first
    console.log(`[Admin Campaign Leads API] Saving ${leadsData.length} leads to database...`);
    const { data: dbLeads, error: dbError } = await supabaseAdmin
      .from('campaign_leads')
      .upsert(leadsData, { 
        onConflict: 'campaign_id,email',
        ignoreDuplicates: false 
      })
      .select()

    if (dbError) {
      console.error(`[Admin Campaign Leads API] ❌ Database error:`, dbError);
      return NextResponse.json(
        { error: 'Failed to create campaign leads', details: dbError.message },
        { status: 500 }
      )
    }

    console.log(`[Admin Campaign Leads API] ✅ Saved ${dbLeads.length} leads to database`);

    // If campaign has smartlead_campaign_id, also add leads to Smartlead
    if (campaign.smartlead_campaign_id) {
      console.log(`[Admin Campaign Leads API] 🚀 Adding leads to Smartlead...`);
      console.log(`[Admin Campaign Leads API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);

      try {
        const smartlead = createSmartleadClient();
        
        // Transform leads from admin format to Smartlead format
        // Admin format: { name, email, company, title, ... }
        // Smartlead format: { first_name, last_name, email, company_name, custom_fields: { Title: ... }, ... }
        const smartleadLeads = leads.map((lead: any) => {
          // Split name into first_name and last_name
          const nameParts = (lead.name || '').trim().split(/\s+/);
          const first_name = nameParts[0] || '';
          const last_name = nameParts.slice(1).join(' ') || '';

          const transformedLead: any = {
            first_name,
            last_name,
            email: lead.email,
            company_name: lead.company || '',
          };

          // Add optional fields
          if (lead.phone) transformedLead.phone_number = lead.phone;
          if (lead.linkedin_url) transformedLead.linkedin_profile = lead.linkedin_url;
          if (lead.country) transformedLead.location = lead.country;
          if (lead.website) transformedLead.website = lead.website;
          if (lead.company_url) transformedLead.company_url = lead.company_url;

          // Add custom fields (including title)
          const custom_fields: Record<string, any> = {};
          if (lead.title) custom_fields.Title = lead.title;
          // Add any other custom fields if present
          if (lead.custom_fields && typeof lead.custom_fields === 'object') {
            Object.assign(custom_fields, lead.custom_fields);
          }
          if (Object.keys(custom_fields).length > 0) {
            transformedLead.custom_fields = custom_fields;
          }

          return transformedLead;
        });

        console.log(`[Admin Campaign Leads API] Transformed leads for Smartlead:`, {
          original_count: leads.length,
          transformed_count: smartleadLeads.length,
          sample_lead: smartleadLeads[0] ? {
            email: smartleadLeads[0].email,
            first_name: smartleadLeads[0].first_name,
            last_name: smartleadLeads[0].last_name,
            company_name: smartleadLeads[0].company_name,
            has_custom_fields: !!smartleadLeads[0].custom_fields,
          } : null,
        });

        // Add leads to Smartlead
        let smartleadResult;
        if (smartleadLeads.length === 1) {
          console.log(`[Admin Campaign Leads API] Using addLead (single lead)`);
          smartleadResult = await smartlead.addLead(
            campaign.smartlead_campaign_id.toString(),
            smartleadLeads[0]
          );
        } else {
          console.log(`[Admin Campaign Leads API] Using addLeads (bulk: ${smartleadLeads.length} leads)`);
          smartleadResult = await smartlead.addLeads(
            campaign.smartlead_campaign_id.toString(),
            smartleadLeads
          );
        }

        console.log(`[Admin Campaign Leads API] Smartlead API response:`, {
          success: smartleadResult.success,
          data: smartleadResult.data,
          error: smartleadResult.error,
        });

        if (!smartleadResult.success) {
          console.error(`[Admin Campaign Leads API] ❌ Failed to add leads to Smartlead:`, {
            error: smartleadResult.error,
            campaign_id: campaignId,
            smartlead_campaign_id: campaign.smartlead_campaign_id,
            leads_count: smartleadLeads.length,
          });
          // Don't fail the request - leads are already in database
          // Just log the error
          console.warn(`[Admin Campaign Leads API] ⚠️ Leads saved to database but failed to sync to Smartlead`);
        } else {
          console.log(`[Admin Campaign Leads API] ✅ Successfully added ${smartleadLeads.length} lead(s) to Smartlead`);
        }
      } catch (smartleadError: any) {
        console.error(`[Admin Campaign Leads API] ❌ Exception while adding leads to Smartlead:`, {
          error: smartleadError,
          message: smartleadError?.message,
          stack: smartleadError?.stack,
        });
        // Don't fail the request - leads are already in database
        console.warn(`[Admin Campaign Leads API] ⚠️ Leads saved to database but exception occurred while syncing to Smartlead`);
      }
    } else {
      console.log(`[Admin Campaign Leads API] ⚠️ Campaign has no smartlead_campaign_id, skipping Smartlead sync`);
    }

    return NextResponse.json({ 
      success: true,
      count: dbLeads.length,
      leads: dbLeads,
      smartlead_synced: campaign.smartlead_campaign_id ? true : false,
    })
  } catch (error: any) {
    console.error(`[Admin Campaign Leads API] ❌ Unexpected error:`, {
      error,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update a lead
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { leadId, campaignId, ...updates } = body

    console.log(`[Admin Campaign Leads API] ============================================`);
    console.log(`[Admin Campaign Leads API] 🚀 PUT /api/admin/campaigns/leads`);
    console.log(`[Admin Campaign Leads API] Lead ID: ${leadId}`);
    console.log(`[Admin Campaign Leads API] Campaign ID: ${campaignId}`);
    console.log(`[Admin Campaign Leads API] Updates:`, updates);
    console.log(`[Admin Campaign Leads API] ============================================`);

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing leadId' },
        { status: 400 }
      )
    }

    // Get the lead to find campaign_id if not provided
    if (!campaignId) {
      const { data: lead } = await supabaseAdmin
        .from('campaign_leads')
        .select('campaign_id')
        .eq('lead_id', leadId)
        .single()
      
      if (!lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }
      updates.campaignId = lead.campaign_id
    }

    // Only allow updating certain fields
    const allowedUpdates: any = {}
    const allowedFields = ['name', 'title', 'company', 'email', 'phone', 'linkedin_url', 'status', 'notes', 'last_contacted']
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field]
      }
    }

    // Update database first
    const { data, error } = await supabaseAdmin
      .from('campaign_leads')
      .update(allowedUpdates)
      .eq('lead_id', leadId)
      .select()
      .single()

    if (error) {
      console.error(`[Admin Campaign Leads API] ❌ Database error:`, error);
      return NextResponse.json(
        { error: 'Failed to update campaign lead', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[Admin Campaign Leads API] ✅ Updated lead in database`);

    // If campaign has smartlead_campaign_id, also update lead in Smartlead
    const finalCampaignId = campaignId || updates.campaignId || data.campaign_id;
    if (finalCampaignId) {
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', finalCampaignId)
        .maybeSingle();

      if (campaign?.smartlead_campaign_id) {
        console.log(`[Admin Campaign Leads API] 🚀 Updating lead in Smartlead...`);
        console.log(`[Admin Campaign Leads API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);

        try {
          const smartlead = createSmartleadClient();
          
          // Get the Smartlead lead ID (we need to find it by email or use the lead_id if it's the Smartlead ID)
          // First, try to get the lead from Smartlead to find the actual Smartlead lead ID
          const leadEmail = allowedUpdates.email || data.email;
          
          // For now, we'll need the Smartlead lead ID. If leadId is the Smartlead ID, use it directly
          // Otherwise, we'd need to look it up. For simplicity, assume leadId might be the Smartlead ID
          // or we need to get it from the lead's email
          
          // Transform updates to Smartlead format
          const smartleadUpdates: any = {};
          if (allowedUpdates.name) {
            const nameParts = (allowedUpdates.name || '').trim().split(/\s+/);
            smartleadUpdates.first_name = nameParts[0] || '';
            smartleadUpdates.last_name = nameParts.slice(1).join(' ') || '';
          }
          if (allowedUpdates.company) smartleadUpdates.company_name = allowedUpdates.company;
          if (allowedUpdates.phone) smartleadUpdates.phone_number = allowedUpdates.phone;
          if (allowedUpdates.linkedin_url) smartleadUpdates.linkedin_profile = allowedUpdates.linkedin_url;
          
          // Handle custom fields (title)
          if (allowedUpdates.title !== undefined) {
            smartleadUpdates.custom_fields = { Title: allowedUpdates.title };
          }

          // Note: Smartlead updateLead requires the Smartlead lead ID, not our internal lead_id
          // We'll need to either:
          // 1. Store the Smartlead lead ID in our database, or
          // 2. Look it up by email
          // For now, log a warning and skip Smartlead update if we can't determine the Smartlead lead ID
          console.log(`[Admin Campaign Leads API] ⚠️ Smartlead lead update requires Smartlead lead ID. Skipping Smartlead sync.`);
          console.log(`[Admin Campaign Leads API] Note: To enable Smartlead sync, store smartlead_lead_id in campaign_leads table`);
        } catch (smartleadError: any) {
          console.error(`[Admin Campaign Leads API] ❌ Exception while updating lead in Smartlead:`, {
            error: smartleadError,
            message: smartleadError?.message,
          });
          // Don't fail the request - lead is already updated in database
        }
      } else {
        console.log(`[Admin Campaign Leads API] ⚠️ Campaign has no smartlead_campaign_id, skipping Smartlead sync`);
      }
    }

    return NextResponse.json({ lead: data })
  } catch (error: any) {
    console.error(`[Admin Campaign Leads API] ❌ Unexpected error:`, {
      error,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const email = searchParams.get('email') // Optional: email for Smartlead lookup

    console.log(`[Admin Campaign Leads API] ============================================`);
    console.log(`[Admin Campaign Leads API] 🚀 DELETE /api/admin/campaigns/leads`);
    console.log(`[Admin Campaign Leads API] Lead ID: ${leadId}`);
    console.log(`[Admin Campaign Leads API] Email: ${email || 'not provided'}`);
    console.log(`[Admin Campaign Leads API] ============================================`);

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing leadId parameter' },
        { status: 400 }
      )
    }

    // Get lead info before deleting to find campaign and email
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from('campaign_leads')
      .select('campaign_id, email')
      .eq('lead_id', leadId)
      .single()

    if (fetchError || !lead) {
      console.error(`[Admin Campaign Leads API] ❌ Lead not found:`, fetchError);
      return NextResponse.json(
        { error: 'Lead not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    const leadEmail = email || lead.email;
    const campaignId = lead.campaign_id;

    console.log(`[Admin Campaign Leads API] Found lead:`, {
      campaign_id: campaignId,
      email: leadEmail,
    });

    // If campaign has smartlead_campaign_id, also remove lead from Smartlead
    if (campaignId) {
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (campaign?.smartlead_campaign_id && leadEmail) {
        console.log(`[Admin Campaign Leads API] 🚀 Removing lead from Smartlead...`);
        console.log(`[Admin Campaign Leads API] Smartlead Campaign ID: ${campaign.smartlead_campaign_id}`);
        console.log(`[Admin Campaign Leads API] Lead Email: ${leadEmail}`);

        try {
          const smartlead = createSmartleadClient();
          // Smartlead removeLead can use email or lead ID
          const result = await smartlead.removeLead(
            campaign.smartlead_campaign_id.toString(),
            leadEmail // Use email to identify the lead
          );

          if (!result.success) {
            console.error(`[Admin Campaign Leads API] ❌ Failed to remove lead from Smartlead:`, {
              error: result.error,
              campaign_id: campaignId,
              smartlead_campaign_id: campaign.smartlead_campaign_id,
              email: leadEmail,
            });
            // Don't fail the request - continue with database deletion
            console.warn(`[Admin Campaign Leads API] ⚠️ Lead will be deleted from database but not from Smartlead`);
          } else {
            console.log(`[Admin Campaign Leads API] ✅ Successfully removed lead from Smartlead`);
          }
        } catch (smartleadError: any) {
          console.error(`[Admin Campaign Leads API] ❌ Exception while removing lead from Smartlead:`, {
            error: smartleadError,
            message: smartleadError?.message,
          });
          // Don't fail the request - continue with database deletion
        }
      } else {
        console.log(`[Admin Campaign Leads API] ⚠️ Campaign has no smartlead_campaign_id or email missing, skipping Smartlead sync`);
      }
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('campaign_leads')
      .delete()
      .eq('lead_id', leadId)

    if (error) {
      console.error(`[Admin Campaign Leads API] ❌ Database error:`, error);
      return NextResponse.json(
        { error: 'Failed to delete campaign lead', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[Admin Campaign Leads API] ✅ Successfully deleted lead from database`);

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`[Admin Campaign Leads API] ❌ Unexpected error:`, {
      error,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

