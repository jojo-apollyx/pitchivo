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
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const { profile, organization } = await getEffectiveUserAndProfile()

  const organizationName = organization?.name || organization?.company_name || 'there'
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'User'
  
  // Fetch real metrics from database
  const supabase = await createClient()
  
  // Get products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', organization?.id || '')
    
  // Get RFQs count
  const { count: rfqsCount } = await supabase
    .from('product_rfqs')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', organization?.id || '')
    
  // Get RFQs by status for status breakdown
  const { data: rfqsByStatus } = await supabase
    .from('product_rfqs')
    .select('status')
    .eq('org_id', organization?.id || '')
  
  const newRfqsCount = rfqsByStatus?.filter(r => r.status === 'new').length || 0

  // Mock metrics data - in production, fetch from database
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
      value: productsCount?.toString() || '0',
      icon: Package,
      change: '+0%',
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
      value: rfqsCount?.toString() || '0',
      icon: MessageSquare,
      change: newRfqsCount > 0 ? `${newRfqsCount} new` : '+0%',
      changeType: newRfqsCount > 0 ? 'positive' : 'neutral',
    },
    {
      label: 'Conversion Rate',
      value: '0%',
      icon: TrendingUp,
      change: '+0%',
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

  // Fetch recent RFQs for activity feed
  const { data: recentRfqs } = await supabase
    .from('product_rfqs')
    .select('rfq_id, name, company, submitted_at, status, products(product_name)')
    .eq('org_id', organization?.id || '')
    .order('submitted_at', { ascending: false })
    .limit(3)

  const recentActivities = recentRfqs && recentRfqs.length > 0 ? recentRfqs.map((rfq) => ({
    icon: MessageSquare,
    title: `New RFQ from ${rfq.name}`,
    description: `${rfq.company} - ${rfq.products?.product_name || 'Product'}`,
    time: formatDistanceToNow(new Date(rfq.submitted_at), { addSuffix: true }),
    type: 'info' as const,
  })) : [
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      <div className="relative">
        {/* Welcome Section */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                  Welcome back, {userName} 👋
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
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
                        className="min-h-[44px] gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
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
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/20 bg-background/80 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
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
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">{metric.value}</div>
                  <p className={`text-xs sm:text-sm mt-1 transition-colors duration-300 ${
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
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-background/60 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
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
                        <p className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors duration-300">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
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

