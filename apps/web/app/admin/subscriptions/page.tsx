/**
 * Admin Subscription Management Page
 * View and manage all organization subscriptions
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { formatPrice, PRICING_TIERS } from '@/lib/constants/pricing'

interface Subscription {
  subscription_id: string
  org_id: string
  tier: string
  status: string
  email_quota: number
  qr_links_per_product: number
  custom_quota_override: boolean
  created_at: string
  current_period_start?: string
  current_period_end?: string
  stripe_customer_id?: string
  organization?: {
    name: string
    slug: string
  }
  quota_usage?: {
    emails_sent: number
  }
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const supabase = createClient()

  useEffect(() => {
    loadSubscriptions()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchTerm, filterTier, filterStatus, subscriptions])

  async function loadSubscriptions() {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          organizations (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterData() {
    let filtered = [...subscriptions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.organization?.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tier filter
    if (filterTier !== 'all') {
      filtered = filtered.filter(sub => sub.tier === filterTier)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus)
    }

    setFilteredSubscriptions(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600'
      case 'trialing':
        return 'bg-blue-600'
      case 'past_due':
        return 'bg-amber-600'
      case 'canceled':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-500'
      case 'basic':
        return 'bg-blue-500'
      case 'premium':
        return 'bg-purple-600'
      case 'enterprise':
        return 'bg-amber-600'
      default:
        return 'bg-gray-500'
    }
  }

  // Calculate statistics
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length,
    byTier: {
      free: subscriptions.filter(s => s.tier === 'free').length,
      basic: subscriptions.filter(s => s.tier === 'basic').length,
      premium: subscriptions.filter(s => s.tier === 'premium').length,
      enterprise: subscriptions.filter(s => s.tier === 'enterprise').length,
    },
    mrr: subscriptions
      .filter(s => s.status === 'active' && s.tier !== 'free')
      .reduce((sum, s) => {
        const tierConfig = PRICING_TIERS[s.tier as keyof typeof PRICING_TIERS]
        return sum + (tierConfig?.price || 0)
      }, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600">
          View and manage organization subscriptions and quotas
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              MRR from paid plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Premium Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byTier.premium}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Premium subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Free Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byTier.free}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Free subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredSubscriptions.map((subscription) => (
              <div
                key={subscription.subscription_id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {subscription.organization?.name || 'Unknown Organization'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      @{subscription.organization?.slug || subscription.org_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTierBadgeColor(subscription.tier)}>
                      {subscription.tier.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                    {subscription.custom_quota_override && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Custom Quota
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email Quota:</span>
                    <span className="ml-2 font-medium">{subscription.email_quota.toLocaleString()}/month</span>
                  </div>
                  <div>
                    <span className="text-gray-500">QR Links:</span>
                    <span className="ml-2 font-medium">
                      {subscription.qr_links_per_product >= 999999 ? 'Unlimited' : subscription.qr_links_per_product}
                    </span>
                  </div>
                  {subscription.stripe_customer_id && (
                    <div>
                      <span className="text-gray-500">Stripe ID:</span>
                      <span className="ml-2 font-mono text-xs">{subscription.stripe_customer_id.substring(0, 12)}...</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(subscription.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No subscriptions found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

