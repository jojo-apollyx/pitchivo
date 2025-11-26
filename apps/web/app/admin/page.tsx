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
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Pitchivo',
  description: 'Admin dashboard for managing platform activity, merchants, campaigns, and system metrics.',
}

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
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Page Header - Integral Section */}
        <section id="admin-dashboard-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
              Overview of platform activity and metrics
            </p>
          </div>
        </section>

        {/* Summary Statistics - Integral Section */}
        <section id="admin-dashboard-summary-section" className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              const cardId = card.title.toLowerCase().replace(/\s+/g, '-')
              return (
                <div
                  key={card.title}
                  id={`admin-summary-${cardId}-card`}
                  className="bg-background-secondary rounded-lg p-4 sm:p-6 transition-colors duration-200 hover:bg-muted group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {card.title}
                    </span>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-accent-color/20">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-dark" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary-dark transition-colors duration-200">{card.value}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Activity - Integral Section */}
        <section id="admin-dashboard-activity-section" className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-4xl">
            <div className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center transition-colors duration-200">
                  <Activity className="h-5 w-5 text-primary-dark" />
                </div>
                <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground">Recent Activity</h2>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-3 text-muted-foreground">Recent Organizations</h3>
                <div className="overflow-x-auto">
                  <div className="divide-y divide-border/30">
                    {recentOrganizations && recentOrganizations.length > 0 ? (
                      recentOrganizations.map((org) => (
                        <div
                          key={org.id}
                          id={`admin-org-${org.id}`}
                          className="py-4 hover:bg-background transition-colors duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary-dark transition-colors duration-200">{org.name}</span>
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
    </main>
  )
}
