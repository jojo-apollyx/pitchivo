'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Plus, TrendingUp, Users, MousePointerClick, MessageSquare, Calendar, ExternalLink, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { generateMockActivities } from '@/lib/mock-data/buyers'

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
  email_count: number
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  rfqs_received: number
  launched_at: string | null
  created_at: string
  products?: {
    product_name: string
  }
}

interface Activity {
  time: string
  type: string
  buyerCompany: string
  description: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, products(product_name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Simulate some progress for demo
      const campaignsWithProgress = (data || []).map(campaign => {
        const progress = Math.min((campaign.emails_sent / campaign.email_count) * 100, 100)
        const openRate = campaign.emails_sent > 0 
          ? Math.round((campaign.emails_opened / campaign.emails_sent) * 100) 
          : 0
        const clickRate = campaign.emails_sent > 0
          ? Math.round((campaign.emails_clicked / campaign.emails_sent) * 100)
          : 0

        return {
          ...campaign,
          progress,
          openRate,
          clickRate
        }
      })

      setCampaigns(campaignsWithProgress as Campaign[])

      // Auto-select first campaign if exists
      if (campaignsWithProgress.length > 0) {
        const first = campaignsWithProgress[0]
        setSelectedCampaign(first as Campaign)
        // @ts-ignore
        setActivities(generateMockActivities(first.campaign_name))
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCreateCampaign() {
    router.push('/dashboard/campaigns/create/product')
  }

  function handleSelectCampaign(campaign: Campaign) {
    setSelectedCampaign(campaign)
    setActivities(generateMockActivities(campaign.campaign_name))
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
      case 'email_opened':
        return <Mail className="h-3 w-3" />
      case 'email_clicked':
        return <MousePointerClick className="h-3 w-3" />
      case 'product_viewed':
        return <ExternalLink className="h-3 w-3" />
      case 'rfq_submitted':
        return <MessageSquare className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'rfq_submitted':
        return 'text-accent'
      case 'product_viewed':
        return 'text-primary'
      case 'email_clicked':
        return 'text-blue-600'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="relative">
          {/* Page Header */}
          <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Campaigns</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Create and manage your email campaigns
                  </p>
                </div>
                <Button onClick={handleCreateCampaign} className="gap-2 min-h-[44px]">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          </section>

          {/* Empty State */}
          <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">No campaigns yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Start your first email campaign to reach potential buyers
              </p>
              <Button onClick={handleCreateCampaign} className="gap-2 min-h-[44px]">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Campaigns</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'} created
              </p>
            </div>
            <Button onClick={handleCreateCampaign} className="gap-2 min-h-[44px]">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Campaigns List */}
          <div className="divide-y divide-border/30">
            {campaigns.map((campaign) => {
              // @ts-ignore
              const progress = campaign.progress || 0
              // @ts-ignore
              const openRate = campaign.openRate || 0
              // @ts-ignore
              const clickRate = campaign.clickRate || 0

              return (
                <button
                  key={campaign.campaign_id}
                  onClick={() => handleSelectCampaign(campaign)}
                  className={`
                    w-full text-left p-4 sm:p-6 hover:bg-accent/5 transition-colors
                    ${selectedCampaign?.campaign_id === campaign.campaign_id ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: Campaign Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1">{campaign.campaign_name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(campaign.status)}`}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                            {campaign.launched_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(campaign.launched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {/* @ts-ignore */}
                          {campaign.products && <p className="text-sm text-muted-foreground">{campaign.products.product_name}</p>}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{campaign.emails_sent} / {campaign.email_count} sent</span>
                        </div>
                        <div className="w-full bg-border/30 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Opens</span>
                          </div>
                          <div className="text-base font-bold">{openRate}%</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MousePointerClick className="h-3 w-3" />
                            <span>Clicks</span>
                          </div>
                          <div className="text-base font-bold">{clickRate}%</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>RFQs</span>
                          </div>
                          <div className="text-base font-bold text-accent">{campaign.rfqs_received}</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Reached</span>
                          </div>
                          <div className="text-base font-bold">{campaign.emails_sent}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Activity Feed */}
          {selectedCampaign && activities.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="divide-y divide-border/30">
                {activities.map((activity, index) => (
                  <div key={index} className="py-3 flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg bg-card/50 flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-sm">{activity.buyerCompany}</span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
