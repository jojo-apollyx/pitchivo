'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Database,
  Users,
  Building2,
  ShoppingCart,
  TrendingUp,
  Activity,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface Stats {
  total_organizations: number
  total_contacts: number
  total_market_items: number
  total_signals: number
  organizations_with_roles: number
  organizations_as_buyers: number
  organizations_as_sellers: number
  organizations_as_manufacturers: number
  contacts_with_email: number
  contacts_validated: number
  organizations_enriched: number
  contacts_enriched: number
}

interface SourceStats {
  source: string
  count: number
}

interface InteractionTypeStats {
  interaction_type: string
  count: number
}

interface RecentActivity {
  id: string
  entity_type: string
  status: string
  provider_name: string
  step_name: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  created_at: string
}

async function fetchStats(): Promise<Stats> {
  const supabase = createClient()

  const [
    { count: orgCount },
    { count: contactCount },
    { count: itemCount },
    { count: signalCount },
    { count: orgsWithRoles },
    { data: buyers },
    { data: sellers },
    { data: manufacturers },
    { count: contactsWithEmail },
    { count: contactsValidated },
    { count: orgsEnriched },
    { count: contactsEnriched },
  ] = await Promise.all([
    supabase.from('leads_organizations').select('*', { count: 'exact', head: true }),
    supabase.from('leads_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('leads_market_items').select('*', { count: 'exact', head: true }),
    supabase.from('leads_signals').select('*', { count: 'exact', head: true }),
    supabase
      .from('leads_organizations')
      .select('*', { count: 'exact', head: true })
      .not('cached_roles', 'eq', '{}'),
    supabase.from('v_organizations_as_buyers').select('id', { count: 'exact', head: true }),
    supabase.from('v_organizations_as_sellers').select('id', { count: 'exact', head: true }),
    supabase.from('v_organizations_as_manufacturers').select('id', { count: 'exact', head: true }),
    supabase.from('leads_contacts').select('*', { count: 'exact', head: true }).not('email', 'is', null),
    supabase.from('leads_contacts').select('*', { count: 'exact', head: true }).eq('email_status', 'valid'),
    supabase
      .from('leads_organizations')
      .select('*', { count: 'exact', head: true })
      .not('profile_data->enriched_at', 'is', null),
    supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .not('attributes->enriched_at', 'is', null),
  ])

  return {
    total_organizations: orgCount || 0,
    total_contacts: contactCount || 0,
    total_market_items: itemCount || 0,
    total_signals: signalCount || 0,
    organizations_with_roles: orgsWithRoles || 0,
    organizations_as_buyers: (buyers as any)?.length || 0,
    organizations_as_sellers: (sellers as any)?.length || 0,
    organizations_as_manufacturers: (manufacturers as any)?.length || 0,
    contacts_with_email: contactsWithEmail || 0,
    contacts_validated: contactsValidated || 0,
    organizations_enriched: orgsEnriched || 0,
    contacts_enriched: contactsEnriched || 0,
  }
}

async function fetchSourceStats(): Promise<SourceStats[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads_signals')
    .select('source')
    .not('source', 'is', null)

  if (error) throw error

  const sourceMap = new Map<string, number>()
  data?.forEach((item) => {
    const source = item.source || 'Unknown'
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })

  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
}

async function fetchInteractionTypeStats(): Promise<InteractionTypeStats[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads_signals')
    .select('interaction_type')

  if (error) throw error

  const typeMap = new Map<string, number>()
  data?.forEach((item) => {
    const type = item.interaction_type
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  return Array.from(typeMap.entries())
    .map(([interaction_type, count]) => ({ interaction_type, count }))
    .sort((a, b) => b.count - a.count)
}

async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_enrichment_execution_summary')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data || []) as RecentActivity[]
}

export function DataAnalysisTab() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: fetchStats,
  })

  const { data: sourceStats = [], isLoading: sourceLoading } = useQuery({
    queryKey: ['leads-source-stats'],
    queryFn: fetchSourceStats,
  })

  const { data: interactionStats = [], isLoading: interactionLoading } = useQuery({
    queryKey: ['leads-interaction-stats'],
    queryFn: fetchInteractionTypeStats,
  })

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['leads-recent-activity'],
    queryFn: fetchRecentActivity,
  })

  if (statsLoading) {
    return <div className="text-center py-8">Loading statistics...</div>
  }

  const enrichmentRate =
    stats && stats.total_organizations > 0
      ? ((stats.organizations_enriched / stats.total_organizations) * 100).toFixed(1)
      : '0'

  const contactEnrichmentRate =
    stats && stats.contacts_with_email > 0
      ? ((stats.contacts_enriched / stats.contacts_with_email) * 100).toFixed(1)
      : '0'

  const validationRate =
    stats && stats.contacts_with_email > 0
      ? ((stats.contacts_validated / stats.contacts_with_email) * 100).toFixed(1)
      : '0'

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_organizations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.organizations_with_roles || 0} with roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_contacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.contacts_with_email || 0} with email
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Items</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_market_items || 0}</div>
            <p className="text-xs text-muted-foreground">Products & ingredients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_signals || 0}</div>
            <p className="text-xs text-muted-foreground">Relationships tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Roles</CardTitle>
          <CardDescription>Distribution of organizations by their business roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Buyers</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats?.organizations_as_buyers || 0}
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900 dark:text-green-100">Sellers</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats?.organizations_as_sellers || 0}
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Manufacturers
                </span>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats?.organizations_as_manufacturers || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrichment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Organizations</span>
                <span className="font-semibold">{enrichmentRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${enrichmentRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.organizations_enriched || 0} of {stats?.total_organizations || 0} enriched
              </p>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Contacts</span>
                <span className="font-semibold">{contactEnrichmentRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${contactEnrichmentRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.contacts_enriched || 0} of {stats?.contacts_with_email || 0} enriched
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Validated</span>
                <span className="font-semibold">{validationRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${validationRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.contacts_validated || 0} of {stats?.contacts_with_email || 0} validated
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : sourceStats.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sources found</div>
            ) : (
              <div className="space-y-2">
                {sourceStats.slice(0, 5).map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <span className="text-sm truncate">{source.source}</span>
                    <Badge variant="secondary">{source.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interaction Types */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Types</CardTitle>
          <CardDescription>Distribution of interaction types in signals</CardDescription>
        </CardHeader>
        <CardContent>
          {interactionLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interaction Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactionStats.map((item) => {
                  const percentage =
                    stats && stats.total_signals > 0
                      ? ((item.count / stats.total_signals) * 100).toFixed(1)
                      : '0'
                  return (
                    <TableRow key={item.interaction_type}>
                      <TableCell className="font-medium">
                        {item.interaction_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{percentage}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Enrichment Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrichment Activity</CardTitle>
          <CardDescription>Latest enrichment executions</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No recent activity</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {activity.entity_type === 'organization' ? (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{activity.entity_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{activity.provider_name}</TableCell>
                    <TableCell>{activity.step_name}</TableCell>
                    <TableCell>
                      {activity.status === 'completed' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : activity.status === 'failed' ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{activity.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.duration_seconds
                        ? `${activity.duration_seconds.toFixed(1)}s`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(activity.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

