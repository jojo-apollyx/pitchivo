'use client'

import { useEffect, useState } from 'react'
import { Mail, TrendingUp, MousePointerClick, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { SmartleadEventStats } from '@/components/smartlead/event-stats'
import { SmartleadEventTimeline } from '@/components/smartlead/event-timeline'

interface OverviewTabProps {
  campaign: any
  onRefresh: () => void
}

export function OverviewTab({ campaign, onRefresh }: OverviewTabProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverviewData()
  }, [campaign.campaign_id])

  async function loadOverviewData() {
    try {
      setLoading(true)
      
      // Load analytics from Smartlead if available
      if (campaign.smartlead_campaign_id) {
        const analyticsRes = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/analytics`)
        if (analyticsRes.ok) {
          const data = await analyticsRes.json()
          // API returns { success: true, analytics: {...} }
          setAnalytics(data.analytics || data)
        }
      }
    } catch (error) {
      console.error('Error loading overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const totalSent = analytics?.sent_count || campaign.emails_sent || 0
  const totalOpened = analytics?.open_count || campaign.emails_opened || 0
  const totalClicked = analytics?.click_count || campaign.emails_clicked || 0
  const totalReplies = analytics?.reply_count || campaign.replies_received || 0
  const totalBounced = analytics?.bounce_count || campaign.emails_bounced || 0
  
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0'
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0'
  const replyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : '0.0'
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0.0'

  const deliveryRate = totalSent > 0 ? (((totalSent - totalBounced) / totalSent) * 100).toFixed(1) : '100.0'
  
  // Lead stats
  const leadStats = analytics?.campaign_lead_stats || {
    total: 0,
    completed: 0,
    inprogress: 0,
    notStarted: 0,
    blocked: 0,
    stopped: 0
  }

  const progress = leadStats.total > 0 
    ? ((leadStats.completed / leadStats.total) * 100).toFixed(0)
    : '0'

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              of {campaign.email_count.toLocaleString()} planned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalOpened.toLocaleString()} unique opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalClicked.toLocaleString()} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{replyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalReplies.toLocaleString()} replies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Progress</CardTitle>
            <CardDescription>
              Lead progression through sequences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={parseInt(progress)} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.completed}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.inprogress}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Not Started</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.notStarted}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Blocked</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.blocked + leadStats.stopped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deliverability Health</CardTitle>
            <CardDescription>
              Email delivery performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Delivery Rate</span>
                <Badge variant={parseFloat(deliveryRate) >= 95 ? 'default' : parseFloat(deliveryRate) >= 85 ? 'secondary' : 'destructive'}>
                  {deliveryRate}%
                </Badge>
              </div>
              <Progress 
                value={parseFloat(deliveryRate)} 
                className={`h-2 ${parseFloat(deliveryRate) >= 95 ? 'bg-green-500' : parseFloat(deliveryRate) >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivered</p>
                <p className="text-xl font-bold">{(totalSent - totalBounced).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bounced</p>
                <p className="text-xl font-bold text-destructive">{totalBounced.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{bounceRate}%</p>
              </div>
            </div>

            {parseFloat(bounceRate) > 5 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  High bounce rate detected. Consider reviewing email list quality.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smartlead Email Events - Premium View */}
      {campaign.smartlead_campaign_id && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Email Event Analytics</h3>
            <Badge variant="secondary">Live Data</Badge>
          </div>

          {/* Event Stats */}
          <SmartleadEventStats 
            campaignId={campaign.campaign_id} 
            isAdmin={true}
            showChart={true}
          />

          {/* Event Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>
                Real-time email events from Smartlead webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SmartleadEventTimeline 
                campaignId={campaign.campaign_id}
                isAdmin={true}
                limit={50}
              />
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}

