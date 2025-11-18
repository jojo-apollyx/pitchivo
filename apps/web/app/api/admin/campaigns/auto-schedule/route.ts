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

interface EmailSchedule {
  recipient_email: string
  recipient_company?: string
  recipient_name?: string
  subject: string
  content: string
  scheduled_time: string
}

// POST: Auto-calculate and create email schedule for campaign
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { 
      campaignId, 
      recipients, // Array of { email, company, name }
      templateId, // Optional: use saved template
      customSubject, // Optional: override template
      customContent, // Optional: override template
      dailyLimit, // Optional: override campaign default
      emailsPerHour, // Optional: override campaign default
      sendingHours // Optional: override campaign default (array of hours 0-23)
    } = body

    if (!campaignId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing campaignId or recipients array' },
        { status: 400 }
      )
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        products (
          product_id,
          product_name,
          org_id,
          organizations (
            name,
            slug
          )
        )
      `)
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get template if specified
    let templateSubject = customSubject
    let templateContent = customContent

    if (templateId && !customSubject && !customContent) {
      const { data: template, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('subject, content')
        .eq('template_id', templateId)
        .single()

      if (!templateError && template) {
        templateSubject = template.subject
        templateContent = template.content
      }
    }

    // Get default template if no template specified
    if (!templateSubject || !templateContent) {
      const { data: defaultTemplate } = await supabaseAdmin
        .from('email_templates')
        .select('subject, content')
        .eq('campaign_id', campaignId)
        .eq('is_default', true)
        .single()

      if (defaultTemplate) {
        templateSubject = templateSubject || defaultTemplate.subject
        templateContent = templateContent || defaultTemplate.content
      }
    }

    // Fallback to generated default
    if (!templateSubject || !templateContent) {
      const productName = campaign.products?.product_name || 'our product'
      const orgName = campaign.products?.organizations?.name || 'Our Company'
      
      templateSubject = `Introducing ${productName} - Premium Solution for Your Business`
      templateContent = `Hi {{buyer_name}},

I hope this message finds you well. I'm reaching out from ${orgName} to introduce ${productName}.

We've noticed your company's commitment to quality, and we believe our solution could be a great fit for your needs. Our product offers:

• Premium quality and reliability
• Competitive pricing and flexible terms
• Dedicated support and partnership

I'd love to share more details with you. You can view our complete product information here:
{{product_link}}

Would you be interested in learning more or discussing how we can support your business?

Best regards,
${orgName} Team

