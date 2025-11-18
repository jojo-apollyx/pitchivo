import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_role')
      .eq('id', user.id)
      .single()

    if (profile?.org_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get batch size from request body
    const body = await request.json()
    const limit = Math.min(500, Math.max(1, body.limit || 100))

    // Get Supabase project details from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Call the edge function
    // Note: In production, you'd call the actual edge function endpoint
    // For now, we'll process emails directly here
    
    const now = new Date()
    const bufferTime = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes ahead

    // Fetch pending scheduled emails that should be sent now
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', bufferTime.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(limit)

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled emails', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({
        message: 'No emails to send',
        processed: 0,
        sent: 0,
        failed: 0
      })
    }

    // In a real implementation, we would call the edge function
    // For now, return the count of emails that would be processed
    // The actual sending would be done by the edge function
    
    // Call the Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-scheduled-emails`
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Edge function error: ${errorText}`)
      }

      const result = await response.json()

      return NextResponse.json({
        message: 'Email processor triggered successfully',
        processed: result.processed || scheduledEmails.length,
        sent: result.sent || 0,
        failed: result.failed || 0,
        errors: result.errors
      })
    } catch (edgeError: any) {
      console.error('Error calling edge function:', edgeError)
      
      // Fallback: just return what would have been processed
      return NextResponse.json({
        message: 'Email processor queued (edge function unavailable)',
        processed: scheduledEmails.length,
        sent: 0,
        failed: 0,
        note: 'Edge function call failed, emails will be processed by next cron run'
      })
    }
  } catch (error: any) {
    console.error('Error triggering email processor:', error)
    return NextResponse.json(
      { error: 'Failed to trigger email processor', details: error.message },
      { status: 500 }
    )
  }
}

