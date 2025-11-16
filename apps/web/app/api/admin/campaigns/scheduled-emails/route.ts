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

// GET: Fetch scheduled emails for a campaign
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status') // pending, sent, failed, cancelled

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId parameter' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('scheduled_emails')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('scheduled_time', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching scheduled emails:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled emails' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scheduledEmails: data || [] })
  } catch (error: any) {
    console.error('Error in GET scheduled emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create scheduled emails in batch
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { campaignId, emails } = body

    if (!campaignId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid email array' },
        { status: 400 }
      )
    }

    // Validate each email object
    for (const email of emails) {
      if (!email.recipient_email || !email.subject || !email.content || !email.scheduled_time) {
        return NextResponse.json(
          { error: 'Each email must have recipient_email, subject, content, and scheduled_time' },
          { status: 400 }
        )
      }
    }

    // Prepare batch insert data
    const scheduledEmailsData = emails.map((email: any) => ({
      campaign_id: campaignId,
      recipient_email: email.recipient_email,
      recipient_company: email.recipient_company || null,
      recipient_name: email.recipient_name || null,
      template_id: email.template_id || null,
      subject: email.subject,
      content: email.content,
      scheduled_time: email.scheduled_time,
      status: 'pending',
      metadata: email.metadata || {}
    }))

    const { data, error } = await supabaseAdmin
      .from('scheduled_emails')
      .insert(scheduledEmailsData)
      .select()

    if (error) {
      console.error('Error creating scheduled emails:', error)
      return NextResponse.json(
        { error: 'Failed to create scheduled emails', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      count: data.length,
      scheduledEmails: data 
    })
  } catch (error: any) {
    console.error('Error in POST scheduled emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update scheduled email status (e.g., cancel)
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { scheduledEmailId, status, errorMessage } = body

    if (!scheduledEmailId || !status) {
      return NextResponse.json(
        { error: 'Missing scheduledEmailId or status' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'sent', 'failed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, sent, failed, cancelled' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { data, error } = await supabaseAdmin
      .from('scheduled_emails')
      .update(updateData)
      .eq('scheduled_email_id', scheduledEmailId)
      .select()
      .single()

    if (error) {
      console.error('Error updating scheduled email:', error)
      return NextResponse.json(
        { error: 'Failed to update scheduled email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scheduledEmail: data })
  } catch (error: any) {
    console.error('Error in PUT scheduled email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete scheduled emails (for cancellation before sending)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const scheduledEmailId = searchParams.get('scheduledEmailId')
    const campaignId = searchParams.get('campaignId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (!scheduledEmailId && !campaignId) {
      return NextResponse.json(
        { error: 'Missing scheduledEmailId or campaignId parameter' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin.from('scheduled_emails').delete()

    if (scheduledEmailId) {
      query = query.eq('scheduled_email_id', scheduledEmailId)
    } else if (campaignId && deleteAll) {
      query = query.eq('campaign_id', campaignId).eq('status', 'pending')
    } else {
      return NextResponse.json(
        { error: 'Invalid delete operation' },
        { status: 400 }
      )
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting scheduled emails:', error)
      return NextResponse.json(
        { error: 'Failed to delete scheduled emails' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE scheduled emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

