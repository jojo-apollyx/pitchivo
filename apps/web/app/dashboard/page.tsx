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
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Pitchivo',
  description: 'Track your B2B outreach performance, manage products, campaigns, and RFQs all in one place.',
}

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
  let subscriptionTier = 'Free'
  let subscriptionStatus = 'active'

  if (orgId) {
    const [
      { count: productsCount } = { count: 0 },
      { count: publishedCount } = { count: 0 },
      { count: rfqsCount } = { count: 0 },
      { count: newRfqsCount } = { count: 0 },
      { data: subscription } = { data: null },
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
      supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('org_id', orgId)
        .single(),
    ])

    productsTotal = productsCount || 0
    productsPublished = publishedCount || 0
    rfqsTotal = rfqsCount || 0
    rfqsNew = newRfqsCount || 0
    
    // Capitalize tier name
    if (subscription) {
      subscriptionTier = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
      subscriptionStatus = subscription.status
    }
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
    href?: string
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
      value: subscriptionTier,
      icon: CreditCard,
      change: subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1),
      changeType: subscriptionStatus === 'active' || subscriptionStatus === 'trialing' ? 'positive' : subscriptionStatus === 'past_due' ? 'negative' : 'neutral',
      href: '/dashboard/billing',
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
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Welcome Section */}
        <section id="dashboard-welcome-section" className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  Welcome back, {userName} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {organizationName}
                </p>
              </div>
              
              {/* Quick Actions - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  const actionId = action.href.split('/').pop() || `action-${index}`
                  return (
                    <Link key={action.href} href={action.href}>
                      <Button 
                        id={`dashboard-quick-action-${actionId}-button`}
                        variant={action.variant}
                        className={cn(
                          "gap-2 shadow-sm transition-all hover:scale-105",
                          action.variant === 'default' && "bg-gradient-accent hover:shadow-lg hover:shadow-primary/25"
                        )}
                        aria-label={action.label}
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
              {quickActions.map((action, index) => {
                const Icon = action.icon
                const actionId = action.href.split('/').pop() || `action-${index}`
                return (
                  <Link key={action.href} href={action.href}>
                    <div 
                      id={`dashboard-mobile-action-${actionId}`}
                      className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 h-full min-h-[110px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20 touch-manipulation group border border-border/30"
                      role="button"
                      aria-label={action.label}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 shadow-inner",
                        action.variant === 'default' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <p className="text-xs text-center font-semibold leading-tight group-hover:text-primary transition-colors duration-300">
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
        <section id="dashboard-metrics-section" className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border/30">
          <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6 text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Metrics Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              const metricId = metric.label.toLowerCase().replace(/\s+/g, '-')
              return (
                <div
                  key={metric.label}
                  id={`dashboard-metric-${metricId}-card`}
                  className="relative bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 dark:border-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        {metric.label}
                      </p>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10">
                        <Icon className="h-5 w-5 text-primary transition-transform duration-300" />
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{metric.value}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        metric.changeType === 'positive' 
                          ? 'bg-green-500/10 text-green-600' 
                          : metric.changeType === 'negative'
                          ? 'bg-red-500/10 text-red-600'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {metric.changeType === 'positive' ? '↑' : metric.changeType === 'negative' ? '↓' : '•'} {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section id="dashboard-activity-section" className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6 text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h2>
          <div className="max-w-4xl">
            <div className="bg-card/30 backdrop-blur-sm rounded-3xl border border-border/30 overflow-hidden">
              <div className="divide-y divide-border/30">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div 
                      key={index}
                      id={`dashboard-activity-item-${index + 1}`}
                      className="p-4 sm:p-6 hover:bg-primary/5 transition-all duration-300 cursor-pointer touch-manipulation group"
                      role="article"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 ${
                          activity.type === 'success' 
                            ? 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary' 
                            : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground'
                        }`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-300">
                              {activity.title}
                            </p>
                            <span className="text-xs text-muted-foreground font-medium bg-background/50 px-2 py-1 rounded-full">
                              {activity.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

