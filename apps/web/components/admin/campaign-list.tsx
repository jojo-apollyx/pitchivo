'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Search, RefreshCw, Settings, BarChart3, Building2, Calendar, Pause, Play } from 'lucide-react'
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
import { TestDataBadge } from '@/components/admin/test-data-toggle'

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
  is_test: boolean
  admin_processing_paused: boolean
  admin_pause_reason: string | null
  admin_paused_at: string | null
  organizations?: {
    name: string
    domain: string
  }
  products?: {
    product_name: string
  }
}

export function CampaignList() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [togglingPause, setTogglingPause] = useState<string | null>(null)
  
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
      // Get campaign to check if it has Smartlead integration
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', campaignId)
        .single()

      if (campaign?.smartlead_campaign_id) {
        // Map our status to Smartlead status format
        const smartleadStatusMap: Record<string, string> = {
          'active': 'START',
          'paused': 'PAUSED',
          'stopped': 'STOPPED',
          'drafted': 'DRAFTED',
          'completed': 'COMPLETED'
        }

        const smartleadStatus = smartleadStatusMap[newStatus]
        
        if (smartleadStatus && ['START', 'PAUSED', 'STOPPED'].includes(smartleadStatus)) {
          // Call Smartlead API to update status
          const response = await fetch(`/api/smartlead/campaigns/${campaignId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: smartleadStatus })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update campaign status in Smartlead')
          }
        } else {
          // Status doesn't need Smartlead update (e.g., 'drafted', 'completed')
          // Just update local database
        }
      }

      // Update local database
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
      toast.error('Failed to update campaign status.', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  async function handleToggleProcessing(campaign: Campaign) {
    setTogglingPause(campaign.campaign_id)
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.campaign_id}/toggle-processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paused: !campaign.admin_processing_paused,
          reason: null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle processing')
      }

      const result = await response.json()
      
      toast.success(result.message, { duration: 4000 })
      await loadCampaigns()
    } catch (error: any) {
      console.error('Error toggling processing:', error)
      toast.error(error.message || 'Failed to toggle processing')
    } finally {
      setTogglingPause(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'drafted':  // Matches Smartlead DRAFTED
        return 'bg-primary/10 text-primary border-primary/30'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'stopped':  // Matches Smartlead STOPPED (replaces cancelled)
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
      <div className="py-12 text-center text-muted-foreground">
        Loading campaigns...
      </div>
    )
  }

  const statusCounts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    drafted: campaigns.filter(c => c.status === 'drafted').length,  // Matches Smartlead DRAFTED
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    stopped: campaigns.filter(c => c.status === 'stopped').length,  // Matches Smartlead STOPPED
  }

  return (
    <div className="space-y-6">
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
            <SelectItem value="drafted">Drafted ({statusCounts.drafted})</SelectItem>
            <SelectItem value="stopped">Stopped ({statusCounts.stopped})</SelectItem>
            <SelectItem value="paused">Paused ({statusCounts.paused})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadCampaigns} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Campaign Cards */}
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
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
                          <TestDataBadge isTest={campaign.is_test} />
                          {campaign.admin_processing_paused && (
                            <Badge 
                              variant="outline" 
                              className="bg-amber-100 text-amber-700 border-amber-300 gap-1 text-xs"
                              title={campaign.admin_pause_reason || 'Processing paused by admin'}
                            >
                              <Pause className="h-3 w-3" />
                              Processing Paused
                            </Badge>
                          )}
                        </div>
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
                          <SelectItem value="drafted">Drafted</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="stopped">Stopped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Admin Processing Control */}
                      {(() => {
                        const isPaused = campaign.status === 'paused' || campaign.admin_processing_paused
                        const isProcessing = togglingPause === campaign.campaign_id
                        
                        return (
                          <Button
                            variant={isPaused ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleProcessing(campaign)}
                            disabled={isProcessing}
                            className={`gap-2 w-full justify-start ${
                              isPaused 
                                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                : 'hover:bg-accent'
                            }`}
                            title={isPaused 
                              ? 'Resume email processing (cron will send emails)' 
                              : 'Pause email processing (cron will skip this campaign)'
                            }
                          >
                            {isProcessing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : isPaused ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                            {isProcessing 
                              ? 'Processing...' 
                              : isPaused 
                                ? 'Resume Processing' 
                                : 'Pause Processing'
                            }
                          </Button>
                        )
                      })()}
                      
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
                        onClick={() => router.push(`/admin/campaigns/${campaign.campaign_id}`)}
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
  )
}

