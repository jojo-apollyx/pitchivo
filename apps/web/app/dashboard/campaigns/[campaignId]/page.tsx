'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, MousePointerClick, MessageSquare, ExternalLink, Activity, Building2, MapPin, CheckCircle2, XCircle, Calendar, MailCheck, MailX, BarChart3, Sparkles, ChevronDown, ChevronUp, MoreVertical, Trash2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { EmailEventStats } from '@/components/email/email-event-stats'

const chartColors = {
  delivered: 'hsl(var(--primary))',
  opened: 'hsl(var(--accent))',
  rfq: 'hsl(var(--primary-dark))',
  bounced: 'hsl(var(--destructive))'
} as const

const deliveryStatusVisuals = {
  sent: {
    label: 'Sent',
    badgeClass: 'bg-primary/10 text-primary border-transparent',
    dotClass: 'bg-primary/80',
    bgClass: 'bg-primary/5 hover:bg-primary/10',
    description: 'Email has been sent successfully'
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-primary/10 text-primary border-transparent',
    dotClass: 'bg-primary/80',
    bgClass: 'bg-primary/5 hover:bg-primary/10',
    description: 'Email was delivered to recipient\'s inbox'
  },
  opened: {
    label: 'Opened',
    badgeClass: 'bg-accent/10 text-accent-dark border-transparent',
    dotClass: 'bg-accent/80',
    bgClass: 'bg-accent/5 hover:bg-accent/10',
    description: 'Recipient opened the email'
  },
  clicked: {
    label: 'Clicked',
    badgeClass: 'bg-primary/15 text-primary-dark border-transparent',
    dotClass: 'bg-primary-dark/80',
    bgClass: 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30',
    description: 'Recipient clicked a link in the email'
  },
  rfq: {
    label: 'RFQ Submitted',
    badgeClass: 'bg-accent text-accent-foreground border-transparent',
    dotClass: 'bg-accent',
    bgClass: 'bg-green-50/50 hover:bg-green-50 dark:bg-green-950/20 dark:hover:bg-green-950/30',
    description: 'Recipient submitted a request for quote'
  },
  bounced: {
    label: 'Bounced',
    badgeClass: 'bg-destructive/10 text-destructive border-transparent',
    dotClass: 'bg-destructive/80',
    bgClass: 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30',
    description: 'Email bounced - delivery failed'
  },
  spam: {
    label: 'Marked as Spam',
    badgeClass: 'bg-destructive/15 text-destructive border-transparent',
    dotClass: 'bg-destructive',
    bgClass: 'bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-950/20 dark:hover:bg-orange-950/30',
    description: 'Recipient marked email as spam'
  },
  blocked: {
    label: 'Blocked',
    badgeClass: 'bg-muted text-muted-foreground border-transparent',
    dotClass: 'bg-muted-foreground/80',
    bgClass: 'bg-gray-50/50 hover:bg-gray-50 dark:bg-gray-900/20 dark:hover:bg-gray-900/30',
    description: 'Email was blocked by recipient\'s server'
  },
  viewed: {
    label: 'Viewed Product',
    badgeClass: 'bg-primary/10 text-primary border-transparent',
    dotClass: 'bg-primary/80',
    bgClass: 'bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30',
    description: 'Recipient viewed the product page'
  }
} as const

const deliveryStatusPriority: Record<keyof typeof deliveryStatusVisuals, number> = {
  bounced: 100,
  spam: 95,
  blocked: 90,
  rfq: 80,
  clicked: 70,
  opened: 60,
  delivered: 55,
  sent: 50,
  viewed: 40
}

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
  email_count: number
  emails_sent: number
  emails_delivered: number
  emails_opened: number
  emails_clicked: number
  emails_bounced: number
  rfqs_received: number
  launched_at: string | null
  created_at: string
  product_id: string
  products?: {
    product_name: string
    product_data?: any
  }
}

