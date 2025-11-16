'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Search, RefreshCw, Settings, BarChart3, ChevronRight, Building2, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
  email_count: number
  emails_sent: number
  emails_delivered: number
  emails_opened: number
  emails_clicked: number
  emails_bounced: number
  rfqs_received: number
  launched_at: string | null
  created_at: string
  org_id: string
  organizations?: {
    name: string
    domain: string
  }
  products?: {
    product_name: string
  }
}

export default function AdminCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    filterCampaigns()
  }, [searchQuery, statusFilter, campaigns])

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, organizations(name, domain), products(product_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterCampaigns() {
    let filtered = campaigns

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((campaign) => {
        const campaignName = campaign.campaign_name?.toLowerCase() || ''
        const orgName = campaign.organizations?.name?.toLowerCase() || ''
        const productName = campaign.products?.product_name?.toLowerCase() || ''
        
        return (
          campaignName.includes(query) ||
          orgName.includes(query) ||
          productName.includes(query)
        )
      })
    }

    setFilteredCampaigns(filtered)
  }

  async function handleStatusChange(campaignId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (error) throw error

      await loadCampaigns()
      toast.success('Campaign status updated successfully!')
    } catch (error) {
      console.error('Error updating campaign status:', error)
      toast.error('Failed to update campaign status.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'scheduled':
        return 'bg-primary/10 text-primary border-primary/30'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0
    return Math.round((numerator / denominator) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    )
  }

  const statusCounts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
                Campaign Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Admin overview - {campaigns.length} total campaigns
              </p>
            </div>
            <Button onClick={loadCampaigns} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search campaigns, companies, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
                <SelectItem value="scheduled">Scheduled ({statusCounts.scheduled})</SelectItem>
                <SelectItem value="paused">Paused ({statusCounts.paused})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No campaigns match your filters'
                  : 'No campaigns yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCampaigns.map((campaign) => {
                const openRate = calculateRate(campaign.emails_opened, campaign.emails_sent)
                const clickRate = calculateRate(campaign.emails_clicked, campaign.emails_sent)
                const deliveryRate = calculateRate(campaign.emails_delivered, campaign.emails_sent)

                return (
                  <div
                    key={campaign.campaign_id}
                    className="bg-card rounded-xl border border-border/30 hover:border-primary/30 transition-all p-4 sm:p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Campaign Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                            <Mail className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1">{campaign.campaign_name}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {campaign.organizations && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {campaign.organizations.name}
                                </span>
                              )}
                              {campaign.products && (
                                <span>• {campaign.products.product_name}</span>
                              )}
                              {campaign.launched_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(campaign.launched_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-background/60 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Sent</div>
                            <div className="text-lg font-bold">{campaign.emails_sent}</div>
                            <div className="text-xs text-muted-foreground">
                              of {campaign.email_count}
                            </div>
                          </div>
                          <div className="bg-background/60 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Delivery</div>
                            <div className="text-lg font-bold text-green-600">{deliveryRate}%</div>
                            <div className="text-xs text-muted-foreground">
                              {campaign.emails_delivered} delivered
                            </div>
                          </div>
                          <div className="bg-background/60 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Opens</div>
                            <div className="text-lg font-bold text-blue-600">{openRate}%</div>
                            <div className="text-xs text-muted-foreground">
                              {campaign.emails_opened} opened
                            </div>
                          </div>
                          <div className="bg-background/60 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">RFQs</div>
                            <div className="text-lg font-bold text-accent">{campaign.rfqs_received}</div>
                            <div className="text-xs text-muted-foreground">
                              {clickRate}% clicks
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[200px]">
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">Status</div>
                          <Select
                            value={campaign.status}
                            onValueChange={(value) => handleStatusChange(campaign.campaign_id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <Badge variant="outline" className={getStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/admin/campaigns/${campaign.campaign_id}/tracking`)}
                            className="gap-2 w-full justify-start"
                          >
                            <BarChart3 className="h-4 w-4" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/campaigns/${campaign.campaign_id}/settings`)}
                            className="gap-2 w-full justify-start"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
