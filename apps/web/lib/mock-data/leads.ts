// Mock lead/contact database for campaign management

export interface Lead {
  lead_id: string
  campaign_id: string
  email: string
  name: string
  title: string
  company: string
  country?: string
  industry?: string
  phone?: string
  linkedin_url?: string
  status: 'active' | 'unsubscribed' | 'bounced' | 'invalid'
  added_at: string
  last_contacted?: string
  notes?: string
}

export interface ScheduledEmailWithBrevoStatus {
  scheduled_email_id: string
  campaign_id: string
  lead_id: string
  recipient_email: string
  recipient_name: string
  recipient_title: string
  recipient_company: string
  subject: string
  content: string
  scheduled_time: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  
  // Brevo tracking fields
  brevo_message_id?: string
  brevo_status?: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'hard_bounce' | 'soft_bounce' | 'spam' | 'blocked' | 'unsubscribed' | 'error'
  delivered_at?: string
  opened_at?: string
  clicked_at?: string
  bounced_at?: string
  bounce_reason?: string
  spam_reported_at?: string
  unsubscribed_at?: string
  
  sent_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

// Generate mock leads for a campaign
export function generateMockLeads(campaignId: string, count: number = 50): Lead[] {
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Amanda', 'James', 'Lisa', 'William', 'Michelle', 'Richard', 'Jennifer', 'Joseph', 'Patricia', 'Charles', 'Linda', 'Thomas', 'Barbara']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee']
  const titles = [
    'Procurement Manager',
    'Sourcing Director', 
    'VP of Supply Chain',
    'Chief Procurement Officer',
    'Supply Chain Manager',
    'Category Manager',
    'Purchasing Director',
    'Strategic Sourcing Manager',
    'VP of Procurement',
    'Director of Purchasing'
  ]
  const companies = [
    'NutriCorp Solutions', 'BioVitality Inc', 'HealthPlus Global', 'VitaLife Systems',
    'WellnessGroup International', 'PureLiving Corp', 'NaturalWay Solutions', 
    'ProActive Health', 'LifeForce Nutrition', 'OptimalHealth Partners',
    'ZenBio Industries', 'TruVital Corporation', 'CoreWellness Group',
    'PrimaNutra Solutions', 'BioTech Innovations', 'FreshStart Nutrition',
    'GreenLeaf Health', 'PureEssence Corp', 'NutriMax Solutions', 'VitalityFirst Inc'
  ]
  const countries = ['USA', 'Canada', 'UK', 'Germany', 'Australia', 'France', 'Netherlands', 'Switzerland', 'Sweden', 'Norway']
  const industries = ['Nutraceuticals', 'Food & Beverage', 'Supplements', 'Health Products', 'Wellness', 'Cosmetics']
  
