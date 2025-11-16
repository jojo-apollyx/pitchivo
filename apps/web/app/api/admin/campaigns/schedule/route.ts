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

/**
 * Calculate optimal email sending schedule based on volume and spam prevention
 */
function calculateEmailSchedule(
  emailCount: number,
  dailyLimit: number = 50,
  emailsPerHour: number = 10,
  sendingHours: number[] = [9, 10, 11, 14, 15, 16],
  startDate: Date = new Date()
): Array<{
  scheduled_time: string
  batch_size: number
  hour: number
  day: number
}> {
  const schedule: Array<{
    scheduled_time: string
    batch_size: number
    hour: number
    day: number
  }> = []

  let remainingEmails = emailCount
  let currentDate = new Date(startDate)
  
  // Start from the next available hour
  currentDate.setMinutes(0)
  currentDate.setSeconds(0)
  currentDate.setMilliseconds(0)
  
  // If current hour is past sending hours, start tomorrow
  const currentHour = currentDate.getHours()
  if (currentHour >= Math.max(...sendingHours)) {
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setHours(Math.min(...sendingHours))
  } else {
    // Find next available sending hour
    const nextHour = sendingHours.find(h => h > currentHour)
    if (nextHour) {
      currentDate.setHours(nextHour)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(Math.min(...sendingHours))
    }
  }

  let dayIndex = 0
  
  while (remainingEmails > 0) {
    let dailyEmailsSent = 0
    
    for (const hour of sendingHours) {
      if (dailyEmailsSent >= dailyLimit) break
      if (remainingEmails <= 0) break
      
      const batchSize = Math.min(
        emailsPerHour,
        dailyLimit - dailyEmailsSent,
        remainingEmails
      )
      
      const scheduledDate = new Date(currentDate)
      scheduledDate.setDate(scheduledDate.getDate() + dayIndex)
      scheduledDate.setHours(hour)
      
      // Add some random minutes (0-30) to distribute within the hour
      const randomMinutes = Math.floor(Math.random() * 30)
      scheduledDate.setMinutes(randomMinutes)
      
      schedule.push({
        scheduled_time: scheduledDate.toISOString(),
        batch_size: batchSize,
        hour,
        day: dayIndex
      })
      
      remainingEmails -= batchSize
      dailyEmailsSent += batchSize
    }
    
    dayIndex++
    
    // Safety check to prevent infinite loops
    if (dayIndex > 365) {
      console.error('Email schedule calculation exceeded 365 days')
      break
    }
  }
  
  return schedule
}

// POST - Calculate and create email schedule
export async function POST(request: NextRequest) {
  try {
    const { 
      campaignId, 
      recipients, 
      templateId,
      autoSchedule = false 
    } = await request.json()

    if (!campaignId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Campaign ID and recipients array are required' },
        { status: 400 }
      )
    }

    // Get campaign settings
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('daily_email_limit, emails_per_hour, sending_hours, product_id, org_id')
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError) throw campaignError

    // Get template if templateId is provided
    let template = null
    if (templateId) {
      const { data: templateData, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('template_id', templateId)
        .single()

      if (!templateError && templateData) {
        template = templateData
      }
    }

    // If no template provided, try to get default template
    if (!template) {
      const { data: defaultTemplate } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_default', true)
        .single()

      if (defaultTemplate) {
        template = defaultTemplate
      }
    }

    // Calculate schedule
    const emailCount = recipients.length
    const dailyLimit = campaign.daily_email_limit || 50
    const emailsPerHour = campaign.emails_per_hour || 10
    const sendingHours = campaign.sending_hours || [9, 10, 11, 14, 15, 16]
    
    const schedule = calculateEmailSchedule(
      emailCount,
      dailyLimit,
      emailsPerHour,
      sendingHours
    )

    // Create scheduled emails
    const scheduledEmails = []
    let recipientIndex = 0

    for (const slot of schedule) {
      for (let i = 0; i < slot.batch_size && recipientIndex < recipients.length; i++) {
        const recipient = recipients[recipientIndex]
        
        scheduledEmails.push({
          campaign_id: campaignId,
          recipient_email: recipient.email,
          recipient_company: recipient.company || null,
          recipient_name: recipient.name || null,
          template_id: template?.template_id || null,
          subject: template?.subject || 'Campaign Email',
          content: template?.content || '',
          scheduled_time: slot.scheduled_time,
          status: autoSchedule ? 'pending' : 'draft',
          metadata: {
            batch_number: schedule.indexOf(slot),
            hour: slot.hour,
            day: slot.day
          }
        })
        
        recipientIndex++
      }
    }

    // Insert scheduled emails
    const { data: insertedEmails, error: insertError } = await supabaseAdmin
      .from('scheduled_emails')
      .insert(scheduledEmails)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      schedule: {
        totalEmails: emailCount,
        daysRequired: Math.max(...schedule.map(s => s.day)) + 1,
        batchesPerDay: sendingHours.length,
        dailyLimit,
        emailsPerHour,
        sendingHours,
        scheduledEmails: insertedEmails.length
      },
      emails: insertedEmails
    })
  } catch (error: any) {
    console.error('Error creating email schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create email schedule', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Fetch scheduled emails for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
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

    if (error) throw error

    // Group by date for easier display
    const groupedByDate: Record<string, any[]> = {}
    data?.forEach(email => {
      const date = new Date(email.scheduled_time).toLocaleDateString()
      if (!groupedByDate[date]) {
        groupedByDate[date] = []
      }
      groupedByDate[date].push(email)
    })

    return NextResponse.json({
      success: true,
      emails: data,
      groupedByDate,
      summary: {
        total: data?.length || 0,
        pending: data?.filter(e => e.status === 'pending').length || 0,
        sent: data?.filter(e => e.status === 'sent').length || 0,
        failed: data?.filter(e => e.status === 'failed').length || 0,
        cancelled: data?.filter(e => e.status === 'cancelled').length || 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching scheduled emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled emails', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update scheduled email status or send immediately
export async function PUT(request: NextRequest) {
  try {
    const { emailIds, action } = await request.json()

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: 'Email IDs array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (send_now, cancel, reschedule)' },
        { status: 400 }
      )
    }

    if (action === 'send_now') {
      // Mark emails to be sent immediately by updating scheduled_time
      const { data, error } = await supabaseAdmin
        .from('scheduled_emails')
        .update({
          scheduled_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('scheduled_email_id', emailIds)
        .eq('status', 'pending')
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `${data?.length || 0} email(s) scheduled to send immediately`,
        emails: data
      })
    } else if (action === 'cancel') {
      const { data, error } = await supabaseAdmin
        .from('scheduled_emails')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('scheduled_email_id', emailIds)
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `${data?.length || 0} email(s) cancelled`,
        emails: data
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error updating scheduled emails:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled emails', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete scheduled emails
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const emailIds = searchParams.get('emailIds')?.split(',')

    if (!emailIds || emailIds.length === 0) {
      return NextResponse.json(
        { error: 'Email IDs are required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('scheduled_emails')
      .delete()
      .in('scheduled_email_id', emailIds)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `${emailIds.length} email(s) deleted`
    })
  } catch (error: any) {
    console.error('Error deleting scheduled emails:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled emails', details: error.message },
      { status: 500 }
    )
  }
}

