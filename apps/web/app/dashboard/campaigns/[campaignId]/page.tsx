'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, MousePointerClick, MessageSquare, ExternalLink, Activity, Building2, MapPin, CheckCircle2, XCircle, Calendar, MailCheck, MailX, BarChart3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const chartColors = {
  delivered: '#6366F1',
  opened: '#22C55E',
  rfq: '#F97316',
  bounced: '#EF4444'
} as const

const deliveryStatusVisuals = {
  sent: {
    label: 'Sent',
    badgeClass: 'bg-blue-100/70 text-blue-700 border-transparent',
    dotClass: 'bg-blue-500/80'
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-emerald-100/70 text-emerald-700 border-transparent',
    dotClass: 'bg-emerald-500/80'
  },
  opened: {
    label: 'Opened',
    badgeClass: 'bg-green-100/70 text-green-700 border-transparent',
    dotClass: 'bg-green-500/80'
  },
  clicked: {
    label: 'Clicked',
    badgeClass: 'bg-indigo-100/70 text-indigo-700 border-transparent',
    dotClass: 'bg-indigo-500/80'
  },
  rfq: {
    label: 'RFQ Submitted',
    badgeClass: 'bg-amber-100/80 text-amber-800 border-transparent',
    dotClass: 'bg-amber-500/80'
  },
  bounced: {
    label: 'Bounced',
    badgeClass: 'bg-red-100/80 text-red-700 border-transparent',
    dotClass: 'bg-red-500/80'
  },
  spam: {
    label: 'Marked as Spam',
    badgeClass: 'bg-orange-100/80 text-orange-700 border-transparent',
    dotClass: 'bg-orange-500/80'
  },
  blocked: {
    label: 'Blocked',
    badgeClass: 'bg-slate-200/80 text-slate-700 border-transparent',
    dotClass: 'bg-slate-500/80'
  },
  viewed: {
    label: 'Viewed Product',
    badgeClass: 'bg-purple-100/70 text-purple-700 border-transparent',
    dotClass: 'bg-purple-500/80'
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
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
      loadActivities()
    }
  }, [campaignId])

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

      // Get product image
      if (data.products?.product_data) {
        const productData = typeof data.products.product_data === 'string'
          ? JSON.parse(data.products.product_data)
          : data.products.product_data
        
        const productImages = productData?.product_images || []
        if (productImages.length > 0) {
          const firstImage = productImages[0]
          if (firstImage.startsWith('http')) {
            setProductImageUrl(firstImage)
          } else {
            const { data: urlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(firstImage)
            setProductImageUrl(urlData.publicUrl)
          }
        }
      }
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

      setActivities((data || []) as CampaignActivity[])
    } catch (error) {
      console.error('Error loading activities:', error)
    }
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
            dotClass: visuals.dotClass
          })

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
      item.timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
        return 'bg-green-100 text-green-700 border-green-300'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
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
        return 'text-blue-600'
      case 'email_opened':
        return 'text-green-600'
      case 'email_clicked':
        return 'text-primary'
      case 'email_bounced':
        return 'text-red-600'
      case 'rfq_submitted':
        return 'text-accent'
      case 'product_viewed':
        return 'text-purple-600'
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
    const rawEvent = metadata.event ? String(metadata.event).replace(/_/g, ' ') : null
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
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/campaigns')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold">{campaign.campaign_name}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Campaign Overview */}
          <div className="bg-card/50 rounded-xl border border-border/30 p-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {productImageUrl ? (
                  <img
                    src={productImageUrl}
                    alt={campaign.products?.product_name || 'Product'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  className={`text-3xl sm:text-4xl font-bold text-primary/50 ${productImageUrl ? 'hidden' : 'flex'} h-full w-full items-center justify-center`}
                >
                  {campaign.products?.product_name?.charAt(0) || 'P'}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className={`text-xs ${getStatusColor(campaign.status)}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                  {campaign.launched_at && (
                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Launched {new Date(campaign.launched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {campaign.products && (
                  <h2 className="text-lg font-semibold mb-4">{campaign.products.product_name}</h2>
                )}

                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                    <span>Sending progress</span>
                    <span>{campaign.emails_sent} / {campaign.email_count} sent</span>
                  </div>
                  <div className="w-full rounded-full bg-border/30 h-2.5">
                    <div
                      className="bg-primary rounded-full h-2.5 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-border/30 bg-card p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Delivered</span>
                    </div>
                    <div className="text-xl font-semibold">{deliverRate}%</div>
                    <div className="text-xs text-muted-foreground">{campaign.emails_delivered}</div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-card p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" />
                      <span>Opened</span>
                    </div>
                    <div className="text-xl font-semibold">{openRate}%</div>
                    <div className="text-xs text-muted-foreground">{campaign.emails_opened}</div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-card p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <MousePointerClick className="h-3 w-3" />
                      <span>Clicked</span>
                    </div>
                    <div className="text-xl font-semibold">{clickRate}%</div>
                    <div className="text-xs text-muted-foreground">{campaign.emails_clicked}</div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-card p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>RFQs</span>
                    </div>
                    <div className="text-xl font-semibold text-accent">{campaign.rfqs_received}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Timeline */}
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
            <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <BarChart3 className="h-4 w-4" />
                  Performance timeline
                </div>
                <h2 className="mt-2 text-lg sm:text-xl font-semibold tracking-tight">Engagement velocity</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Since {firstActivityDateLabel} • {timelineData.length || 0} datapoint{timelineData.length === 1 ? '' : 's'}
                </p>
                {mostRecentActivityTimestamp && (
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    Last activity {formatTime(mostRecentActivityTimestamp)}
                  </p>
                )}
              </div>

              <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                {performanceSummary.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/20 bg-background/70 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      {item.value ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 h-72">
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
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="hsl(var(--muted-foreground) / 0.6)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 16px 24px -12px rgba(15, 23, 42, 0.2)'
                      }}
                      formatter={(value: number, name) => [value, name]}
                      labelFormatter={(label) => `As of ${label}`}
                    />
                    <Legend />
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
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/60 p-8 text-center">
                  <Sparkles className="h-8 w-8 text-primary mb-3" />
                  <p className="text-sm font-medium">No engagement data yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Once this campaign begins delivering, we&apos;ll chart every delivery, open, bounce, and RFQ in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.75fr,1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/30 bg-card/60 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Activity className="h-4 w-4 text-primary" />
                          Engagement feed
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
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

                    <div className="mt-6">
                      {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/60 py-12 text-center">
                          <Activity className="h-10 w-10 text-muted-foreground/60 mb-4" />
                          <p className="text-sm font-medium">No engagement yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            We&apos;ll surface opens, clicks, product views, and RFQs the moment buyers interact.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => {
                            const narrative = buildActivityNarrative(activity)
                            const contextPieces = [narrative.title, narrative.company, narrative.location].filter(Boolean)

                            return (
                              <div
                                key={activity.activity_id}
                                className="rounded-xl border border-border/20 bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-background/80"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                  <div className="flex gap-3">
                                    <div
                                      className={`h-10 w-10 flex-shrink-0 rounded-lg border border-border/30 bg-card/70 flex items-center justify-center ${getActivityColor(activity.activity_type)}`}
                                    >
                                      {getActivityIcon(activity.activity_type)}
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold">{narrative.name}</span>
                                        <Badge variant="outline" className="text-[11px]">
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
                                      {(contextPieces.length > 0 || narrative.email) && (
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
                                          {narrative.email && (
                                            <span className="flex items-center gap-1">
                                              <Mail className="h-3 w-3" />
                                              {narrative.email}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="border-border/60 text-[10px]">
                                      {formatTime(narrative.timestampIso)}
                                    </Badge>
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
                  <div className="rounded-xl border border-border/30 bg-card/60 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <MailCheck className="h-4 w-4 text-emerald-500" />
                          Delivery status by contact
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {deliveryStatuses.length} contact{deliveryStatuses.length === 1 ? '' : 's'} tracked across delivery, opens, and RFQs.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {deliveryStatuses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/60 py-12 text-center">
                          <MailX className="h-10 w-10 text-muted-foreground/60 mb-4" />
                          <p className="text-sm font-medium">Delivery updates will appear here</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            We&apos;ll log every delivery, bounce, spam complaint, and RFQ per recipient.
                          </p>
                        </div>
                      ) : (
                        deliveryStatuses.map((contact) => (
                          <div key={contact.email} className="rounded-xl border border-border/20 bg-background/60 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold leading-tight">
                                  {contact.name || contact.email}
                                </p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {contact.title && (
                                    <p>{contact.title}</p>
                                  )}
                                  {(contact.company || contact.location) && (
                                    <p className="flex flex-wrap items-center gap-2">
                                      {contact.company && (
                                        <span className="flex items-center gap-1">
                                          <Building2 className="h-3 w-3" />
                                          {contact.company}
                                        </span>
                                      )}
                                      {contact.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {contact.location}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  <p className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </p>
                                </div>
                              </div>
                              {contact.currentStatus && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-medium ${contact.currentStatus.badgeClass}`}
                                >
                                  {contact.currentStatus.label}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-3 space-y-1.5">
                              {contact.timeline.slice(0, 4).map((item) => (
                                <div
                                  key={`${item.timestamp}-${item.label}`}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  <span className={`inline-flex h-2 w-2 flex-shrink-0 rounded-full ${item.dotClass}`} />
                                  <span className="flex-1">{item.label}</span>
                                  <span className="whitespace-nowrap text-[11px] text-muted-foreground/70">
                                    {formatShortTimestamp(item.timestamp)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
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

