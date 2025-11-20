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
// Note: All campaign emails are handled by Smartlead
// Campaign email history is available via smartlead_email_events table
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId parameter' },
        { status: 400 }
      )
    }

    // All campaigns are handled by Smartlead
    // Campaign emails are tracked via smartlead_email_events, not scheduled_emails
    return NextResponse.json({ 
      scheduledEmails: [],
      message: 'Campaign emails are handled by Smartlead. Use smartlead_email_events for campaign email history.'
    })
  } catch (error: any) {
    console.error('Error in GET scheduled emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create scheduled emails in batch
// Note: All campaigns are handled by Smartlead. Use Smartlead API to add leads to campaigns.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    return NextResponse.json(
      { 
        error: 'Campaign emails are handled by Smartlead. Use /api/smartlead/campaigns/[campaignId]/leads to add leads to campaigns.',
        message: 'All campaign emails are managed through Smartlead. Scheduled emails are not used for campaigns.'
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in POST scheduled emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update scheduled email status (e.g., cancel)
// Note: All campaigns are handled by Smartlead. Use Smartlead API to manage campaign emails.
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    return NextResponse.json(
      { 
        error: 'Campaign emails are handled by Smartlead. Use Smartlead API to manage campaign emails.',
        message: 'All campaign emails are managed through Smartlead.'
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in PUT scheduled email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete scheduled emails (for cancellation before sending)
// Note: All campaigns are handled by Smartlead. Use Smartlead API to manage campaign emails.
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    return NextResponse.json(
      { 
        error: 'Campaign emails are handled by Smartlead. Use Smartlead API to manage campaign emails.',
        message: 'All campaign emails are managed through Smartlead.'
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in DELETE scheduled emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