  const leads: Lead[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const company = companies[Math.floor(Math.random() * companies.length)]
    const title = titles[Math.floor(Math.random() * titles.length)]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`
    
    // Randomly assign status (most are active)
    const rand = Math.random()
    let status: Lead['status'] = 'active'
    if (rand > 0.95) status = 'bounced'
    else if (rand > 0.90) status = 'unsubscribed'
    else if (rand > 0.85) status = 'invalid'
    
    const addedAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
    
    leads.push({
      lead_id: `lead_${campaignId}_${i + 1}`,
      campaign_id: campaignId,
      email,
      name: `${firstName} ${lastName}`,
      title,
      company,
      country: countries[Math.floor(Math.random() * countries.length)],
      industry: industries[Math.floor(Math.random() * industries.length)],
      phone: Math.random() > 0.5 ? `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
      linkedin_url: Math.random() > 0.3 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}` : undefined,
      status,
      added_at: addedAt.toISOString(),
      last_contacted: Math.random() > 0.5 ? new Date(addedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      notes: Math.random() > 0.7 ? `Key decision maker for ${company}` : undefined
    })
  }
  
  return leads.sort((a, b) => b.added_at.localeCompare(a.added_at))
}

// Generate mock scheduled emails with Brevo tracking status
export function generateMockScheduledEmails(campaignId: string, leads: Lead[]): ScheduledEmailWithBrevoStatus[] {
  const scheduledEmails: ScheduledEmailWithBrevoStatus[] = []
  const now = new Date()
  
  // Take only active leads
  const activeLeads = leads.filter(l => l.status === 'active')
  
  activeLeads.forEach((lead, index) => {
    // Schedule emails over the next 14 days
    const daysAhead = Math.floor(index / 10) // 10 emails per day
    const hourOffset = (index % 10) * 1.5 // Spread throughout business hours
    const scheduledTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
    
    // Determine status based on scheduled time
    const isPast = scheduledTime < now
    let status: 'pending' | 'sent' | 'failed' | 'cancelled' = 'pending'
    let brevoStatus: ScheduledEmailWithBrevoStatus['brevo_status'] = undefined
    let deliveredAt: string | undefined = undefined
    let openedAt: string | undefined = undefined
    let clickedAt: string | undefined = undefined
    let bouncedAt: string | undefined = undefined
    let bounceReason: string | undefined = undefined
    let sentAt: string | undefined = undefined
    let brevoMessageId: string | undefined = undefined
    
    if (isPast) {
      const rand = Math.random()
      if (rand > 0.95) {
        // Failed
        status = 'failed'
        brevoStatus = 'error'
      } else if (rand > 0.90) {
        // Bounced
        status = 'sent'
        sentAt = scheduledTime.toISOString()
        brevoStatus = Math.random() > 0.5 ? 'hard_bounce' : 'soft_bounce'
        brevoMessageId = `msg_${Math.random().toString(36).substring(7)}`
        bouncedAt = new Date(scheduledTime.getTime() + 5 * 60 * 1000).toISOString()
        bounceReason = brevoStatus === 'hard_bounce' ? 'Mailbox does not exist' : 'Mailbox full'
      } else {
        // Successfully sent
        status = 'sent'
        sentAt = scheduledTime.toISOString()
        brevoMessageId = `msg_${Math.random().toString(36).substring(7)}`
        brevoStatus = 'delivered'
        deliveredAt = new Date(scheduledTime.getTime() + 2 * 60 * 1000).toISOString()
        
        // Some are opened
        if (Math.random() > 0.4) {
          brevoStatus = 'opened'
          openedAt = new Date(scheduledTime.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
          
          // Some are clicked
          if (Math.random() > 0.7) {
            brevoStatus = 'clicked'
            clickedAt = new Date(new Date(openedAt).getTime() + Math.random() * 60 * 60 * 1000).toISOString()
          }
        }
      }
    }
    
    scheduledEmails.push({
      scheduled_email_id: `scheduled_${campaignId}_${index + 1}`,
      campaign_id: campaignId,
      lead_id: lead.lead_id,
      recipient_email: lead.email,
      recipient_name: lead.name,
      recipient_title: lead.title,
      recipient_company: lead.company,
      subject: `Innovative Solutions for ${lead.company}`,
      content: `Hi {{name}},\n\nI wanted to reach out to discuss how our products can benefit ${lead.company}...\n\nBest regards`,
      scheduled_time: scheduledTime.toISOString(),
      status,
      brevo_message_id: brevoMessageId,
      brevo_status: brevoStatus,
      delivered_at: deliveredAt,
      opened_at: openedAt,
      clicked_at: clickedAt,
      bounced_at: bouncedAt,
      bounce_reason: bounceReason,
      sent_at: sentAt,
      created_at: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: sentAt || new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    })
  })
  
  return scheduledEmails.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
}

// Get Brevo status badge info
export function getBrevoStatusBadge(status?: ScheduledEmailWithBrevoStatus['brevo_status']): {
  label: string
  color: string
  description: string
} {
  switch (status) {
    case 'queued':
      return { label: 'Queued', color: 'bg-blue-100 text-blue-700 border-blue-300', description: 'Email is queued for sending' }
    case 'sent':
      return { label: 'Sent', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', description: 'Email has been sent' }
    case 'delivered':
      return { label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-300', description: 'Email was delivered successfully' }
    case 'opened':
      return { label: 'Opened', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', description: 'Recipient opened the email' }
    case 'clicked':
      return { label: 'Clicked', color: 'bg-teal-100 text-teal-700 border-teal-300', description: 'Recipient clicked a link' }
    case 'hard_bounce':
      return { label: 'Hard Bounce', color: 'bg-red-100 text-red-700 border-red-300', description: 'Permanent delivery failure' }
    case 'soft_bounce':
      return { label: 'Soft Bounce', color: 'bg-orange-100 text-orange-700 border-orange-300', description: 'Temporary delivery failure' }
    case 'spam':
      return { label: 'Spam', color: 'bg-purple-100 text-purple-700 border-purple-300', description: 'Marked as spam' }
    case 'blocked':
      return { label: 'Blocked', color: 'bg-red-100 text-red-700 border-red-300', description: 'Blocked by recipient server' }
    case 'unsubscribed':
      return { label: 'Unsubscribed', color: 'bg-gray-100 text-gray-700 border-gray-300', description: 'Recipient unsubscribed' }
    case 'error':
      return { label: 'Error', color: 'bg-red-100 text-red-700 border-red-300', description: 'Error occurred during sending' }
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-300', description: 'Status unknown' }
  }
}

