import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

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

    if (!campaignId || !leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid leads array' },
        { status: 400 }
      )
    }

    // Validate each lead object
    for (const lead of leads) {
      if (!lead.email || !lead.name || !lead.company) {
        return NextResponse.json(
          { error: 'Each lead must have email, name, and company' },
          { status: 400 }
        )
      }
    }

    // Prepare batch insert data
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

    // Use upsert to handle duplicates (will update existing leads with same campaign_id + email)
    const { data, error } = await supabaseAdmin
      .from('campaign_leads')
      .upsert(leadsData, { 
        onConflict: 'campaign_id,email',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error creating campaign leads:', error)
      return NextResponse.json(
        { error: 'Failed to create campaign leads', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      count: data.length,
      leads: data 
    })
  } catch (error: any) {
    console.error('Error in POST campaign leads:', error)
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
    const { leadId, ...updates } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing leadId' },
        { status: 400 }
      )
    }

    // Only allow updating certain fields
    const allowedUpdates: any = {}
    const allowedFields = ['name', 'title', 'company', 'email', 'phone', 'linkedin_url', 'status', 'notes', 'last_contacted']
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field]
      }
    }

    const { data, error } = await supabaseAdmin
      .from('campaign_leads')
      .update(allowedUpdates)
      .eq('lead_id', leadId)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign lead:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign lead', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ lead: data })
  } catch (error: any) {
    console.error('Error in PUT campaign lead:', error)
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

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing leadId parameter' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('campaign_leads')
      .delete()
      .eq('lead_id', leadId)

    if (error) {
      console.error('Error deleting campaign lead:', error)
      return NextResponse.json(
        { error: 'Failed to delete campaign lead', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE campaign lead:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

