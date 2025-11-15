import { getEffectiveUserAndProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Mail, 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  CreditCard,
  Plus,
  Send,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const { profile, organization } = await getEffectiveUserAndProfile()

  const organizationName = organization?.name || organization?.company_name || 'there'
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'User'
  
  // Fetch real statistics
  const supabase = await createClient()
  const orgId = profile?.organization_id

  let productsTotal = 0
  let productsPublished = 0
  let rfqsTotal = 0
  let rfqsNew = 0

  if (orgId) {
    const [
      { count: productsCount } = { count: 0 },
      { count: publishedCount } = { count: 0 },
      { count: rfqsCount } = { count: 0 },
      { count: newRfqsCount } = { count: 0 },
    ] = await Promise.all([
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'published'),
      supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId),
      supabase
        .from('product_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'new'),
    ])

    productsTotal = productsCount || 0
    productsPublished = publishedCount || 0
    rfqsTotal = rfqsCount || 0
    rfqsNew = newRfqsCount || 0
  }

  // Calculate conversion rate (RFQs / Products, if products > 0)
  const conversionRate = productsTotal > 0 
    ? ((rfqsTotal / productsTotal) * 100).toFixed(1)
    : '0.0'

  type MetricChangeType = 'positive' | 'negative' | 'neutral'
  
  const metrics: Array<{
    label: string
    value: string
    icon: typeof Package
    change: string
    changeType: MetricChangeType
  }> = [
    {
      label: 'Products',
      value: productsTotal.toString(),
      icon: Package,
      change: `${productsPublished} published`,
      changeType: 'neutral',
    },
    {
      label: 'Emails Sent',
      value: '0',
      icon: Mail,
      change: '+0%',
      changeType: 'neutral',
    },
    {
      label: 'Open Rate',
      value: '0%',
      icon: Eye,
      change: '+0%',
      changeType: 'neutral',
    },
    {
      label: 'RFQs Received',
      value: rfqsTotal.toString(),
      icon: MessageSquare,
      change: rfqsNew > 0 ? `${rfqsNew} new` : '0 new',
      changeType: rfqsNew > 0 ? 'positive' : 'neutral',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      change: `${rfqsTotal} RFQs / ${productsTotal} Products`,
      changeType: 'neutral',
    },
    {
      label: 'Subscription',
      value: 'Basic',
      icon: CreditCard,
      change: 'Active',
      changeType: 'positive',
    },
  ]

  const quickActions = [
    {
      label: 'Upload Product',
      icon: Plus,
      href: '/dashboard/products',
      variant: 'default' as const,
    },
    {
      label: 'Start Campaign',
      icon: Send,
      href: '/dashboard/campaigns',
      variant: 'outline' as const,
    },
    {
      label: 'View RFQs',
      icon: MessageSquare,
      href: '/dashboard/rfqs',
      variant: 'outline' as const,
    },
  ]

  const recentActivities = [
    {
      icon: CheckCircle2,
      title: 'Welcome to Pitchivo!',
      description: 'Your account has been created successfully',
      time: 'Just now',
      type: 'success' as const,
    },
    {
      icon: FileText,
      title: 'Next step: Upload your first product',
      description: 'Create product pages to start reaching buyers',
      time: '1 min ago',
      type: 'info' as const,
    },
    {
      icon: Mail,
      title: 'Set up your first campaign',
      description: 'Start sending personalized emails to potential buyers',
      time: '2 min ago',
      type: 'info' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Welcome Section */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  Welcome back, {userName} 👋
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
                  {organizationName}
                </p>
              </div>
              
              {/* Quick Actions - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link key={action.href} href={action.href}>
                      <Button 
                        variant={action.variant}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions - Mobile */}
            <div className="grid grid-cols-3 gap-3 mt-6 sm:hidden">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-full min-h-[120px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20 touch-manipulation group">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                        <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <p className="text-xs text-center font-medium leading-tight group-hover:text-primary transition-colors duration-300">
                        {action.label}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Metrics Overview */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-foreground">
            Metrics Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{metric.value}</div>
                  <p className={`text-xs sm:text-sm mt-1 transition-colors duration-300 font-normal ${
                    metric.changeType === 'positive' 
                      ? 'text-primary' 
                      : metric.changeType === 'negative'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-foreground">
            Recent Activity
          </h2>
          <div className="max-w-4xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl divide-y divide-border/30 overflow-hidden shadow-sm">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div 
                    key={index}
                    className="p-4 sm:p-6 hover:bg-primary/5 transition-all duration-300 cursor-pointer touch-manipulation active:scale-[0.98] group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-light/20 ${
                        activity.type === 'success' 
                          ? 'bg-primary/10 text-primary group-hover:bg-primary/20' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors duration-300 text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 font-normal">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-normal">
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

