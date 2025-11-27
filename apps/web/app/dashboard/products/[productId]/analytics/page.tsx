'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Eye, Download, MessageSquare, QrCode, Link2, TrendingUp, Users, Calendar, Globe, Monitor, Smartphone, Tablet, ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProduct } from '@/lib/api/products'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfDay } from 'date-fns'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DopamineLoading } from '@/components/ui/dopamine-loading'

interface AccessLog {
  access_id: string
  accessed_at: string
  access_method: string
  channel_id: string | null
  channel_name: string | null
  visitor_id: string | null
  session_id: string
  user_agent: string | null
  country_code: string | null
  city: string | null
  device_type: string | null
  referrer: string | null
  is_unique_visit: boolean
}

interface AnalyticsData {
  total_visits: number
  unique_visitors: number
  unique_sessions: number
  first_time_visitors: number
  downloads: number
  rfq_submissions: number
  field_reveals: number
  channel_breakdown: Array<{
    channel_id: string | null
    channel_name: string | null
    access_method: string
    visits: number
    rfqs: number
    downloads: number
  }>
  url_vs_qr: {
    url_visits: number
    qr_visits: number
    url_rfqs: number
    qr_rfqs: number
  }
  access_logs: AccessLog[]
  daily_visits: Array<{ date: string; visits: number; rfqs: number; downloads: number }>
  conversion_trend: Array<{ date: string; rate: number }>
}

