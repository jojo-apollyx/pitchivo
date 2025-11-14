'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Eye, Download, MessageSquare, QrCode, Link2, TrendingUp, Users, Calendar, Globe, Monitor, Smartphone, Tablet, ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProduct } from '@/lib/api/products'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfDay } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ProductAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { data: productData, isLoading: productLoading } = useProduct(productId)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10">
      {/* Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Product Analytics
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                {productData?.product_name || 'Product'} - Performance metrics and insights
              </p>
            </div>
            <div className="flex gap-2">
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

      {/* Analytics Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.total_visits || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics?.unique_visitors || 0} unique visitors
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">RFQ Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.rfq_submissions || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {conversionRate}% conversion rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.downloads || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Documents downloaded
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.unique_sessions || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics?.first_time_visitors || 0} first-time visitors
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Charts */}
          {analytics && analytics.daily_visits.length > 0 && (
            <>
              {/* Visits Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Visits Over Time</CardTitle>
                  <CardDescription>Daily visits, RFQ submissions, and downloads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.daily_visits}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="visits" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Visits" />
                      <Area type="monotone" dataKey="rfqs" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="RFQs" />
                      <Area type="monotone" dataKey="downloads" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Downloads" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Conversion Rate Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate Trend</CardTitle>
                  <CardDescription>Percentage of visits that resulted in RFQ submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.conversion_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} name="Conversion Rate (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* Channel Performance Chart */}
          {analytics && analytics.channel_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Visits by marketing channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.channel_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" fill="#3b82f6" name="Visits" />
                    <Bar dataKey="rfqs" fill="#10b981" name="RFQs" />
                    <Bar dataKey="downloads" fill="#f59e0b" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* URL vs QR Code Pie Chart */}
          {analytics && (analytics.url_vs_qr.url_visits > 0 || analytics.url_vs_qr.qr_visits > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Access Method Distribution</CardTitle>
                <CardDescription>URL clicks vs QR code scans</CardDescription>
              </CardHeader>
              <CardContent>
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Individual Access Logs */}
          {analytics && analytics.access_logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Individual Access Logs</CardTitle>
                <CardDescription>Detailed view of each visit with browser, location, and device information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.access_logs.slice(0, 50).map((log) => {
                    const isExpanded = expandedLogs.has(log.access_id)
                    const { browser, os } = parseUserAgent(log.user_agent)
                    const DeviceIcon = getDeviceIcon(log.device_type)

                    return (
                      <div key={log.access_id} className="border border-border/30 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => toggleLogExpansion(log.access_id)}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-muted-foreground flex-shrink-0">
                              {format(new Date(log.accessed_at), 'MMM d, yyyy HH:mm')}
                            </span>
                            {log.channel_name && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {log.channel_name}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {log.access_method === 'qr_code' ? 'QR Code' : 'URL'}
                            </Badge>
                            {log.country_code && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Globe className="h-3 w-3" />
                                {log.country_code}
                              </div>
                            )}
                            <DeviceIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{browser}</span>
                            {log.is_unique_visit && (
                              <Badge variant="default" className="text-xs">
                                New Visitor
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-border/30 bg-muted/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Browser & OS</p>
                                <p className="font-medium">{browser} on {os}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Device Type</p>
                                <p className="font-medium">{log.device_type || 'Unknown'}</p>
                              </div>
                              {log.city && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <p className="font-medium">{log.city}{log.country_code ? `, ${log.country_code}` : ''}</p>
                                  </div>
                                </div>
                              )}
                              {log.referrer && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Referrer</p>
                                  <p className="font-medium truncate">{log.referrer}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                                <p className="font-mono text-xs truncate">{log.session_id}</p>
                              </div>
                              {log.visitor_id && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Visitor ID</p>
                                  <p className="font-mono text-xs truncate">{log.visitor_id}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {analytics.access_logs.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Showing first 50 of {analytics.access_logs.length} access logs
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {(!analytics || analytics.total_visits === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Share your product link to start tracking visits and conversions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
