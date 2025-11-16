'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, Users, MousePointerClick, MessageSquare, Calendar, Activity, Mail, X, Pause, Play, MoreVertical, Archive, Trash2, Download, BarChart3, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
  email_count: number
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  emails_delivered: number
  emails_bounced: number
  rfqs_received: number
  launched_at: string | null
  created_at: string
  product_id: string
  products?: {
    product_name: string
    product_data?: any
  }
}

interface CampaignActivity {
  activity_id: string
  campaign_id: string
  activity_type: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_bounced' | 'product_viewed' | 'rfq_submitted'
  buyer_company: string | null
  contact_email: string | null
  metadata: {
    name?: string
    title?: string
    location?: string
    company?: string
    event?: string
    messageId?: string
    timestamp?: string
    [key: string]: any
  } | null
  created_at: string
}

interface CampaignWithDetails extends Campaign {
  productImageUrl?: string | null
  activities?: CampaignActivity[]
  expanded?: boolean
  progress?: number
  openRate?: number
  clickRate?: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingCampaign, setCancellingCampaign] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToAction, setCampaignToAction] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          products(
            product_name,
            product_data
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process campaigns with product images and progress
      const campaignsWithDetails: CampaignWithDetails[] = await Promise.all(
        (data || []).map(async (campaign) => {
          const progress = Math.min((campaign.emails_sent / campaign.email_count) * 100, 100)
          const openRate = campaign.emails_sent > 0 
            ? Math.round((campaign.emails_opened / campaign.emails_sent) * 100) 
            : 0
          const clickRate = campaign.emails_sent > 0
            ? Math.round((campaign.emails_clicked / campaign.emails_sent) * 100)
            : 0

          // Get product image
          let productImageUrl: string | null = null
          if (campaign.products?.product_data) {
            const productData = typeof campaign.products.product_data === 'string'
              ? JSON.parse(campaign.products.product_data)
              : campaign.products.product_data
            
            const productImages = productData?.product_images || []
            if (productImages.length > 0) {
              const firstImage = productImages[0]
              if (firstImage.startsWith('http')) {
                productImageUrl = firstImage
              } else {
                const { data: urlData } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(firstImage)
                productImageUrl = urlData.publicUrl
              }
            }
          }

          return {
            ...campaign,
            progress,
            openRate,
            clickRate,
            productImageUrl,
            activities: []
          } as CampaignWithDetails
        })
      )

      setCampaigns(campaignsWithDetails)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleViewDetails(campaignId: string) {
    router.push(`/dashboard/campaigns/${campaignId}`)
  }

  function openCancelDialog(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCampaignToAction(campaignId)
    setCancelDialogOpen(true)
  }

  async function handleCancelCampaign() {
    if (!campaignToAction) return

    setCancellingCampaign(campaignToAction)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignToAction)

      if (error) throw error

      // Reload campaigns
      await loadCampaigns()
      setCancelDialogOpen(false)
      setCampaignToAction(null)
    } catch (error) {
      console.error('Error cancelling campaign:', error)
      alert('Failed to cancel campaign. Please try again.')
    } finally {
      setCancellingCampaign(null)
    }
  }

  async function handlePauseCampaign(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    setCancellingCampaign(campaignId)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (error) throw error

      // Reload campaigns
      await loadCampaigns()
    } catch (error) {
      console.error('Error pausing campaign:', error)
      alert('Failed to pause campaign. Please try again.')
    } finally {
      setCancellingCampaign(null)
    }
  }

  async function handleResumeCampaign(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    setCancellingCampaign(campaignId)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (error) throw error

      // Reload campaigns
      await loadCampaigns()
    } catch (error) {
      console.error('Error resuming campaign:', error)
      alert('Failed to resume campaign. Please try again.')
    } finally {
      setCancellingCampaign(null)
    }
  }

  async function handleArchiveCampaign(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to archive this campaign? You can restore it later.')) {
      return
    }

    setCancellingCampaign(campaignId)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (error) throw error

      // Reload campaigns
      await loadCampaigns()
    } catch (error) {
      console.error('Error archiving campaign:', error)
      alert('Failed to archive campaign. Please try again.')
    } finally {
      setCancellingCampaign(null)
    }
  }

  function openDeleteDialog(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCampaignToAction(campaignId)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteCampaign() {
    if (!campaignToAction) return

    setCancellingCampaign(campaignToAction)
    try {
      // Delete campaign (cascade will delete activities)
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('campaign_id', campaignToAction)

      if (error) throw error

      // Reload campaigns
      await loadCampaigns()
      setDeleteDialogOpen(false)
      setCampaignToAction(null)
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign. Please try again.')
    } finally {
      setCancellingCampaign(null)
    }
  }


  async function handleExportCampaignData(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    try {
      const campaign = campaigns.find(c => c.campaign_id === campaignId)
      if (!campaign) return

      // Create CSV data
      const csvData = [
        ['Campaign Name', campaign.campaign_name],
        ['Status', campaign.status],
        ['Total Recipients', campaign.email_count],
        ['Emails Sent', campaign.emails_sent],
        ['Delivered', campaign.emails_delivered],
        ['Opened', campaign.emails_opened],
        ['Clicked', campaign.emails_clicked],
        ['Bounced', campaign.emails_bounced],
        ['RFQs Received', campaign.rfqs_received],
        ['Open Rate', `${campaign.openRate}%`],
        ['Click Rate', `${campaign.clickRate}%`],
        ['Created', new Date(campaign.created_at).toLocaleString()],
        ['Launched', campaign.launched_at ? new Date(campaign.launched_at).toLocaleString() : 'Not launched']
      ]

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${campaign.campaign_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting campaign data:', error)
      alert('Failed to export campaign data. Please try again.')
    }
  }

  function handleCreateCampaign() {
    router.push('/dashboard/campaigns/create/product')
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="relative">
          <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Campaigns</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Create and manage your email campaigns
                  </p>
                </div>
                <Button onClick={handleCreateCampaign} className="gap-2 min-h-[44px]">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">No campaigns yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Start your first email campaign to reach potential buyers
              </p>
              <Button onClick={handleCreateCampaign} className="gap-2 min-h-[44px]">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Campaigns</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'} created
              </p>
            </div>
            <Button onClick={handleCreateCampaign} className="gap-2 min-h-[44px]">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="divide-y divide-border/30">
            {campaigns.map((campaign) => {
              const canCancel = campaign.status === 'scheduled' || campaign.status === 'active'
              const canPause = campaign.status === 'active'
              const canResume = campaign.status === 'paused'
              const isLoading = cancellingCampaign === campaign.campaign_id

              return (
                <div
                  key={campaign.campaign_id}
                  className="p-4 sm:p-6 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Product Image */}
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {campaign.productImageUrl ? (
                        <img 
                          src={campaign.productImageUrl}
                          alt={campaign.products?.product_name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`text-xl sm:text-2xl font-bold text-primary/50 ${campaign.productImageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                        {campaign.products?.product_name?.charAt(0) || 'P'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Row 1: Campaign Name, Status, Date */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1">{campaign.campaign_name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(campaign.status)}`}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                            {campaign.launched_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(campaign.launched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {campaign.products && (
                              <span className="text-xs text-muted-foreground">• {campaign.products.product_name}</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewDetails(campaign.campaign_id)}
                            className="gap-2"
                          >
                            <BarChart3 className="h-4 w-4" />
                            View Analytics
                          </Button>
                          
                          {/* Primary Actions */}
                          {canResume && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleResumeCampaign(campaign.campaign_id, e)}
                              disabled={isLoading}
                              className="gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Resume
                            </Button>
                          )}
                          {canPause && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handlePauseCampaign(campaign.campaign_id, e)}
                              disabled={isLoading}
                              className="gap-2"
                            >
                              <Pause className="h-4 w-4" />
                              Pause
                            </Button>
                          )}

                          {/* More Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isLoading}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={(e) => handleExportCampaignData(campaign.campaign_id, e)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export Data (CSV)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {canCancel && (
                                <DropdownMenuItem
                                  onClick={(e) => openCancelDialog(campaign.campaign_id, e)}
                                  className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 dark:focus:bg-orange-950/20"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Campaign
                                </DropdownMenuItem>
                              )}
                              {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                                <DropdownMenuItem
                                  onClick={(e) => handleArchiveCampaign(campaign.campaign_id, e)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => openDeleteDialog(campaign.campaign_id, e)}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Row 2: Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{campaign.emails_sent} / {campaign.email_count} sent</span>
                        </div>
                        <div className="w-full bg-border/30 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{ width: `${campaign.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Row 3: Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Opens</span>
                          </div>
                          <div className="text-base font-bold">{campaign.openRate || 0}%</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MousePointerClick className="h-3 w-3" />
                            <span>Clicks</span>
                          </div>
                          <div className="text-base font-bold">{campaign.clickRate || 0}%</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>RFQs</span>
                          </div>
                          <div className="text-base font-bold text-accent">{campaign.rfqs_received}</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Reached</span>
                          </div>
                          <div className="text-base font-bold">{campaign.emails_sent}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cancel Campaign Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onOpenChange={(open) => {
          setCancelDialogOpen(open)
          if (!open) {
            setCampaignToAction(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
                setCampaignToAction(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelCampaign}
              disabled={cancellingCampaign !== null}
            >
              {cancellingCampaign ? 'Cancelling...' : 'Cancel Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setCampaignToAction(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this campaign? This action cannot be undone and all associated data will be lost, including all campaign activities and metrics.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setCampaignToAction(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCampaign}
              disabled={cancellingCampaign !== null}
            >
              {cancellingCampaign ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
