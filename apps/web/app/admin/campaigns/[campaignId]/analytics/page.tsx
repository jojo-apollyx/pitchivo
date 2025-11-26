'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, MousePointerClick, MessageSquare, Activity, Building2, MapPin, Calendar, BarChart3, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const chartColors = {
  delivered: 'hsl(var(--primary))',
  opened: 'hsl(var(--accent))',
  rfq: 'hsl(var(--primary-dark))',
  bounced: 'hsl(var(--destructive))'
} as const

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
  org_id: string
  organizations?: {
    name: string
  }
  products?: {
    product_name: string
  }
}

export default function AdminCampaignAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.campaignId as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
    }
  }, [campaignId])

  async function loadCampaign() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          organizations(name),
          products(product_name)
        `)
        .eq('campaign_id', campaignId)
        .maybeSingle()

      if (error) throw error

      setCampaign(data as Campaign | null)
    } catch (error) {
      console.error('Error loading campaign:', error)
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign analytics...</p>
      </main>
    )
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => router.push('/admin/campaigns')}>
            Back to Campaign Management
          </Button>
        </div>
      </main>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'scheduled':
        return 'bg-background-secondary text-primary-dark border-border/50'
      case 'completed':
        return 'bg-background-secondary text-foreground border-border/50'
      case 'paused':
        return 'bg-background-secondary text-muted-foreground border-border/50'
      case 'cancelled':
        return 'bg-background-secondary text-muted-foreground border-border/50'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const openRate = campaign.emails_sent > 0 
    ? Math.round((campaign.emails_opened / campaign.emails_sent) * 100) 
    : 0
  const clickRate = campaign.emails_sent > 0
    ? Math.round((campaign.emails_clicked / campaign.emails_sent) * 100)
    : 0
  const deliverRate = campaign.emails_sent > 0
    ? Math.round((campaign.emails_delivered / campaign.emails_sent) * 100)
    : 0
  const conversionRate = campaign.emails_sent > 0
    ? Math.round((campaign.rfqs_received / campaign.emails_sent) * 100)
    : 0

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/campaigns')}
              className="gap-2 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Admin</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-display font-semibold truncate">{campaign.campaign_name}</h1>
              <p className="text-xs text-muted-foreground">
                Admin Analytics View
              </p>
            </div>
            <Badge variant="outline" className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Campaign Info Card */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Organization</h3>
                <p className="text-base">
                  {campaign.organizations?.name || 'Unknown Organization'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Product</h3>
                <p className="text-base">
                  {campaign.products?.product_name || 'Unknown Product'}
                </p>
              </div>
              {campaign.launched_at && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Launched At</h3>
                  <p className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(campaign.launched_at).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Created At</h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(campaign.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="h-4 w-4" />
                <span>Emails Sent</span>
              </div>
              <div className="text-2xl font-bold">{campaign.emails_sent}</div>
              <div className="text-xs text-muted-foreground">of {campaign.email_count} planned</div>
            </div>

            <div className="bg-card/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="h-4 w-4" />
                <span>Delivered</span>
              </div>
              <div className="text-2xl font-bold">{campaign.emails_delivered}</div>
              <div className="text-xs text-muted-foreground">{deliverRate}% deliver rate</div>
            </div>

            <div className="bg-card/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span>Opened</span>
              </div>
              <div className="text-2xl font-bold">{campaign.emails_opened}</div>
              <div className="text-xs text-muted-foreground">{openRate}% open rate</div>
            </div>

            <div className="bg-card/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MousePointerClick className="h-4 w-4" />
                <span>Clicked</span>
              </div>
              <div className="text-2xl font-bold">{campaign.emails_clicked}</div>
              <div className="text-xs text-muted-foreground">{clickRate}% click rate</div>
            </div>

            <div className="bg-card/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                <span>RFQs</span>
              </div>
              <div className="text-2xl font-bold text-accent">{campaign.rfqs_received}</div>
              <div className="text-xs text-muted-foreground">{conversionRate}% conversion</div>
            </div>

            <div className="bg-card/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="h-4 w-4 text-destructive" />
                <span>Bounced</span>
              </div>
              <div className="text-2xl font-bold text-destructive">{campaign.emails_bounced}</div>
              <div className="text-xs text-muted-foreground">
                {campaign.emails_sent > 0 
                  ? `${Math.round((campaign.emails_bounced / campaign.emails_sent) * 100)}%`
                  : '0%'
                } bounce rate
              </div>
            </div>
          </div>

          {/* Full Analytics Link */}
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 text-center">
            <BarChart3 className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">View Full Campaign Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4">
              See detailed engagement feed, delivery status by contact, and performance timeline
            </p>
            <Button
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Open Full Analytics Dashboard
            </Button>
          </div>

          {/* Admin Notes */}
          <div className="bg-card/60 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              Admin Notes
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• This is the admin view with summary metrics</p>
              <p>• Click "Open Full Analytics Dashboard" to see detailed engagement data</p>
              <p>• The full dashboard includes real-time activity feeds and contact-level tracking</p>
              <p>• Return to Campaign Management to send emails or update campaign status</p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </main>
  )
}

