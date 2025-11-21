'use client'

import { useEffect, useState } from 'react'
import { Calendar,TrendingUp, Users, MousePointerClick, MessageSquare, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { toast } from 'sonner'

interface AnalyticsTabProps {
  campaign: any
}

export function AnalyticsTab({ campaign }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{from: Date | undefined; to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [campaign.smartlead_campaign_id])

  async function loadAnalytics() {
    if (!campaign.smartlead_campaign_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/analytics`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load analytics')
      }
      
      const data = await response.json()
      // API returns { success: true, analytics: {...} }
      setAnalytics(data.analytics || data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalyticsByDate() {
    if (!dateRange.from || !dateRange.to || !campaign.smartlead_campaign_id) return

    try {
      setLoading(true)
      const startDate = dateRange.from.toISOString().split('T')[0]
      const endDate = dateRange.to.toISOString().split('T')[0]
      
      const response = await fetch(
        `/api/smartlead/campaigns/${campaign.campaign_id}/analytics-by-date?start_date=${startDate}&end_date=${endDate}`
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load date range analytics')
      }
      
      const data = await response.json()
      // API returns { success: true, analytics: {...} }
      setAnalytics(data.analytics || data)
      toast.success('Analytics updated for selected date range')
    } catch (error) {
      console.error('Error loading date range analytics:', error)
      toast.error('Failed to load date range analytics')
    } finally {
      setLoading(false)
    }
  }

  if (!campaign.smartlead_campaign_id) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not synced with Smartlead</p>
        <p className="text-sm text-muted-foreground mt-2">Analytics are only available for synced campaigns</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = analytics || {}
  
  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Date Range</CardTitle>
          <CardDescription>
            View analytics for a specific date range (max 30 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
            />
            <Button onClick={loadAnalyticsByDate} disabled={!dateRange.from || !dateRange.to}>
              Apply Date Range
            </Button>
            <Button variant="outline" onClick={loadAnalytics}>
              Reset to All Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Opens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_open_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {stats.open_count || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_click_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {stats.click_count || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replies</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reply_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounced</CardTitle>
            <Mail className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.bounce_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unsubscribed_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Stats Breakdown */}
      {stats.campaign_lead_stats && (
        <Card>
          <CardHeader>
            <CardTitle>Lead Progress</CardTitle>
            <CardDescription>Breakdown of lead stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Leads</p>
                <p className="text-2xl font-bold">{stats.campaign_lead_stats.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.campaign_lead_stats.completed || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.campaign_lead_stats.inprogress || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Not Started</p>
                <p className="text-2xl font-bold text-gray-600">{stats.campaign_lead_stats.notStarted || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Blocked</p>
                <p className="text-2xl font-bold text-red-600">{stats.campaign_lead_stats.blocked || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stopped</p>
                <p className="text-2xl font-bold text-orange-600">{stats.campaign_lead_stats.stopped || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Status */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <span className="text-lg font-semibold">{stats.status || campaign.status || 'Unknown'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