P.S. Feel free to submit an RFQ directly through our product page if you'd like to move forward.`
    }

    // Fetch existing scheduled emails to avoid exceeding daily limits
    const { data: existingEmails, error: existingError } = await supabaseAdmin
      .from('scheduled_emails')
      .select('scheduled_time')
      .eq('campaign_id', campaignId)
      .in('status', ['pending', 'sent'])

    if (existingError) {
      console.error('Error fetching existing scheduled emails:', existingError)
    }

    // Group existing emails by date for daily limit checking
    const existingEmailsByDate: Record<string, number> = {}
    if (existingEmails) {
      existingEmails.forEach(email => {
        const date = new Date(email.scheduled_time)
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        existingEmailsByDate[dateKey] = (existingEmailsByDate[dateKey] || 0) + 1
      })
    }

    // Determine actual start date - use NOW if campaign start_date is in the past
    const now = new Date()
    const campaignStartDate = campaign.start_date ? new Date(campaign.start_date) : now
    const actualStartDate = campaignStartDate < now ? now : campaignStartDate

    console.log('[Auto-Schedule] Campaign:', campaignId)
    console.log('[Auto-Schedule] Campaign start date:', campaign.start_date)
    console.log('[Auto-Schedule] Actual start date used:', actualStartDate.toISOString())
    console.log('[Auto-Schedule] Existing emails by date:', existingEmailsByDate)
    console.log('[Auto-Schedule] Recipients to schedule:', recipients.length)

    // Calculate safe sending schedule
    const schedule = calculateSafeSchedule({
      recipients,
      startDate: actualStartDate,
      durationDays: campaign.duration_days || Math.ceil(recipients.length / 50), // Default to 50 emails per day
      dailyLimit: dailyLimit || campaign.daily_email_limit || 50,
      emailsPerHour: emailsPerHour || campaign.emails_per_hour || 10,
      sendingHours: sendingHours || parseSendingHours(campaign.sending_hours) || [9, 10, 11, 14, 15, 16],
      existingEmailsByDate // Pass existing emails to respect daily limits
    })

    console.log('[Auto-Schedule] Schedule calculated:', schedule.length, 'emails')

    // Build scheduled emails with placeholder replacement
    const scheduledEmails: EmailSchedule[] = schedule.map((item) => {
      const buyerName = item.recipient_company || 
                       item.recipient_email.split('@')[1]?.split('.')[0] || 
                       'Valued Partner'

      const placeholders: Record<string, string> = {
        '{{product_link}}': campaign.products 
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com'}/products/${campaign.products.product_id}`
          : '',
        '{{product_name}}': campaign.products?.product_name || 'Our Product',
        '{{buyer_name}}': buyerName.charAt(0).toUpperCase() + buyerName.slice(1),
        '{{company}}': item.recipient_company || buyerName,
        '{{org_name}}': campaign.products?.organizations?.name || 'Pitchivo'
      }

      let subject = templateSubject
      let content = templateContent

      Object.entries(placeholders).forEach(([placeholder, value]) => {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
        subject = subject.replace(regex, value)
        content = content.replace(regex, value)
      })

      return {
        recipient_email: item.recipient_email,
        recipient_company: item.recipient_company,
        recipient_name: item.recipient_name,
        subject,
        content,
        scheduled_time: item.scheduled_time
      }
    })

    // Save scheduled emails to database
    const emailsData = scheduledEmails.map((email) => ({
      campaign_id: campaignId,
      recipient_email: email.recipient_email,
      recipient_company: email.recipient_company || null,
      recipient_name: email.recipient_name || null,
      template_id: templateId || null,
      subject: email.subject,
      content: email.content,
      scheduled_time: email.scheduled_time,
      status: 'pending',
      metadata: {}
    }))

    const { data: savedEmails, error: insertError } = await supabaseAdmin
      .from('scheduled_emails')
      .insert(emailsData)
      .select()

    if (insertError) {
      console.error('Error saving scheduled emails:', insertError)
      return NextResponse.json(
        { error: 'Failed to save scheduled emails', details: insertError.message },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = calculateScheduleStats(schedule)

    // Add info about existing emails
    const totalExistingEmails = Object.values(existingEmailsByDate).reduce((sum, count) => sum + count, 0)
    const daysWithExistingEmails = Object.keys(existingEmailsByDate).length

    return NextResponse.json({
      success: true,
      totalScheduled: savedEmails.length,
      stats: {
        ...stats,
        existingEmailsConsidered: totalExistingEmails,
        daysWithExistingEmails,
        startDateUsed: actualStartDate.toISOString(),
        campaignStartDate: campaign.start_date,
        usedCurrentDate: actualStartDate.toISOString() !== campaignStartDate?.toISOString()
      },
      schedule: savedEmails
    })
  } catch (error: any) {
    console.error('Error in auto-schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

interface ScheduleOptions {
  recipients: Array<{ email: string; company?: string; name?: string }>
  startDate: Date
  durationDays: number
  dailyLimit: number
  emailsPerHour: number
  sendingHours: number[]
  existingEmailsByDate?: Record<string, number>
}

interface ScheduleItem {
  recipient_email: string
  recipient_company?: string
  recipient_name?: string
  scheduled_time: string
}

function calculateSafeSchedule(options: ScheduleOptions): ScheduleItem[] {
  const {
    recipients,
    startDate,
    durationDays,
    dailyLimit,
    emailsPerHour,
    sendingHours,
    existingEmailsByDate = {}
  } = options

  const schedule: ScheduleItem[] = []
  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  // Skip weekends - start on next Monday if needed
  while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
    currentDate.setDate(currentDate.getDate() + 1)
  }

  let recipientIndex = 0
  let daysProcessed = 0

  while (recipientIndex < recipients.length && daysProcessed < durationDays * 2) {
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }

    // Get date key for checking existing emails
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    
    // Calculate how many emails are already scheduled for this day
    const existingEmailsToday = existingEmailsByDate[dateKey] || 0
    
    // Calculate remaining capacity for this day
    const remainingCapacityToday = Math.max(0, dailyLimit - existingEmailsToday)
    
    // If no capacity left today, skip to next day
    if (remainingCapacityToday === 0) {
      currentDate.setDate(currentDate.getDate() + 1)
      daysProcessed++
      continue
    }

    let emailsSentToday = 0
    
    // Sort sending hours to ensure chronological order
    const sortedHours = [...sendingHours].sort((a, b) => a - b)

    for (const hour of sortedHours) {
      if (recipientIndex >= recipients.length || emailsSentToday >= remainingCapacityToday) {
        break
      }

      // Distribute emails across the hour with random minutes
      const emailsThisHour = Math.min(
        emailsPerHour,
        remainingCapacityToday - emailsSentToday,
        recipients.length - recipientIndex
      )

      for (let i = 0; i < emailsThisHour; i++) {
        if (recipientIndex >= recipients.length) break

        const recipient = recipients[recipientIndex]
        
        // Add random minutes within the hour (0-59)
        // Add slight random seconds to avoid exact timing
        const minute = Math.floor(Math.random() * 60)
        const second = Math.floor(Math.random() * 60)
        
        const scheduledTime = new Date(currentDate)
        scheduledTime.setHours(hour, minute, second, 0)

        schedule.push({
          recipient_email: recipient.email,
          recipient_company: recipient.company,
          recipient_name: recipient.name,
          scheduled_time: scheduledTime.toISOString()
        })

        recipientIndex++
        emailsSentToday++
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    daysProcessed++
  }

  return schedule
}

function parseSendingHours(sendingHoursJson: any): number[] {
  if (!sendingHoursJson) return [9, 10, 11, 14, 15, 16]
  
  if (Array.isArray(sendingHoursJson)) {
    return sendingHoursJson
  }
  
  try {
    const parsed = JSON.parse(sendingHoursJson)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch (e) {
    console.error('Failed to parse sending hours:', e)
  }
  
  return [9, 10, 11, 14, 15, 16]
}

function calculateScheduleStats(schedule: ScheduleItem[]) {
  const byDay: Record<string, number> = {}
  const byHour: Record<number, number> = {}
  
  schedule.forEach(item => {
    const date = new Date(item.scheduled_time)
    const dateKey = date.toISOString().split('T')[0]
    const hour = date.getHours()
    
    byDay[dateKey] = (byDay[dateKey] || 0) + 1
    byHour[hour] = (byHour[hour] || 0) + 1
  })

  const days = Object.keys(byDay).sort()
  const startDate = days[0]
  const endDate = days[days.length - 1]
  const avgPerDay = Object.values(byDay).reduce((a, b) => a + b, 0) / days.length

  return {
    totalEmails: schedule.length,
    startDate,
    endDate,
    totalDays: days.length,
    avgPerDay: Math.round(avgPerDay),
    byDay,
    byHour
  }
}