export default function ProductAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { data: productData, isLoading: productLoading } = useProduct(productId)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  
  // Use CSS theme variables for consistent styling
  const themeColors = {
    primary: 'hsl(var(--primary-dark))',
    secondary: 'hsl(var(--primary))',
    accent: 'hsl(var(--accent-surface))'
  }
  
  // Chart colors array (for pie chart) - using CSS variables via computed styles
  const COLORS = ['hsl(var(--primary-dark))', 'hsl(var(--primary))', 'hsl(var(--accent-surface))']

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!productId) return

      try {
        const supabase = createClient()

        // Calculate date range
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
        const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString()

        // Get access logs
        let query = supabase
          .from('product_access_logs')
          .select('*')
          .eq('product_id', productId)
          .order('accessed_at', { ascending: false })

        if (timeRange !== 'all') {
          query = query.gte('accessed_at', startDate)
        }

        const { data: accessLogs, error: logsError } = await query

        if (logsError) throw logsError

        // Get actions
        const { data: actions, error: actionsError } = await supabase
          .from('product_access_actions')
          .select('*')
          .eq('product_id', productId)

        if (actionsError) throw actionsError

        // Calculate metrics
        const total_visits = accessLogs?.length || 0
        const unique_visitors = new Set(accessLogs?.map((log) => log.visitor_id).filter(Boolean)).size
        const unique_sessions = new Set(accessLogs?.map((log) => log.session_id)).size
        const first_time_visitors = accessLogs?.filter((log) => log.is_unique_visit).length || 0

        const downloads = actions?.filter((a) => a.action_type === 'document_download').length || 0
        const rfq_submissions = actions?.filter((a) => a.action_type === 'rfq_submit').length || 0
        const field_reveals = actions?.filter((a) => a.action_type === 'field_reveal').length || 0

        // Channel breakdown
        const channelMap = new Map<string, { visits: number; rfqs: number; downloads: number }>()
        accessLogs?.forEach((log) => {
          const key = `${log.channel_id || 'direct'}_${log.access_method}`
          if (!channelMap.has(key)) {
            channelMap.set(key, { visits: 0, rfqs: 0, downloads: 0 })
          }
          channelMap.get(key)!.visits++
        })

        actions?.forEach((action) => {
          const accessLog = accessLogs?.find((log) => log.access_id === action.access_id)
          if (accessLog) {
            const key = `${accessLog.channel_id || 'direct'}_${accessLog.access_method}`
            if (channelMap.has(key)) {
              if (action.action_type === 'rfq_submit') channelMap.get(key)!.rfqs++
              if (action.action_type === 'document_download') channelMap.get(key)!.downloads++
            }
          }
        })

        const channel_breakdown = Array.from(channelMap.entries()).map(([key, stats]) => {
          const [channel_id, access_method] = key.split('_')
          const log = accessLogs?.find((l) => (l.channel_id || 'direct') === channel_id && l.access_method === access_method)
          return {
            channel_id: channel_id === 'direct' ? null : channel_id,
            channel_name: log?.channel_name || null,
            access_method,
            visits: stats.visits,
            rfqs: stats.rfqs,
            downloads: stats.downloads,
          }
        })

        // URL vs QR breakdown
        const url_visits = accessLogs?.filter((log) => log.access_method === 'url').length || 0
        const qr_visits = accessLogs?.filter((log) => log.access_method === 'qr_code').length || 0

        const url_rfqs =
          actions?.filter((a) => {
            if (a.action_type !== 'rfq_submit') return false
            const log = accessLogs?.find((l) => l.access_id === a.access_id)
            return log?.access_method === 'url'
          }).length || 0

        const qr_rfqs =
          actions?.filter((a) => {
            if (a.action_type !== 'rfq_submit') return false
            const log = accessLogs?.find((l) => l.access_id === a.access_id)
            return log?.access_method === 'qr_code'
          }).length || 0

        // Daily visits trend
        const dailyMap = new Map<string, { visits: number; rfqs: number; downloads: number }>()
        accessLogs?.forEach((log) => {
          const date = format(new Date(log.accessed_at), 'yyyy-MM-dd')
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { visits: 0, rfqs: 0, downloads: 0 })
          }
          dailyMap.get(date)!.visits++
        })

        actions?.forEach((action) => {
          const log = accessLogs?.find((l) => l.access_id === action.access_id)
          if (log) {
            const date = format(new Date(log.accessed_at), 'yyyy-MM-dd')
            if (dailyMap.has(date)) {
              if (action.action_type === 'rfq_submit') dailyMap.get(date)!.rfqs++
              if (action.action_type === 'document_download') dailyMap.get(date)!.downloads++
            }
          }
        })

        const daily_visits = Array.from(dailyMap.entries())
          .map(([date, stats]) => ({
            date: format(new Date(date), 'MMM d'),
            visits: stats.visits,
            rfqs: stats.rfqs,
            downloads: stats.downloads,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Conversion trend
        const conversion_trend = daily_visits.map((day) => ({
          date: day.date,
          rate: day.visits > 0 ? (day.rfqs / day.visits) * 100 : 0,
        }))

        setAnalytics({
          total_visits,
          unique_visitors,
          unique_sessions,
          first_time_visitors,
          downloads,
          rfq_submissions,
          field_reveals,
          channel_breakdown,
          url_vs_qr: {
            url_visits,
            qr_visits,
            url_rfqs,
            qr_rfqs,
          },
          access_logs: accessLogs || [],
          daily_visits,
          conversion_trend,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [productId, timeRange])

  const conversionRate = analytics
    ? analytics.total_visits > 0
      ? ((analytics.rfq_submissions / analytics.total_visits) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  const toggleLogExpansion = (accessId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev)
      if (next.has(accessId)) {
        next.delete(accessId)
      } else {
        next.add(accessId)
      }
      return next
    })
  }

  const getDeviceIcon = (deviceType: string | null) => {
    if (!deviceType) return Monitor
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Monitor
    }
  }

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' }
    
    // Simple browser detection
    let browser = 'Unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    else if (userAgent.includes('Opera')) browser = 'Opera'

    // Simple OS detection
    let os = 'Unknown'
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return { browser, os }
  }

  if (productLoading || isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <DopamineLoading variant="analytics" message="Loading product analytics..." />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header - Sticky */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
              className="gap-2 hover:bg-accent-surface"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary-dark" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  Product Analytics
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
                {productData?.product_name || 'Product'} · Performance insights & visitor behavior
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === 'all' ? 'All Time' : range}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Visits */}
            <div className="bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                <div className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10">
                  <Eye className="h-4 w-4 text-primary-dark" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground">{analytics?.total_visits || 0}</p>
              <p className="text-sm mt-1 text-muted-foreground">
                {analytics?.unique_visitors || 0} unique visitors
              </p>
            </div>

            {/* RFQ Submissions */}
            <div className="bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">RFQ Submissions</p>
                <div className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10">
                  <MessageSquare className="h-4 w-4 text-primary-dark" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground">{analytics?.rfq_submissions || 0}</p>
              <p className="text-sm mt-1 text-semantic-success">
                {conversionRate}% conversion
              </p>
            </div>

            {/* Downloads */}
            <div className="bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Downloads</p>
                <div className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10">
                  <Download className="h-4 w-4 text-primary-dark" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground">{analytics?.downloads || 0}</p>
              <p className="text-sm mt-1 text-muted-foreground">
                documents downloaded
              </p>
            </div>

            {/* Sessions */}
            <div className="bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <div className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10">
                  <Users className="h-4 w-4 text-primary-dark" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground">{analytics?.unique_sessions || 0}</p>
              <p className="text-sm mt-1 text-muted-foreground">
                {analytics?.first_time_visitors || 0} first-time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      {analytics && analytics.daily_visits.length > 0 && (
        <>
          {/* Visits Over Time */}
          <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary-dark" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Visits Over Time</h2>
                  <p className="text-sm text-muted-foreground">Daily visits, RFQ submissions, and downloads</p>
                </div>
              </div>
              <div className="bg-background-secondary rounded-lg p-4 sm:p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.daily_visits}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary-dark))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary-dark))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRfqs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--semantic-success))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--semantic-success))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '12px'
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="visits" stackId="1" stroke="hsl(var(--primary-dark))" fill="url(#colorVisits)" strokeWidth={2} name="Visits" />
                    <Area type="monotone" dataKey="rfqs" stackId="2" stroke="hsl(var(--semantic-success))" fill="url(#colorRfqs)" strokeWidth={2} name="RFQs" />
                    <Area type="monotone" dataKey="downloads" stackId="3" stroke="hsl(var(--primary))" fill="url(#colorDownloads)" strokeWidth={2} name="Downloads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Conversion Rate Trend */}
          <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-dark" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Conversion Rate Trend</h2>
                  <p className="text-sm text-muted-foreground">Percentage of visits that resulted in RFQ submissions</p>
                </div>
              </div>
              <div className="bg-background-secondary rounded-lg p-4 sm:p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.conversion_trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-muted-foreground" />
                    <YAxis domain={[0, 100]} className="text-muted-foreground" />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="hsl(var(--primary-dark))" 
                      strokeWidth={2} 
                      name="Conversion Rate (%)"
                      dot={{ fill: 'hsl(var(--primary-dark))', r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Channel Performance */}
      {analytics && analytics.channel_breakdown.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                <Link2 className="h-5 w-5 text-primary-dark" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Channel Performance</h2>
                <p className="text-sm text-muted-foreground">Visits by marketing channel</p>
              </div>
            </div>
            <div className="bg-background-secondary rounded-lg p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.channel_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="channel_name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="visits" fill="hsl(var(--primary-dark))" name="Visits" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rfqs" fill="hsl(var(--semantic-success))" name="RFQs" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="downloads" fill="hsl(var(--primary))" name="Downloads" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* URL vs QR Code */}
      {analytics && (analytics.url_vs_qr.url_visits > 0 || analytics.url_vs_qr.qr_visits > 0) && (
        <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary-dark" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Access Method Distribution</h2>
                <p className="text-sm text-muted-foreground">URL clicks vs QR code scans</p>
              </div>
            </div>
            <div className="bg-background-secondary rounded-lg p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'URL', value: analytics.url_vs_qr.url_visits },
                      { name: 'QR Code', value: analytics.url_vs_qr.qr_visits },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary-dark))"
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--primary-dark))" />
                    <Cell fill="hsl(var(--primary))" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Individual Access Logs */}
      {analytics && analytics.access_logs.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-dark" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent Access Logs</h2>
                <p className="text-sm text-muted-foreground">Most recent 15 visits with browser, location, and device information</p>
              </div>
            </div>
            <div className="bg-background rounded-lg divide-y divide-border/30">
              {analytics.access_logs.slice(0, 15).map((log) => {
                const isExpanded = expandedLogs.has(log.access_id)
                const { browser, os } = parseUserAgent(log.user_agent)
                const DeviceIcon = getDeviceIcon(log.device_type)

                return (
                  <div 
                    key={log.access_id} 
                    className={`p-4 transition-colors cursor-pointer ${isExpanded ? 'bg-accent-surface' : 'hover:bg-background-secondary'}`}
                    onClick={() => toggleLogExpansion(log.access_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary-dark" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.accessed_at), 'MMM d, HH:mm')}
                          </span>
                          {log.channel_name && (
                            <Badge variant="outline" className="text-xs">
                              {log.channel_name}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {log.access_method === 'qr_code' ? 'QR Code' : 'URL'}
                          </Badge>
                          {log.country_code && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              {log.country_code}
                              {log.city && ` · ${log.city}`}
                            </div>
                          )}
                          {!log.country_code && log.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {log.city}
                            </div>
                          )}
                          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground hidden sm:inline">{browser}</span>
                          {log.is_unique_visit && (
                            <Badge className="text-xs">New</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 rounded-lg bg-background-secondary">
                            <p className="text-xs text-muted-foreground mb-1">Browser & OS</p>
                            <p className="font-medium text-foreground">{browser} on {os}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background-secondary">
                            <p className="text-xs text-muted-foreground mb-1">Device Type</p>
                            <p className="font-medium text-foreground">{log.device_type || 'Unknown'}</p>
                          </div>
                          {log.city && (
                            <div className="p-3 rounded-lg bg-background-secondary">
                              <p className="text-xs text-muted-foreground mb-1">Location</p>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <p className="font-medium text-foreground">{log.city}{log.country_code ? `, ${log.country_code}` : ''}</p>
                              </div>
                            </div>
                          )}
                          {log.referrer && (
                            <div className="p-3 rounded-lg bg-background-secondary">
                              <p className="text-xs text-muted-foreground mb-1">Referrer</p>
                              <p className="font-medium truncate text-xs text-foreground">{log.referrer}</p>
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-background-secondary">
                            <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                            <p className="font-mono text-xs truncate text-foreground">{log.session_id}</p>
                          </div>
                          {log.visitor_id && (
                            <div className="p-3 rounded-lg bg-background-secondary">
                              <p className="text-xs text-muted-foreground mb-1">Visitor ID</p>
                              <p className="font-mono text-xs truncate text-foreground">{log.visitor_id}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {analytics.access_logs.length > 15 && (
              <p className="text-sm text-muted-foreground mt-6 text-center p-4 rounded-lg bg-background-secondary">
                Showing most recent 15 of {analytics.access_logs.length} access logs
              </p>
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!analytics || analytics.total_visits === 0) && (
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="h-16 w-16 mx-auto rounded-lg bg-accent-surface flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary-dark" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              No Analytics Data Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Share your product link to start tracking visits, conversions, and visitor insights.
            </p>
            <Button onClick={() => router.back()}>
              Go Back to Product
            </Button>
          </div>
        </section>
      )}
    </main>
  )
}
