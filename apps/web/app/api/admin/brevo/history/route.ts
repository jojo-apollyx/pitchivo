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

// GET - Fetch email history with events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    // Fetch all email events, grouped by message_id
    const { data: events, error } = await supabaseAdmin
      .from('email_events')
      .select('*')
      .not('brevo_message_id', 'is', null)
      .order('event_timestamp', { ascending: false })
      .limit(limit * 10) // Get more events to group

    if (error) throw error

    // Group events by message_id
    const emailsMap = new Map<string, any>()

    events?.forEach((event: any) => {
      const messageId = event.brevo_message_id

      if (!emailsMap.has(messageId)) {
        // First event for this message - initialize
        emailsMap.set(messageId, {
          message_id: messageId,
          recipient_email: event.recipient_email,
          subject: event.metadata?.subject || 'No subject',
          sent_at: event.event_timestamp,
          events: [],
          latest_event: event.event_type
        })
      }

      const email = emailsMap.get(messageId)!
      email.events.push({
        event_id: event.event_id,
        message_id: messageId,
        recipient_email: event.recipient_email,
        subject: event.metadata?.subject || '',
        event_type: event.event_type,
        event_date: event.event_timestamp,
        metadata: event.metadata || {},
        created_at: event.created_at
      })

      // Update sent_at to earliest event
      if (new Date(event.event_timestamp) < new Date(email.sent_at)) {
        email.sent_at = event.event_timestamp
      }
    })

    // Convert map to array and sort by sent_at
    const emails = Array.from(emailsMap.values())
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
      .slice(0, limit)

    // Sort events within each email by timestamp
    emails.forEach(email => {
      email.events.sort((a: any, b: any) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
    })

    return NextResponse.json({
      success: true,
      emails,
      total: emails.length
    })
  } catch (error: any) {
    console.error('Error fetching email history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email history' },
      { status: 500 }
    )
  }
}

