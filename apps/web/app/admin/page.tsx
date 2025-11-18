import { requireAdmin } from '@/lib/auth'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { 
  Users, 
  Mail, 
  MessageSquare, 
  TrendingUp,
  Activity
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function AdminDashboard() {
  const { user } = await requireAdmin()
  const supabase = await createServerClient()

  // Fetch summary statistics
  const [
    { count: merchantsCount } = { count: 0 },
    { count: campaignsCount } = { count: 0 },
    { count: rfqsCount } = { count: 0 },
    { count: waitlistCount } = { count: 0 },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('rfqs').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // Fetch recent activity
  const { data: recentOrganizations } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const summaryCards = [
    {
      title: 'Total Merchants',
      value: merchantsCount || 0,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Campaigns Sent',
      value: campaignsCount || 0,
      icon: Mail,
      color: 'text-primary',
    },
    {
      title: 'RFQs Received',
      value: rfqsCount || 0,
      icon: MessageSquare,
      color: 'text-primary',
    },
    {
      title: 'Waitlist Pending',
      value: waitlistCount || 0,
      icon: TrendingUp,
      color: 'text-primary',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header - Integral Section */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
              Overview of platform activity and metrics
            </p>
          </div>
        </section>

        {/* Summary Statistics - Integral Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {card.title}
                    </span>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color} transition-transform duration-300 group-hover:scale-110`} />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{card.value}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Activity - Integral Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-4xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Recent Activity</h2>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-3 text-muted-foreground">Recent Organizations</h3>
                <div className="overflow-x-auto">
                  <div className="divide-y divide-border/30">
                    {recentOrganizations && recentOrganizations.length > 0 ? (
                      recentOrganizations.map((org) => (
                        <div
                          key={org.id}
                          className="py-4 hover:bg-primary/5 transition-all duration-300 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary transition-colors duration-300">{org.name}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground font-normal">
                              {new Date(org.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-12 font-normal">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
