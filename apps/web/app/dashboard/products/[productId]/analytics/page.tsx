'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Eye, Download, MessageSquare, QrCode, Link2, TrendingUp, Users, Calendar, Globe, Monitor, Smartphone, Tablet, ChevronDown, ChevronRight, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProduct } from '@/lib/api/products'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfDay } from 'date-fns'
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

export default function ProductAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { data: productData, isLoading: productLoading } = useProduct(productId)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  
  // Theme colors from organization
  const [themeColors, setThemeColors] = useState({
    primary: '#8B5CF6',    // Default purple
    secondary: '#EC4899',  // Default pink
    accent: '#F59E0B'      // Default amber
  })
  
  // Chart colors array (for pie chart)
  const COLORS = [themeColors.primary, themeColors.secondary, themeColors.accent]

  // Fetch organization theme colors
  useEffect(() => {
    const fetchThemeColors = async () => {
      if (!productData?.org_id) return

      try {
        const supabase = createClient()
        const { data: orgData } = await supabase
          .from('organizations')
          .select('primary_color, secondary_color, accent_color')
          .eq('id', productData.org_id)
          .single()

        if (orgData) {
          setThemeColors({
            primary: orgData.primary_color || '#8B5CF6',
            secondary: orgData.secondary_color || '#EC4899',
            accent: orgData.accent_color || '#F59E0B'
          })
        }
      } catch (error) {
        console.error('Error fetching theme colors:', error)
      }
    }

    fetchThemeColors()
  }, [productData?.org_id])

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
          <div className="relative">
            <Sparkles className="h-8 w-8 animate-pulse mx-auto mb-4" style={{ color: themeColors.primary }} />
            <div className="absolute inset-0 blur-xl animate-pulse" style={{ backgroundColor: `${themeColors.accent}33` }} />
          </div>
          <p className="text-muted-foreground">Loading premium analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background - theme gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: `${themeColors.primary}0D` }} />
        <div className="absolute top-40 left-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: `${themeColors.secondary}0D` }} />
        <div className="absolute bottom-20 right-40 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: `${themeColors.accent}08` }} />
      </div>

      {/* Header - Sticky */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2 hover:bg-[#E9A6F5]/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: `linear-gradient(135deg, ${themeColors.primary}33, ${themeColors.secondary}33)` }}>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: themeColors.primary }} />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                  <span style={{
                    background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Product Analytics
                  </span>
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
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
                  className={
                    timeRange === range
                      ? 'bg-gradient-to-r from-[#E9A6F5] to-[#F5A6D0] text-white border-none hover:from-[#E9A6F5]/90 hover:to-[#F5A6D0]/90'
                      : 'border-[#E9A6F5]/30 hover:bg-[#E9A6F5]/10'
                  }
                >
                  {range === 'all' ? 'All Time' : range}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Visits */}
            <div 
              className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${themeColors.primary}0D, ${themeColors.primary}1A)` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.primary}1A, ${themeColors.accent}1A)`
                e.currentTarget.style.boxShadow = `0 8px 24px ${themeColors.accent}1A`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.primary}0D, ${themeColors.primary}1A)`
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}33` }}>
                  <Eye className="h-4 w-4" style={{ color: themeColors.primary }} />
                </div>
                <TrendingUp className="h-4 w-4" style={{ color: `${themeColors.accent}` }} />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Visits</p>
              <p className="text-3xl font-bold text-foreground">{analytics?.total_visits || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics?.unique_visitors || 0} unique visitors
              </p>
            </div>

            {/* RFQ Submissions */}
            <div 
              className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${themeColors.secondary}0D, ${themeColors.secondary}1A)` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.secondary}1A, ${themeColors.accent}1A)`
                e.currentTarget.style.boxShadow = `0 8px 24px ${themeColors.accent}1A`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.secondary}0D, ${themeColors.secondary}1A)`
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.secondary}33` }}>
                  <MessageSquare className="h-4 w-4" style={{ color: themeColors.secondary }} />
                </div>
                <Badge className="border-none" style={{ backgroundColor: `${themeColors.secondary}33`, color: themeColors.secondary }}>
                  {conversionRate}%
                </Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">RFQ Submissions</p>
              <p className="text-3xl font-bold text-foreground">{analytics?.rfq_submissions || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                conversion rate
              </p>
            </div>

            {/* Downloads */}
            <div 
              className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${themeColors.primary}0D, ${themeColors.primary}1A)` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.primary}1A, ${themeColors.accent}1A)`
                e.currentTarget.style.boxShadow = `0 8px 24px ${themeColors.accent}1A`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.primary}0D, ${themeColors.primary}1A)`
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}33` }}>
                  <Download className="h-4 w-4" style={{ color: themeColors.primary }} />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Downloads</p>
              <p className="text-3xl font-bold text-foreground">{analytics?.downloads || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                documents downloaded
              </p>
            </div>

            {/* Sessions */}
            <div 
              className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${themeColors.secondary}0D, ${themeColors.secondary}1A)` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.secondary}1A, ${themeColors.accent}1A)`
                e.currentTarget.style.boxShadow = `0 8px 24px ${themeColors.accent}1A`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeColors.secondary}0D, ${themeColors.secondary}1A)`
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.secondary}33` }}>
                  <Users className="h-4 w-4" style={{ color: themeColors.secondary }} />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Sessions</p>
              <p className="text-3xl font-bold text-foreground">{analytics?.unique_sessions || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics?.first_time_visitors || 0} first-time visitors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Section - Integral Flow */}
      {analytics && analytics.daily_visits.length > 0 && (
        <>
          {/* Visits Over Time */}
          <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#E9A6F5]/10">
                  <BarChart3 className="h-5 w-5 text-[#E9A6F5]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">Visits Over Time</h2>
                  <p className="text-sm text-muted-foreground">Daily visits, RFQ submissions, and downloads</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E9A6F5]/5 to-transparent">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.daily_visits}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E9A6F5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E9A6F5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRfqs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5A6D0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F5A6D0" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5C6A6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F5C6A6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9A6F5" strokeOpacity={0.1} />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #E9A6F5',
                        borderRadius: '12px',
                        padding: '12px'
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="visits" stackId="1" stroke="#E9A6F5" fill="url(#colorVisits)" strokeWidth={2} name="Visits" />
                    <Area type="monotone" dataKey="rfqs" stackId="2" stroke="#F5A6D0" fill="url(#colorRfqs)" strokeWidth={2} name="RFQs" />
                    <Area type="monotone" dataKey="downloads" stackId="3" stroke="#F5C6A6" fill="url(#colorDownloads)" strokeWidth={2} name="Downloads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Conversion Rate Trend */}
          <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#C6A6F5]/10">
                  <TrendingUp className="h-5 w-5 text-[#C6A6F5]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">Conversion Rate Trend</h2>
                  <p className="text-sm text-muted-foreground">Percentage of visits that resulted in RFQ submissions</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#C6A6F5]/5 to-transparent">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.conversion_trend}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#E9A6F5" />
                        <stop offset="50%" stopColor="#C6A6F5" />
                        <stop offset="100%" stopColor="#A6D4F5" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C6A6F5" strokeOpacity={0.1} />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis domain={[0, 100]} stroke="#888" />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #C6A6F5',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="url(#lineGradient)" 
                      strokeWidth={3} 
                      name="Conversion Rate (%)"
                      dot={{ fill: '#C6A6F5', r: 4 }}
                      activeDot={{ r: 6 }}
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
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[#F5A6D0]/10">
                <Link2 className="h-5 w-5 text-[#F5A6D0]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Channel Performance</h2>
                <p className="text-sm text-muted-foreground">Visits by marketing channel</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F5A6D0]/5 to-transparent">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.channel_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5A6D0" strokeOpacity={0.1} />
                  <XAxis dataKey="channel_name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #F5A6D0',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="visits" fill="#E9A6F5" name="Visits" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="rfqs" fill="#F5A6D0" name="RFQs" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="downloads" fill="#F5C6A6" name="Downloads" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* URL vs QR Code */}
      {analytics && (analytics.url_vs_qr.url_visits > 0 || analytics.url_vs_qr.qr_visits > 0) && (
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[#A6D4F5]/10">
                <QrCode className="h-5 w-5 text-[#A6D4F5]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Access Method Distribution</h2>
                <p className="text-sm text-muted-foreground">URL clicks vs QR code scans</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#A6D4F5]/5 to-transparent">
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
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #A6D4F5',
                      borderRadius: '12px',
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
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[#F5E6A6]/10">
                <Calendar className="h-5 w-5 text-[#F5E6A6]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Recent Access Logs</h2>
                <p className="text-sm text-muted-foreground">Most recent 15 visits with browser, location, and device information</p>
              </div>
            </div>
            <div className="divide-y divide-border/30">
              {analytics.access_logs.slice(0, 15).map((log) => {
                const isExpanded = expandedLogs.has(log.access_id)
                const { browser, os } = parseUserAgent(log.user_agent)
                const DeviceIcon = getDeviceIcon(log.device_type)

                return (
                  <div key={log.access_id} className="py-4 hover:bg-[#E9A6F5]/5 transition-colors rounded-xl px-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleLogExpansion(log.access_id)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-[#E9A6F5]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[#E9A6F5]" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.accessed_at), 'MMM d, HH:mm')}
                          </span>
                          {log.channel_name && (
                            <Badge variant="outline" className="text-xs border-[#E9A6F5]/30 text-[#E9A6F5]">
                              {log.channel_name}
                            </Badge>
                          )}
                          <Badge className="text-xs bg-[#F5A6D0]/20 text-[#F5A6D0] border-none">
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
                          <DeviceIcon className="h-4 w-4 text-[#A6D4F5]" />
                          <span className="text-xs text-muted-foreground hidden sm:inline">{browser}</span>
                          {log.is_unique_visit && (
                            <Badge className="text-xs bg-gradient-to-r from-[#E9A6F5] to-[#F5A6D0] text-white border-none">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 rounded-xl bg-[#E9A6F5]/5">
                            <p className="text-xs text-muted-foreground mb-1">Browser & OS</p>
                            <p className="font-medium">{browser} on {os}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-[#F5A6D0]/5">
                            <p className="text-xs text-muted-foreground mb-1">Device Type</p>
                            <p className="font-medium">{log.device_type || 'Unknown'}</p>
                          </div>
                          {log.city && (
                            <div className="p-3 rounded-xl bg-[#A6D4F5]/5">
                              <p className="text-xs text-muted-foreground mb-1">Location</p>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <p className="font-medium">{log.city}{log.country_code ? `, ${log.country_code}` : ''}</p>
                              </div>
                            </div>
                          )}
                          {log.referrer && (
                            <div className="p-3 rounded-xl bg-[#F5C6A6]/5">
                              <p className="text-xs text-muted-foreground mb-1">Referrer</p>
                              <p className="font-medium truncate text-xs">{log.referrer}</p>
                            </div>
                          )}
                          <div className="p-3 rounded-xl bg-[#C6A6F5]/5">
                            <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                            <p className="font-mono text-xs truncate">{log.session_id}</p>
                          </div>
                          {log.visitor_id && (
                            <div className="p-3 rounded-xl bg-[#F5E6A6]/5">
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
            {analytics.access_logs.length > 15 && (
              <p className="text-sm text-muted-foreground mt-6 text-center p-4 rounded-xl bg-[#E9A6F5]/5">
                Showing most recent 15 of {analytics.access_logs.length} access logs
              </p>
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!analytics || analytics.total_visits === 0) && (
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="relative inline-block mb-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E9A6F5]/10 to-[#F5A6D0]/10">
                <BarChart3 className="h-16 w-16 text-[#E9A6F5]" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-[#F5A6D0]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 bg-gradient-to-r from-[#E9A6F5] via-[#F5A6D0] to-[#C6A6F5] bg-clip-text text-transparent">
              No Analytics Data Yet
            </h3>
            <p className="text-base text-muted-foreground mb-8">
              Share your product link to start tracking visits, conversions, and visitor insights.
            </p>
            <Button 
              className="bg-gradient-to-r from-[#E9A6F5] to-[#F5A6D0] text-white border-none hover:from-[#E9A6F5]/90 hover:to-[#F5A6D0]/90 shadow-lg shadow-[#E9A6F5]/20"
              onClick={() => router.back()}
            >
              Go Back to Product
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
