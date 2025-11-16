'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, MousePointerClick, MessageSquare, ExternalLink, Activity, Building2, MapPin, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

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
        <div className="max-w-7xl mx-auto">
          {/* Campaign Overview */}
          <div className="bg-card/50 rounded-xl p-6 mb-6 border border-border/30">
            <div className="flex items-start gap-4 mb-6">
              {/* Product Image */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {productImageUrl ? (
                  <img 
                    src={productImageUrl}
                    alt={campaign.products?.product_name || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={`text-3xl sm:text-4xl font-bold text-primary/50 ${productImageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                  {campaign.products?.product_name?.charAt(0) || 'P'}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`text-xs ${getStatusColor(campaign.status)}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                  {campaign.launched_at && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Launched {new Date(campaign.launched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {campaign.products && (
                  <h2 className="text-lg font-semibold mb-2">{campaign.products.product_name}</h2>
                )}
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span>{campaign.emails_sent} / {campaign.email_count} sent</span>
                  </div>
                  <div className="w-full bg-border/30 rounded-full h-2.5">
                    <div
                      className="bg-primary rounded-full h-2.5 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-card rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Delivered</span>
                    </div>
                    <div className="text-xl font-bold">{deliverRate}%</div>
                    <div className="text-xs text-muted-foreground">{campaign.emails_delivered}</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" />
                      <span>Opened</span>
                    </div>
                    <div className="text-xl font-bold">{openRate}%</div>
                    <div className="text-xs text-muted-foreground">{campaign.emails_opened}</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <MousePointerClick className="h-3 w-3" />
                      <span>Clicked</span>
                    </div>
                    <div className="text-xl font-bold">{clickRate}%</div>
                    <div className="text-xs text-muted-foreground">{campaign.emails_clicked}</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>RFQs</span>
                    </div>
                    <div className="text-xl font-bold text-accent">{campaign.rfqs_received}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Campaign Activities ({activities.length})</h2>
            {activities.length === 0 ? (
              <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No activities yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const metadata = activity.metadata || {}
                  const name = metadata.name || activity.contact_email?.split('@')[0] || 'Unknown'
                  const title = metadata.title || ''
                  const location = metadata.location || ''
                  const company = activity.buyer_company || metadata.company || 'Unknown Company'
                  const email = activity.contact_email || ''

                  return (
                    <div key={activity.activity_id} className="bg-card/50 rounded-lg p-4 border border-border/30 hover:bg-card/70 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.activity_type)}`}>
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-sm">{name}</span>
                                {title && (
                                  <span className="text-xs text-muted-foreground">• {title}</span>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {getActivityLabel(activity.activity_type)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  <span className="line-clamp-1">{company}</span>
                                </div>
                                {location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{location}</span>
                                  </div>
                                )}
                                {email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="line-clamp-1">{email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