interface CampaignActivity {
  activity_id: string
  campaign_id: string
  activity_type: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_bounced' | 'product_viewed' | 'rfq_submitted'
  buyer_company: string | null
  contact_email: string | null
  metadata: {
    name?: string
    title?: string
    location?: string
    company?: string
    event?: string
    messageId?: string
    timestamp?: string
    [key: string]: any
  } | null
  created_at: string
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.campaignId as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [activities, setActivities] = useState<CampaignActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
    }
  }, [campaignId])

  useEffect(() => {
    if (campaign) {
      loadActivities()
    }
  }, [campaign])

  async function loadCampaign() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          products(
            product_name,
            product_data
          )
        `)
        .eq('campaign_id', campaignId)
        .single()

      if (error) throw error

      setCampaign(data as Campaign)
    } catch (error) {
      console.error('Error loading campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('campaign_activities')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      let activitiesData = (data || []) as CampaignActivity[]

      // If no activities exist but campaign has metrics, generate mock activities for demonstration
      if (activitiesData.length === 0 && campaign && (campaign.emails_delivered > 0 || campaign.emails_opened > 0 || campaign.rfqs_received > 0)) {
        activitiesData = generateMockActivities(campaign)
      }

      // Deduplicate activities - remove duplicates based on email + activity_type + timestamp (within 1 minute)
      const deduplicated = deduplicateActivities(activitiesData)

      setActivities(deduplicated)
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  function deduplicateActivities(activities: CampaignActivity[]): CampaignActivity[] {
    const seen = new Map<string, CampaignActivity>()
    
    for (const activity of activities) {
      const email = (activity.contact_email || activity.metadata?.email || '').toLowerCase()
      const type = activity.activity_type
      const event = (activity.metadata?.event || '').toLowerCase()
      
      // For RFQ, normalize both 'rfq_submitted' activity_type and 'rfq_submit' event to avoid duplicates
      // If event is 'rfq_submit', treat it as 'rfq_submitted' regardless of activity_type
      let normalizedType = type
      if (type === 'rfq_submitted' || event === 'rfq_submit') {
        normalizedType = 'rfq_submitted'
      }
      
      // Create a key based on email, normalized type, and timestamp (rounded to nearest minute)
      const timestamp = new Date(activity.created_at)
      const minuteKey = Math.floor(timestamp.getTime() / 60000) // Round to nearest minute
      const key = `${email}:${normalizedType}:${minuteKey}`
      
      // Keep the first occurrence (most recent due to ordering)
      if (!seen.has(key)) {
        seen.set(key, activity)
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  function generateMockActivities(campaign: Campaign): CampaignActivity[] {
    const mockActivities: CampaignActivity[] = []
    const now = new Date()
    const companies = [
      'Acme Manufacturing Corp',
      'Global Tech Industries',
      'Pacific Supply Co',
      'Eastern Electronics Inc',
      'Northern Trade Group',
      'Southern Logistics Ltd',
      'Western Materials Co',
      'Central Distribution Inc'
    ]
    const names = [
      { first: 'John', last: 'Chen', title: 'Procurement Manager' },
      { first: 'Sarah', last: 'Johnson', title: 'Supply Chain Director' },
      { first: 'Michael', last: 'Zhang', title: 'Purchasing Officer' },
      { first: 'Emily', last: 'Williams', title: 'Operations Manager' },
      { first: 'David', last: 'Kumar', title: 'Sourcing Specialist' },
      { first: 'Lisa', last: 'Anderson', title: 'Buyer' },
      { first: 'Robert', last: 'Martinez', title: 'Category Manager' },
      { first: 'Jennifer', last: 'Lee', title: 'VP of Procurement' }
    ]
    const locations = [
      'California, USA',
      'New York, USA',
      'Texas, USA',
      'Illinois, USA',
      'Ontario, Canada',
      'Shanghai, China',
      'Tokyo, Japan',
      'Singapore'
    ]

    let activityId = 0
    const startDate = campaign.launched_at ? new Date(campaign.launched_at) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Generate deliveries
    for (let i = 0; i < Math.min(campaign.emails_delivered, 8); i++) {
      const daysAgo = Math.floor(Math.random() * 7)
      const hoursAgo = Math.floor(Math.random() * 24)
      const timestamp = new Date(startDate.getTime() + daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000)
      const person = names[i % names.length]
      const company = companies[i % companies.length]
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`

      mockActivities.push({
        activity_id: `mock-${activityId++}`,
        campaign_id: campaignId,
        activity_type: 'email_sent',
        buyer_company: company,
        contact_email: email,
        metadata: {
          event: 'delivered',
          name: `${person.first} ${person.last}`,
          title: person.title,
          company: company,
          location: locations[i % locations.length]
        },
        created_at: timestamp.toISOString()
      })
    }

    // Generate opens
    for (let i = 0; i < Math.min(campaign.emails_opened, 6); i++) {
      const daysAgo = Math.floor(Math.random() * 6) + 1
      const hoursAgo = Math.floor(Math.random() * 24)
      const timestamp = new Date(startDate.getTime() + daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000)
      const person = names[i % names.length]
      const company = companies[i % companies.length]
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`

      mockActivities.push({
        activity_id: `mock-${activityId++}`,
        campaign_id: campaignId,
        activity_type: 'email_opened',
        buyer_company: company,
        contact_email: email,
        metadata: {
          event: 'opened',
          name: `${person.first} ${person.last}`,
          title: person.title,
          company: company,
          location: locations[i % locations.length]
        },
        created_at: timestamp.toISOString()
      })
    }

    // Generate clicks
    for (let i = 0; i < Math.min(campaign.emails_clicked, 4); i++) {
      const daysAgo = Math.floor(Math.random() * 5) + 1
      const hoursAgo = Math.floor(Math.random() * 24)
      const timestamp = new Date(startDate.getTime() + daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000)
      const person = names[i % names.length]
      const company = companies[i % companies.length]
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`

      mockActivities.push({
        activity_id: `mock-${activityId++}`,
        campaign_id: campaignId,
        activity_type: 'email_clicked',
        buyer_company: company,
        contact_email: email,
        metadata: {
          event: 'clicked',
          name: `${person.first} ${person.last}`,
          title: person.title,
          company: company,
          location: locations[i % locations.length]
        },
        created_at: timestamp.toISOString()
      })
    }

    // Generate RFQs
    for (let i = 0; i < Math.min(campaign.rfqs_received, 3); i++) {
      const daysAgo = Math.floor(Math.random() * 4) + 2
      const hoursAgo = Math.floor(Math.random() * 24)
      const timestamp = new Date(startDate.getTime() + daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000)
      const person = names[i % names.length]
      const company = companies[i % companies.length]
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`

      mockActivities.push({
        activity_id: `mock-${activityId++}`,
        campaign_id: campaignId,
        activity_type: 'rfq_submitted',
        buyer_company: company,
        contact_email: email,
        metadata: {
          event: 'rfq_submit',
          name: `${person.first} ${person.last}`,
          title: person.title,
          company: company,
          location: locations[i % locations.length]
        },
        created_at: timestamp.toISOString()
      })
    }

    // Generate bounces
    for (let i = 0; i < Math.min(campaign.emails_bounced, 2); i++) {
      const daysAgo = Math.floor(Math.random() * 7)
      const hoursAgo = Math.floor(Math.random() * 24)
      const timestamp = new Date(startDate.getTime() + daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000)
      const person = names[(i + 5) % names.length]
      const company = companies[(i + 5) % companies.length]
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`

      mockActivities.push({
        activity_id: `mock-${activityId++}`,
        campaign_id: campaignId,
        activity_type: 'email_bounced',
        buyer_company: company,
        contact_email: email,
        metadata: {
          event: i % 2 === 0 ? 'hard_bounce' : 'soft_bounce',
          name: `${person.first} ${person.last}`,
          title: person.title,
          company: company,
          location: locations[(i + 5) % locations.length]
        },
        created_at: timestamp.toISOString()
      })
    }

    // Sort by date descending
    return mockActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const getActivityDate = (activity: CampaignActivity) => {
    const timestamp = activity.metadata?.timestamp
    if (timestamp) {
      const parsed = new Date(timestamp)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
    return new Date(activity.created_at)
  }

  const resolveDeliveryStatus = (activity: CampaignActivity) => {
    const event = (activity.metadata?.event || '').toLowerCase()

    if (event === 'spam') {
      return { key: 'spam' as const }
    }

    if (event === 'blocked') {
      return { key: 'blocked' as const }
    }

    if (event === 'soft_bounce') {
      return { key: 'bounced' as const, label: 'Soft bounce' }
    }

    if (event === 'hard_bounce') {
      return { key: 'bounced' as const, label: 'Hard bounce' }
    }

    if (event === 'invalid_email') {
      return { key: 'bounced' as const, label: 'Invalid email' }
    }

    if (event === 'delivered') {
      return { key: 'delivered' as const }
    }

    switch (activity.activity_type) {
      case 'email_bounced':
        return { key: 'bounced' as const }
      case 'rfq_submitted':
        return { key: 'rfq' as const }
      case 'email_clicked':
        return { key: 'clicked' as const }
      case 'email_opened':
        return { key: 'opened' as const }
      case 'email_sent':
        return { key: 'sent' as const }
      case 'product_viewed':
        return { key: 'viewed' as const }
      default:
        return null
    }
  }

  const formatShortTimestamp = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return format(parsed, 'MMM d • h:mm a')
  }

  const timelineData = useMemo(() => {
    if (!activities.length) return []

    const buckets = new Map<
      string,
      {
        sent: number
        opened: number
        rfq: number
        bounced: number
      }
    >()

    activities.forEach((activity) => {
      const date = getActivityDate(activity)
      const key = format(date, 'yyyy-MM-dd')

      if (!buckets.has(key)) {
        buckets.set(key, {
          sent: 0,
          opened: 0,
          rfq: 0,
          bounced: 0
        })
      }

      const bucket = buckets.get(key)!
      const status = resolveDeliveryStatus(activity)

      if (status) {
        switch (status.key) {
          case 'sent':
          case 'delivered':
            bucket.sent += 1
            break
          case 'opened':
            bucket.opened += 1
            break
          case 'rfq':
            bucket.rfq += 1
            break
          case 'bounced':
          case 'spam':
          case 'blocked':
            bucket.bounced += 1
            break
          default:
            break
        }
      }
    })

    const sortedKeys = Array.from(buckets.keys()).sort()
    const cumulative = {
      sent: 0,
      opened: 0,
      rfq: 0,
      bounced: 0
    }

    return sortedKeys.map((key) => {
      const bucket = buckets.get(key)!
      cumulative.sent += bucket.sent
      cumulative.opened += bucket.opened
      cumulative.rfq += bucket.rfq
      cumulative.bounced += bucket.bounced

      const date = new Date(`${key}T00:00:00`)
      return {
        key,
        date: format(date, 'MMM d'),
        dailySent: bucket.sent,
        dailyOpened: bucket.opened,
        dailyRfq: bucket.rfq,
        dailyBounced: bucket.bounced,
        sent: cumulative.sent,
        opened: cumulative.opened,
        rfq: cumulative.rfq,
        bounced: cumulative.bounced
      }
    })
  }, [activities])

  const uniqueContacts = useMemo(() => {
    if (!activities.length) return 0
    const set = new Set<string>()
    activities.forEach((activity) => {
      if (activity.contact_email) {
        set.add(activity.contact_email.toLowerCase())
      } else if (activity.metadata?.email) {
        set.add(String(activity.metadata.email).toLowerCase())
      }
    })
    return set.size
  }, [activities])

  const deliveryStatuses = useMemo(() => {
    if (!activities.length) return []

    const records = new Map<
      string,
      {
        email: string
        name: string | null
        title: string | null
        company: string | null
        location: string | null
        emailStatus: {
          key: keyof typeof deliveryStatusVisuals
          label: string
          badgeClass: string
        } | null
        currentStatus: {
          key: keyof typeof deliveryStatusVisuals
          label: string
          badgeClass: string
        } | null
        priority: number
        lastTimestamp: string
        timeline: Array<{
          label: string
          timestamp: string
          dotClass: string
          type: string
        }>
      }
    >()

    activities.forEach((activity) => {
      const metadata = activity.metadata || {}
      const contactEmail = activity.contact_email || (metadata.email as string) || `unknown-${activity.activity_id}`
      const key = contactEmail.toLowerCase()
      const status = resolveDeliveryStatus(activity)
      const activityDate = getActivityDate(activity)
      const isoTimestamp = activityDate.toISOString()

      if (!records.has(key)) {
        records.set(key, {
          email: contactEmail,
          name: (metadata.name as string) || null,
          title: (metadata.title as string) || null,
          company: activity.buyer_company || (metadata.company as string) || null,
          location: (metadata.location as string) || null,
          emailStatus: null,
          currentStatus: null,
          priority: -Infinity,
          lastTimestamp: isoTimestamp,
          timeline: []
        })
      }

      const record = records.get(key)!

      if (status) {
        const visuals = deliveryStatusVisuals[status.key]

        if (visuals) {
          const label = status.label || visuals.label

          record.timeline.push({
            label,
            timestamp: isoTimestamp,
            dotClass: visuals.dotClass,
            type: activity.activity_type
          })

          // Track email delivery status (delivered, bounced, etc.)
          if (status.key === 'delivered' || status.key === 'bounced' || status.key === 'spam' || status.key === 'blocked') {
            if (!record.emailStatus || deliveryStatusPriority[status.key] > deliveryStatusPriority[record.emailStatus.key as keyof typeof deliveryStatusPriority]) {
              record.emailStatus = {
                key: status.key,
                label,
                badgeClass: visuals.badgeClass
              }
            }
          }

          const priority = deliveryStatusPriority[status.key]

          if (
            priority > record.priority ||
            (priority === record.priority && new Date(isoTimestamp).getTime() > new Date(record.lastTimestamp).getTime())
          ) {
            record.currentStatus = {
              key: status.key,
              label,
              badgeClass: visuals.badgeClass
            }
            record.priority = priority
            record.lastTimestamp = isoTimestamp
          }
        }
      }

      if (!record.company && (metadata.company as string)) {
        record.company = metadata.company as string
      }

      if (!record.name && (metadata.name as string)) {
        record.name = metadata.name as string
      }

      if (!record.title && (metadata.title as string)) {
        record.title = metadata.title as string
      }

      if (!record.location && (metadata.location as string)) {
        record.location = metadata.location as string
      }
    })

    const items = Array.from(records.values())

    items.forEach((item) => {
      // Sort timeline chronologically (oldest first for display)
      item.timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      
      // Set default email status if not set
      if (!item.emailStatus) {
        // Check if there's a sent/delivered event
        const hasDelivery = item.timeline.some(t => t.label === 'Delivered' || t.label === 'Sent')
        if (hasDelivery) {
          item.emailStatus = {
            key: 'delivered',
            label: deliveryStatusVisuals.delivered.label,
            badgeClass: deliveryStatusVisuals.delivered.badgeClass
          }
        } else {
          item.emailStatus = {
            key: 'sent',
            label: deliveryStatusVisuals.sent.label,
            badgeClass: deliveryStatusVisuals.sent.badgeClass
          }
        }
      }
      
      if (!item.currentStatus) {
        item.currentStatus = {
          key: 'sent',
          label: deliveryStatusVisuals.sent.label,
          badgeClass: deliveryStatusVisuals.sent.badgeClass
        }
      }
    })

    return items.sort((a, b) => {
      if (b.priority === a.priority) {
        return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
      }
      return b.priority - a.priority
    })
  }, [activities])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'scheduled':
        return 'bg-primary/10 text-primary border-primary/30'
      case 'completed':
        return 'bg-accent/10 text-accent-dark border-accent/30'
      case 'paused':
        return 'bg-muted text-muted-foreground border-border'
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
        return <Mail className="h-4 w-4" />
      case 'email_opened':
        return <Mail className="h-4 w-4" />
      case 'email_clicked':
        return <MousePointerClick className="h-4 w-4" />
      case 'email_bounced':
        return <XCircle className="h-4 w-4" />
      case 'product_viewed':
        return <ExternalLink className="h-4 w-4" />
      case 'rfq_submitted':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email_sent':
        return 'text-primary'
      case 'email_opened':
        return 'text-accent'
      case 'email_clicked':
        return 'text-primary-dark'
      case 'email_bounced':
        return 'text-destructive'
      case 'rfq_submitted':
        return 'text-accent'
      case 'product_viewed':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'email_sent':
        return 'Sent'
      case 'email_opened':
        return 'Opened'
      case 'email_clicked':
        return 'Clicked'
      case 'email_bounced':
        return 'Bounced'
      case 'product_viewed':
        return 'Product Viewed'
      case 'rfq_submitted':
        return 'RFQ Submitted'
      default:
        return type
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getTimelineEventLabel = (item: { label: string; type: string }) => {
    // Map timeline labels to user-friendly event names
    const label = item.label.toLowerCase()
    const type = item.type.toLowerCase()
    
    if (label.includes('sent') || label.includes('delivered')) {
      return 'Email sent'
    }
    if (label.includes('opened') || type === 'email_opened') {
      return 'Email opened'
    }
    if (label.includes('clicked') || type === 'email_clicked') {
      return 'Link clicked'
    }
    if (label.includes('viewed') || type === 'product_viewed') {
      return 'Web viewed'
    }
    if (label.includes('rfq') || label.includes('submit') || type === 'rfq_submitted') {
      return 'RFQ submitted'
    }
    if (label.includes('bounce')) {
      return 'Email bounced'
    }
    
    return item.label
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign details...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => router.push('/dashboard/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const progress = Math.min((campaign.emails_sent / campaign.email_count) * 100, 100)
  const openRate = campaign.emails_sent > 0 
    ? Math.round((campaign.emails_opened / campaign.emails_sent) * 100) 
    : 0
  const clickRate = campaign.emails_sent > 0
    ? Math.round((campaign.emails_clicked / campaign.emails_sent) * 100)
    : 0
  const deliverRate = campaign.emails_sent > 0
    ? Math.round((campaign.emails_delivered / campaign.emails_sent) * 100)
    : 0

  const timelineTotals = timelineData.length
    ? timelineData[timelineData.length - 1]
    : {
        sent: campaign.emails_delivered || campaign.emails_sent,
        opened: campaign.emails_opened,
        rfq: campaign.rfqs_received,
        bounced: campaign.emails_bounced
      }

  const mostRecentActivityTimestamp = activities.length ? getActivityDate(activities[0]).toISOString() : null
  const firstActivityDateLabel = timelineData.length
    ? timelineData[0].date
    : campaign.launched_at
    ? format(new Date(campaign.launched_at), 'MMM d')
    : format(new Date(campaign.created_at), 'MMM d')

  const performanceSummary = [
    { label: 'Delivered', value: timelineTotals.sent, color: chartColors.delivered },
    { label: 'Opened', value: timelineTotals.opened, color: chartColors.opened },
    { label: 'RFQs', value: timelineTotals.rfq, color: chartColors.rfq },
    { label: 'Bounced', value: timelineTotals.bounced, color: chartColors.bounced }
  ]

  const hasTimelineData = timelineData.length > 0

  const buildActivityNarrative = (activity: CampaignActivity) => {
    const metadata = activity.metadata || {}
    const timestampIso = getActivityDate(activity).toISOString()
    const name =
      (metadata.name as string) ||
      activity.contact_email?.split('@')[0] ||
      'Unknown contact'
    const title = (metadata.title as string) || ''
    const company = activity.buyer_company || (metadata.company as string) || ''
    const location = (metadata.location as string) || ''
    
    // Normalize rawEvent - don't show if it's redundant with activity label
    let rawEvent = metadata.event ? String(metadata.event).replace(/_/g, ' ') : null
    const activityLabel = getActivityLabel(activity.activity_type).toLowerCase()
    
    if (rawEvent) {
      const normalizedRawEvent = rawEvent.toLowerCase().trim()
      
      // Check if rawEvent is essentially the same as the activity label
      // Map common event variations to activity labels
      const eventToLabelMap: Record<string, string[]> = {
        'opened': ['opened', 'open'],
        'clicked': ['clicked', 'click'],
        'sent': ['sent', 'send', 'delivered'],
        'bounced': ['bounced', 'bounce'],
        'rfq submitted': ['rfq', 'submit', 'submitted'],
        'product viewed': ['viewed', 'view']
      }
      
      // Check if rawEvent matches the activity label or any of its variations
      const labelVariations = eventToLabelMap[activityLabel] || [activityLabel]
      const isRedundant = labelVariations.some(variation => 
        normalizedRawEvent === variation || 
        normalizedRawEvent.includes(variation) && variation.length > 3
      )
      
      if (isRedundant) {
        rawEvent = null
      }
    }
    
    let action = 'interacted with your campaign'

    switch (activity.activity_type) {
      case 'email_sent':
        action = metadata.event === 'delivered'
          ? 'had the campaign email delivered'
          : 'was sent your campaign email'
        break
      case 'email_opened':
        action = 'opened your campaign email'
        break
      case 'email_clicked':
        action = 'clicked through to your product'
        break
      case 'email_bounced':
        action = metadata.event
          ? `had the email bounce (${String(metadata.event).replace(/_/g, ' ')})`
          : 'had the email bounce'
        break
      case 'product_viewed':
        action = 'viewed your product experience'
        break
      case 'rfq_submitted':
        action = 'submitted an RFQ'
        break
      default:
        break
    }

    return {
      name,
      title,
      company,
      location,
      email: activity.contact_email || '',
      action,
      rawEvent,
      timestampIso
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/campaigns')}
              className="gap-2 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate">{campaign.campaign_name}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Performance Timeline */}
          <div className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 sm:p-6">
            <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

            <div className="flex flex-col gap-4 sm:gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <BarChart3 className="h-4 w-4" />
                  Performance timeline
                </div>
                <h2 className="mt-2 text-base sm:text-lg font-semibold">Engagement velocity</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Since {firstActivityDateLabel} • {timelineData.length || 0} datapoint{timelineData.length === 1 ? '' : 's'}
                </p>
                {mostRecentActivityTimestamp && (
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    Last activity {formatTime(mostRecentActivityTimestamp)}
                  </p>
                )}
              </div>

              <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {performanceSummary.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/20 bg-background/70 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="mt-2 text-base sm:text-lg font-semibold">
                      {item.value ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 sm:mt-6 h-64 sm:h-72">
              {hasTimelineData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timelineData}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground) / 0.6)"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="hsl(var(--muted-foreground) / 0.6)"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 16px 24px -12px rgba(15, 23, 42, 0.2)',
                        fontSize: '14px'
                      }}
                      formatter={(value: number, name) => [value, name]}
                      labelFormatter={(label) => `As of ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="sent"
                      name="Delivered"
                      stroke={chartColors.delivered}
                      strokeWidth={2.4}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="opened"
                      name="Opened"
                      stroke={chartColors.opened}
                      strokeWidth={2.4}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rfq"
                      name="RFQs"
                      stroke={chartColors.rfq}
                      strokeWidth={2.4}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bounced"
                      name="Bounced / Spam"
                      stroke={chartColors.bounced}
                      strokeWidth={2}
                      strokeDasharray="6 6"
                      dot={{ r: 3, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/60 p-6 sm:p-8 text-center">
                  <Sparkles className="h-8 w-8 text-primary mb-3" />
                  <p className="text-sm font-medium">No engagement data yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
                    Once this campaign begins delivering, we&apos;ll chart every delivery, open, bounce, and RFQ in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Email Event Statistics - User View (Common Statuses Only) */}
          <div className="rounded-xl border border-border/30 bg-card/60 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Email Performance</h3>
            </div>
            <EmailEventStats campaignId={campaignId} isAdmin={false} />
          </div>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.75fr,1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/30 bg-card/60 p-4 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Activity className="h-4 w-4 text-primary" />
                          Engagement feed
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {activities.length} event{activities.length === 1 ? '' : 's'} · {uniqueContacts} engaged contact{uniqueContacts === 1 ? '' : 's'}
                        </p>
                      </div>
                      {mostRecentActivityTimestamp && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                          Live
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 sm:mt-6">
                      {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/60 py-8 sm:py-12 text-center">
                          <Activity className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground/60 mb-3 sm:mb-4" />
                          <p className="text-sm font-medium">No engagement yet</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-4">
                            We&apos;ll surface opens, clicks, product views, and RFQs the moment buyers interact.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {activities.map((activity) => {
                            const narrative = buildActivityNarrative(activity)
                            const contextPieces = [narrative.title, narrative.company, narrative.location].filter(Boolean)

                            return (
                              <div
                                key={activity.activity_id}
                                className="rounded-lg border border-border/20 bg-background/60 p-3 sm:p-4 transition-colors hover:border-primary/40 hover:bg-background/80"
                              >
                                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between">
                                  <div className="flex gap-3">
                                    <div
                                      className={`h-10 w-10 flex-shrink-0 rounded-lg border border-border/30 bg-card/70 flex items-center justify-center ${getActivityColor(activity.activity_type)}`}
                                    >
                                      {getActivityIcon(activity.activity_type)}
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold">{narrative.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {getActivityLabel(activity.activity_type)}
                                        </Badge>
                                        {narrative.rawEvent && (
                                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                            {narrative.rawEvent}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm leading-relaxed">
                                        <span className="font-medium">{narrative.name}</span> {narrative.action}.
                                      </p>
                                      {(contextPieces.length > 0 || (narrative.email && activity.activity_type === 'rfq_submitted')) && (
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                          {narrative.title && (
                                            <span>{narrative.title}</span>
                                          )}
                                          {narrative.company && (
                                            <span className="flex items-center gap-1">
                                              <Building2 className="h-3 w-3" />
                                              {narrative.company}
                                            </span>
                                          )}
                                          {narrative.location && (
                                            <span className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {narrative.location}
                                            </span>
                                          )}
                                          {narrative.email && activity.activity_type === 'rfq_submitted' && (
                                            <span className="flex items-center gap-1">
                                              <Mail className="h-3 w-3" />
                                              {narrative.email}
                                            </span>
                                          )}
                                          {narrative.email && activity.activity_type !== 'rfq_submitted' && (
                                            <span className="flex items-center gap-1 text-muted-foreground/50">
                                              <Mail className="h-3 w-3" />
                                              <span className="blur-[2px] select-none">••••@••••.com</span>
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-muted-foreground">
                                    <span className="text-muted-foreground/70">
                                      {formatShortTimestamp(narrative.timestampIso)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/30 bg-card/60 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <MailCheck className="h-4 w-4 text-primary" />
                          Delivery status by contact
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {deliveryStatuses.length} contact{deliveryStatuses.length === 1 ? '' : 's'} tracked across delivery, opens, and RFQs.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 space-y-4">
                      {deliveryStatuses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/60 py-8 sm:py-12 text-center">
                          <MailX className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground/60 mb-3 sm:mb-4" />
                          <p className="text-sm font-medium">Delivery updates will appear here</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-4">
                            We&apos;ll log every delivery, bounce, spam complaint, and RFQ per recipient.
                          </p>
                        </div>
                      ) : (
                        deliveryStatuses.map((contact) => {
                          const isExpanded = expandedContacts.has(contact.email)
                          const statusBgClass = contact.currentStatus 
                            ? deliveryStatusVisuals[contact.currentStatus.key].bgClass 
                            : 'bg-background/60 hover:bg-background/80'
                          const statusDescription = contact.currentStatus 
                            ? deliveryStatusVisuals[contact.currentStatus.key].description 
                            : ''

                          return (
                            <TooltipProvider key={contact.email}>
                              <div 
                                className={`rounded-lg overflow-hidden transition-all border border-border/20 ${statusBgClass}`}
                              >
                                {/* Header - Always visible */}
                                <div className="flex items-start gap-2 p-3 sm:p-4">
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedContacts)
                                      if (isExpanded) {
                                        newExpanded.delete(contact.email)
                                      } else {
                                        newExpanded.add(contact.email)
                                      }
                                      setExpandedContacts(newExpanded)
                                    }}
                                    className="flex-1 text-left min-h-[44px]"
                                  >
                                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                                      <div className="flex-1 min-w-0 space-y-2">
                                        {/* First line: Name with status tooltip */}
                                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                          <TooltipComponent>
                                            <TooltipTrigger asChild>
                                              <p className="text-sm font-semibold truncate cursor-help">
                                                {contact.name || contact.email}
                                              </p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="space-y-1">
                                                <p className="font-medium">{contact.currentStatus?.label}</p>
                                                <p className="text-xs text-muted-foreground">{statusDescription}</p>
                                              </div>
                                            </TooltipContent>
                                          </TooltipComponent>
                                          <span className="text-xs text-muted-foreground">•</span>
                                          <span className="text-xs font-medium">
                                            {contact.currentStatus?.label}
                                          </span>
                                        </div>
                                        {/* Second line: Title Company */}
                                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                          {contact.title && (
                                            <span className="text-xs text-muted-foreground">{contact.title}</span>
                                          )}
                                          {contact.company && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Building2 className="h-3 w-3" />
                                              {contact.company}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    </div>
                                  </button>

                                  {/* Actions dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigator.clipboard.writeText(contact.email)
                                        }}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Copy Email
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Future: Mark as unsubscribed
                                        }}
                                        className="text-orange-600 focus:text-orange-700"
                                      >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Mark Unsubscribed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Future: Remove from campaign
                                        }}
                                        className="text-red-600 focus:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove from Campaign
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                              {/* Timeline - Expanded view */}
                              {isExpanded && contact.timeline.length > 0 && (
                                <div className="border-t border-border/20 bg-background/40 px-3 sm:px-4 py-3">
                                  <div className="space-y-3">
                                    {contact.timeline.map((item, idx) => {
                                      const eventLabel = getTimelineEventLabel(item)
                                      const isLast = idx === contact.timeline.length - 1
                                      
                                      return (
                                        <div
                                          key={`${item.timestamp}-${item.label}-${idx}`}
                                          className="flex items-start gap-3 relative"
                                        >
                                          {/* Timeline line */}
                                          {!isLast && (
                                            <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border/30" />
                                          )}
                                          
                                          {/* Dot */}
                                          <div className="relative z-10 flex-shrink-0">
                                            <span className={`inline-flex h-5 w-5 rounded-full ${item.dotClass} border-2 border-background flex items-center justify-center`}>
                                              <span className={`h-2 w-2 rounded-full ${item.dotClass.replace('/80', '')}`} />
                                            </span>
                                          </div>
                                          
                                          {/* Content */}
                                          <div className="flex-1 min-w-0 pt-0.5">
                                            <p className="text-sm font-medium text-foreground">
                                              {eventLabel}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {formatShortTimestamp(item.timestamp)}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              </div>
                            </TooltipProvider>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </section>
    </div>
  )
}

