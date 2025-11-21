'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  MousePointerClick, 
  XCircle,
  BarChart3,
  Activity,
  DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface OverallStats {
  totalCampaigns: number
  activeCampaigns: number
  totalEmailsSent: number
  totalEmailsDelivered: number
  totalEmailsOpened: number
  totalEmailsClicked: number
  totalEmailsBounced: number
  totalRfqsReceived: number
  overallOpenRate: number
  overallClickRate: number
  overallDeliveryRate: number
  statusBreakdown: {
    draft: number
    scheduled: number
    active: number
    paused: number
    completed: number
    cancelled: number
  }
}

export function OverallStatistics() {
  const [stats, setStats] = useState<OverallStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('status, emails_sent, emails_delivered, emails_opened, emails_clicked, emails_bounced, rfqs_received')

      if (error) throw error

      if (!campaigns) {
        setStats(null)
        return
      }

      // Calculate aggregates
      const totalEmailsSent = campaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0)
      const totalEmailsDelivered = campaigns.reduce((sum, c) => sum + (c.emails_delivered || 0), 0)
      const totalEmailsOpened = campaigns.reduce((sum, c) => sum + (c.emails_opened || 0), 0)
      const totalEmailsClicked = campaigns.reduce((sum, c) => sum + (c.emails_clicked || 0), 0)
      const totalEmailsBounced = campaigns.reduce((sum, c) => sum + (c.emails_bounced || 0), 0)
      const totalRfqsReceived = campaigns.reduce((sum, c) => sum + (c.rfqs_received || 0), 0)

      // Calculate rates
      const overallDeliveryRate = totalEmailsSent > 0 
        ? Math.round((totalEmailsDelivered / totalEmailsSent) * 100) 
        : 0
      const overallOpenRate = totalEmailsSent > 0 
        ? Math.round((totalEmailsOpened / totalEmailsSent) * 100) 
        : 0
      const overallClickRate = totalEmailsSent > 0 
        ? Math.round((totalEmailsClicked / totalEmailsSent) * 100) 
        : 0

      // Status breakdown
      const statusBreakdown = {
        draft: campaigns.filter(c => c.status === 'draft').length,
        scheduled: campaigns.filter(c => c.status === 'scheduled').length,
        active: campaigns.filter(c => c.status === 'active').length,
        paused: campaigns.filter(c => c.status === 'paused').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        cancelled: campaigns.filter(c => c.status === 'cancelled').length,
      }

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: statusBreakdown.active,
        totalEmailsSent,
        totalEmailsDelivered,
        totalEmailsOpened,
        totalEmailsClicked,
        totalEmailsBounced,
        totalRfqsReceived,
        overallOpenRate,
        overallClickRate,
        overallDeliveryRate,
        statusBreakdown,
      })
    } catch (error) {
      console.error('Error loading overall statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading statistics...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No campaign data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Campaigns</span>
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{stats.totalCampaigns}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.activeCampaigns} active
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-400/5 border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Emails Sent</span>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold">{stats.totalEmailsSent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.totalEmailsDelivered.toLocaleString()} delivered
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-400/5 border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Delivery Rate</span>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold">{stats.overallDeliveryRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.totalEmailsBounced} bounced
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-400/5 border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">RFQs Received</span>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold">{stats.totalRfqsReceived}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Total inquiries
          </div>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Engagement Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Open Rate</span>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.overallOpenRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.totalEmailsOpened.toLocaleString()} opens
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${stats.overallOpenRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Click Rate</span>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.overallClickRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.totalEmailsClicked.toLocaleString()} clicks
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${stats.overallClickRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalEmailsSent > 0 
                ? ((stats.totalRfqsReceived / stats.totalEmailsSent) * 100).toFixed(2)
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              RFQs per email sent
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-purple-500"
                style={{ 
                  width: `${stats.totalEmailsSent > 0 
                    ? Math.min(((stats.totalRfqsReceived / stats.totalEmailsSent) * 100), 100)
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Campaign Status Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Campaign Status Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2 bg-gray-100">
              Draft
            </Badge>
            <div className="text-2xl font-bold">{stats.statusBreakdown.draft}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-700 border-blue-300">
              Scheduled
            </Badge>
            <div className="text-2xl font-bold">{stats.statusBreakdown.scheduled}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2 bg-green-100 text-green-700 border-green-300">
              Active
            </Badge>
            <div className="text-2xl font-bold">{stats.statusBreakdown.active}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2 bg-yellow-100 text-yellow-700 border-yellow-300">
              Paused
            </Badge>
            <div className="text-2xl font-bold">{stats.statusBreakdown.paused}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2 bg-purple-100 text-purple-700 border-purple-300">
              Completed
            </Badge>
            <div className="text-2xl font-bold">{stats.statusBreakdown.completed}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2 bg-red-100 text-red-700 border-red-300">
              Cancelled
            </Badge>
            <div className="text-2xl font-bold">{stats.statusBreakdown.cancelled}</div>
          </div>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Performance Insights
        </h3>
        <div className="space-y-2 text-sm">
          {stats.overallDeliveryRate >= 95 && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Excellent delivery rate! Your emails are reaching inboxes.</span>
            </div>
          )}
          {stats.overallDeliveryRate < 95 && stats.overallDeliveryRate >= 90 && (
            <div className="flex items-center gap-2 text-yellow-700">
              <Activity className="h-4 w-4" />
              <span>Good delivery rate, but there's room for improvement.</span>
            </div>
          )}
          {stats.overallDeliveryRate < 90 && (
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span>Low delivery rate. Check email quality and domain reputation.</span>
            </div>
          )}
          
          {stats.overallOpenRate >= 20 && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Strong open rate! Your subject lines are engaging.</span>
            </div>
          )}
          {stats.overallOpenRate < 20 && stats.overallOpenRate >= 10 && (
            <div className="flex items-center gap-2 text-yellow-700">
              <Activity className="h-4 w-4" />
              <span>Moderate open rate. Consider A/B testing subject lines.</span>
            </div>
          )}
          {stats.overallOpenRate < 10 && (
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span>Low open rate. Review subject line strategy and sending times.</span>
            </div>
          )}

          {stats.totalRfqsReceived > 0 && (
            <div className="flex items-center gap-2 text-purple-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>You've received {stats.totalRfqsReceived} RFQs! Your campaigns are converting.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

