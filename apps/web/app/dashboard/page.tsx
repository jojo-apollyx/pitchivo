import { requireAuth, getUserProfile } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  const organizationName = profile?.organizations?.company_name || 'there'
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

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
      value: '0',
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
      value: '0',
      icon: MessageSquare,
      change: '+0%',
      changeType: 'neutral',
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
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
                    className="min-h-[44px] gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Actions - Mobile Cards */}
        <div className="grid grid-cols-3 gap-3 mt-6 sm:hidden">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow touch-manipulation active:scale-[0.98] h-full">
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full min-h-[120px]">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs text-center font-medium leading-tight">
                      {action.label}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Metrics Overview */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Metrics Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card 
                key={metric.label}
                className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary-light/50"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className={`text-xs mt-1 ${
                    metric.changeType === 'positive' 
                      ? 'text-primary' 
                      : metric.changeType === 'negative'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div 
                    key={index}
                    className="p-4 hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation active:bg-accent/70"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'success' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

