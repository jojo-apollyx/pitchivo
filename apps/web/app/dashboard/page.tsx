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
import { DashboardIntroWrapper } from '@/components/dashboard/DashboardIntroWrapper'
import {
  createOnboardingActivities,
  formatProductActivity,
  formatCampaignActivity,
  formatRFQActivity,
  formatSubscriptionActivity,
  formatRelativeTime,
  type Activity
} from '@/lib/utils/activities'

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
  let emailsSent = 0
  let emailsOpened = 0
  let subscriptionTier = 'Free'
  let subscriptionStatus = 'active'

  if (orgId) {
    const [
      { count: productsCount } = { count: 0 },
      { count: publishedCount } = { count: 0 },
      { count: rfqsCount } = { count: 0 },
      { count: newRfqsCount } = { count: 0 },
      { data: campaigns } = { data: [] },
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
        .from('campaigns')
        .select('emails_sent, emails_opened')
        .eq('org_id', orgId),
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
    
    // Calculate total emails sent and opened from all campaigns
    if (campaigns && campaigns.length > 0) {
      emailsSent = campaigns.reduce((sum, campaign) => sum + (campaign.emails_sent || 0), 0)
      emailsOpened = campaigns.reduce((sum, campaign) => sum + (campaign.emails_opened || 0), 0)
    }
    
    // Capitalize tier name
    if (subscription) {
      subscriptionTier = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
      subscriptionStatus = subscription.status
    }
  }

  // Calculate open rate (emails opened / emails sent)
  const openRate = emailsSent > 0 
    ? ((emailsOpened / emailsSent) * 100).toFixed(1)
    : '0.0'

  // Calculate conversion rate: RFQ Conversion Rate = (RFQs / Emails Sent) * 100
  // This shows what percentage of emails resulted in RFQs
  let conversionRate: string
  let conversionRateLabel: string
  if (emailsSent > 0) {
    conversionRate = ((rfqsTotal / emailsSent) * 100).toFixed(1)
    conversionRateLabel = `${rfqsTotal} RFQs / ${emailsSent} Emails`
  } else {
    // If no emails sent yet, show N/A and explain
    conversionRate = 'N/A'
    conversionRateLabel = 'Send emails to calculate'
  }

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
      value: emailsSent.toString(),
      icon: Mail,
      change: emailsOpened > 0 ? `${emailsOpened} opened` : '0 opened',
      changeType: emailsOpened > 0 ? 'positive' : 'neutral',
    },
    {
      label: 'Open Rate',
      value: `${openRate}%`,
      icon: Eye,
      change: emailsSent > 0 ? `${emailsOpened} of ${emailsSent}` : 'No emails sent',
      changeType: parseFloat(openRate) > 20 ? 'positive' : parseFloat(openRate) > 10 ? 'neutral' : 'neutral',
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
      value: conversionRate === 'N/A' ? 'N/A' : `${conversionRate}%`,
      icon: TrendingUp,
      change: conversionRateLabel,
      changeType: conversionRate !== 'N/A' && parseFloat(conversionRate) > 0 ? 'positive' : 'neutral',
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

  // Fetch recent activities from database
  let recentActivities: Activity[] = []
  
  if (orgId) {
    const [
      { data: recentProducts } = { data: [] },
      { data: recentCampaigns } = { data: [] },
      { data: recentRFQs } = { data: [] },
      { data: subscriptionData } = { data: null },
    ] = await Promise.all([
      // Get 2 most recent products (we'll combine with other activities and take top 3)
      supabase
        .from('products')
        .select('product_id, product_name, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(2),
      // Get 2 most recent campaigns
      supabase
        .from('campaigns')
        .select('campaign_id, campaign_name, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(2),
      // Get 2 most recent RFQs
      supabase
        .from('product_rfqs')
        .select('rfq_id, name, company, submitted_at, product_id')
        .eq('org_id', orgId)
        .order('submitted_at', { ascending: false })
        .limit(2),
      // Get subscription for activity (may not exist)
      supabase
        .from('subscriptions')
        .select('tier, status, updated_at, created_at')
        .eq('org_id', orgId)
        .maybeSingle(),
    ])

    const activities: Activity[] = []

    // Add product activities
    if (recentProducts) {
      recentProducts.forEach((product: any) => {
        activities.push(formatProductActivity(product))
      })
    }

    // Add campaign activities
    if (recentCampaigns) {
      recentCampaigns.forEach((campaign: any) => {
        activities.push(formatCampaignActivity(campaign))
      })
    }

    // Add RFQ activities
    if (recentRFQs) {
      recentRFQs.forEach((rfq: any) => {
        activities.push(formatRFQActivity(rfq))
      })
    }

    // Add subscription activity if updated recently (within last 7 days)
    if (subscriptionData) {
      const updatedAt = subscriptionData.updated_at ? new Date(subscriptionData.updated_at) : null
      const createdAt = new Date(subscriptionData.created_at)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      if (updatedAt && updatedAt > sevenDaysAgo) {
        activities.push(formatSubscriptionActivity(subscriptionData))
      } else if (createdAt > sevenDaysAgo) {
        activities.push(formatSubscriptionActivity(subscriptionData))
      }
    }

    // Create onboarding activities
    const onboardingActivities = createOnboardingActivities(
      productsTotal > 0,
      (recentCampaigns?.length || 0) > 0,
      false, // productIntroCompleted - could check localStorage if needed
      false  // dashboardIntroCompleted - could check localStorage if needed
    )

    // Combine and sort by timestamp (most recent first)
    recentActivities = [...onboardingActivities, ...activities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 3) // Limit to 3 most recent
  }

  return (
    <DashboardIntroWrapper>
      <main className="min-h-screen bg-background">
        <div className="relative">
          {/* Welcome Section */}
          <section id="dashboard-welcome-section" className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  Welcome back, {userName} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
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
                        className="gap-2 h-10 rounded-md"
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
                      className="bg-background-secondary rounded-lg p-4 flex flex-col items-center justify-center gap-2 h-full min-h-[100px] transition-colors duration-200 hover:bg-accent-surface touch-manipulation group"
                      role="button"
                      aria-label={action.label}
                    >
                      <div className="h-10 w-10 rounded-md bg-accent-surface flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-primary-dark/10">
                        <Icon className="h-5 w-5 text-primary-dark" />
                      </div>
                      <p className="text-xs text-center font-medium leading-tight text-foreground">
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
        <section id="dashboard-metrics-section" className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Metrics Overview
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              const metricId = metric.label.toLowerCase().replace(/\s+/g, '-')
              return (
                <div
                  key={metric.label}
                  id={`dashboard-metric-${metricId}-card`}
                  className="bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <div className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10">
                      <Icon className="h-4 w-4 text-primary-dark" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-semibold text-foreground">{metric.value}</div>
                  <p className={`text-sm mt-1 ${
                    metric.changeType === 'positive' 
                      ? 'text-green-600' 
                      : metric.changeType === 'negative'
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </p>
                </div>
              )
            })}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section id="dashboard-activity-section" className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Recent Activity
            </h2>
            <div className="max-w-4xl">
            <div className="bg-background rounded-lg divide-y divide-border/30">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const Icon = activity.icon
                  const isCompleted = activity.completed === true
                  const isOnboarding = activity.type.startsWith('onboarding_')
                  
                  const ActivityContent = (
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                        isCompleted
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30' 
                          : isOnboarding
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                          : 'bg-background-secondary text-muted-foreground'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary-dark transition-colors duration-200">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )

                  // Make clickable if href is provided
                  if (activity.href) {
                    return (
                      <Link
                        key={activity.id}
                        href={activity.href}
                        id={`dashboard-activity-item-${activity.id}`}
                        className="block p-4 sm:p-5 hover:bg-background-secondary transition-colors duration-200 cursor-pointer touch-manipulation group"
                      >
                        {ActivityContent}
                      </Link>
                    )
                  }

                  return (
                    <div
                      key={activity.id}
                      id={`dashboard-activity-item-${activity.id}`}
                      className="p-4 sm:p-5 hover:bg-background-secondary transition-colors duration-200 group"
                    >
                      {ActivityContent}
                    </div>
                  )
                })
              ) : (
                <div className="p-4 sm:p-5 text-center text-muted-foreground">
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </section>
        </div>
      </main>
    </DashboardIntroWrapper>
  )
}
