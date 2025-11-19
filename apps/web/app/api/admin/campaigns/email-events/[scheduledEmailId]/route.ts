import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET: Fetch all events for a specific scheduled email
export async function GET(
  request: NextRequest,
  { params }: { params: { scheduledEmailId: string } }
) {
  try {
    const { scheduledEmailId } = params

    if (!scheduledEmailId) {
      return NextResponse.json(
        { error: 'Scheduled email ID is required' },
        { status: 400 }
      )
    }

    // Fetch the scheduled email details
    const { data: scheduledEmail, error: emailError } = await supabaseAdmin
      .from('scheduled_emails')
      .select('*')
      .eq('scheduled_email_id', scheduledEmailId)
      .single()

    if (emailError) {
      console.error('Error fetching scheduled email:', emailError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled email', details: emailError.message },
        { status: 500 }
      )
    }

    if (!scheduledEmail) {
      return NextResponse.json(
        { error: 'Scheduled email not found' },
        { status: 404 }
      )
    }

    // Fetch all events for this scheduled email, ordered by timestamp
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('email_events')
      .select('*')
      .eq('scheduled_email_id', scheduledEmailId)
      .order('event_timestamp', { ascending: true })

    if (eventsError) {
      console.error('Error fetching email events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch email events', details: eventsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scheduledEmail,
      events: events || [],
      eventCount: events?.length || 0
    })

  } catch (error: any) {
    console.error('Error in email-events API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

