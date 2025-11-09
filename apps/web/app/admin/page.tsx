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
    <div className="min-h-screen bg-background">
      {/* Page Header - Integral Section */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Overview of platform activity and metrics
          </p>
        </div>
      </section>

      {/* Summary Statistics - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </span>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-semibold">{card.value}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent Activity - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Recent Organizations</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrganizations && recentOrganizations.length > 0 ? (
                  recentOrganizations.map((org) => (
                    <TableRow key={org.id} className="hover:bg-accent/5">
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-12">
                      No recent activity
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  )
}
