'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, Users, MousePointerClick, MessageSquare, Calendar, Activity, Mail, X, Pause, Play, MoreVertical, Archive, Trash2, Download, BarChart3 } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { EmptyCampaignsIllustration } from '@/components/ui/illustrations'
import { PageLoadingSkeleton } from '@/components/ui/skeleton-loading'

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
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
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
      // Check if campaign has Smartlead integration
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', campaignToAction)
        .single()

      if (campaign?.smartlead_campaign_id) {
        // Call Smartlead API to stop campaign (Smartlead uses 'stopped' not 'cancelled')
        const response = await fetch(`/api/smartlead/campaigns/${campaignToAction}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'STOPPED' })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to stop campaign in Smartlead')
        }

        toast.success('Campaign stopped successfully')
      } else {
        // Campaign not synced with Smartlead, just update local status
        // Use 'stopped' instead of 'cancelled' for consistency
      }

      // Update local database (use 'stopped' instead of 'cancelled' for consistency with Smartlead)
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'stopped',
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
      toast.error('Failed to cancel campaign. Please try again.', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setCancellingCampaign(null)
    }
  }

  async function handlePauseCampaign(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    setCancellingCampaign(campaignId)
    try {
      // Check if campaign has Smartlead integration
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', campaignId)
        .single()

      if (campaign?.smartlead_campaign_id) {
        // Call Smartlead API to pause campaign
        const response = await fetch(`/api/smartlead/campaigns/${campaignId}/pause`, {
          method: 'POST'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to pause campaign in Smartlead')
        }

        toast.success('Campaign paused successfully')
      } else {
        // Campaign not synced with Smartlead, just update local status
        const { error } = await supabase
          .from('campaigns')
          .update({ 
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)

        if (error) throw error
        toast.success('Campaign paused successfully')
      }

      // Reload campaigns
      await loadCampaigns()
    } catch (error) {
      console.error('Error pausing campaign:', error)
      toast.error('Failed to pause campaign. Please try again.', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setCancellingCampaign(null)
    }
  }

  async function handleResumeCampaign(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    setCancellingCampaign(campaignId)
    try {
      // Check if campaign has Smartlead integration
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', campaignId)
        .single()

      if (campaign?.smartlead_campaign_id) {
        // Call Smartlead API to resume campaign
        const response = await fetch(`/api/smartlead/campaigns/${campaignId}/resume`, {
          method: 'POST'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to resume campaign in Smartlead')
        }

        toast.success('Campaign resumed successfully')
      } else {
        // Campaign not synced with Smartlead, just update local status
        const { error } = await supabase
          .from('campaigns')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)

        if (error) throw error
        toast.success('Campaign resumed successfully')
      }

      // Reload campaigns
      await loadCampaigns()
    } catch (error) {
      console.error('Error resuming campaign:', error)
      toast.error('Failed to resume campaign. Please try again.', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setCancellingCampaign(null)
    }
  }

  function handleArchiveClick(campaignId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCampaignToAction(campaignId)
    setArchiveDialogOpen(true)
  }

  async function handleArchiveCampaign() {
    if (!campaignToAction) return

    setArchiveDialogOpen(false)
    setCancellingCampaign(campaignToAction)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignToAction)

      if (error) throw error

      // Reload campaigns
      await loadCampaigns()
      toast.success('Campaign archived successfully')
    } catch (error) {
      console.error('Error archiving campaign:', error)
      toast.error('Failed to archive campaign. Please try again.')
    } finally {
      setCancellingCampaign(null)
      setCampaignToAction(null)
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
      // Get campaign details first to check if it has a Smartlead campaign ID
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('smartlead_campaign_id')
        .eq('campaign_id', campaignToAction)
        .single()

      // Delete campaign from Smartlead if it has a Smartlead ID
      if (campaign?.smartlead_campaign_id) {
        try {
          const smartleadResponse = await fetch(`/api/smartlead/campaigns/${campaign.smartlead_campaign_id}`, {
            method: 'DELETE'
          })
          
          if (!smartleadResponse.ok) {
            console.error('Failed to delete campaign from Smartlead:', await smartleadResponse.text())
            // Continue with local deletion even if remote deletion fails
            toast.error('Campaign deleted locally but remote deletion failed', {
              description: 'The campaign was removed from your dashboard but may still exist remotely.'
            })
          } else {
            console.log('Campaign deleted from Smartlead successfully')
          }
        } catch (smartleadError) {
          console.error('Error deleting campaign from Smartlead:', smartleadError)
          // Continue with local deletion even if Smartlead deletion fails
        }
      }

      // Delete campaign from our database (cascade will delete activities)
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('campaign_id', campaignToAction)

      if (error) throw error

      toast.success('Campaign deleted successfully')

      // Reload campaigns
      await loadCampaigns()
      setDeleteDialogOpen(false)
      setCampaignToAction(null)
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign. Please try again.')
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
      toast.error('Failed to export campaign data', {
        description: error instanceof Error ? error.message : 'Please try again.'
      })
    }
  }

  function handleCreateCampaign() {
    router.push('/dashboard/campaigns/create/product')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'drafted':
        return 'bg-accent-surface text-primary-dark border-primary-dark/30'
      case 'completed':
        return 'bg-semantic-success-soft text-semantic-success border-semantic-success'
      case 'paused':
        return 'bg-semantic-warning-soft text-semantic-warning border-semantic-warning'
      case 'stopped':
        return 'bg-semantic-error-soft text-semantic-error border-semantic-error'
      default:
        return 'bg-background-secondary text-muted-foreground border-border'
    }
  }


  if (loading) {
    return <PageLoadingSkeleton title subtitle cards={4} />
  }

  if (campaigns.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="relative">
          <motion.section 
            id="campaigns-header-section" 
            className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Campaigns</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage your email campaigns
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button id="campaigns-new-campaign-button-empty" aria-label="Create new campaign" onClick={handleCreateCampaign} className="gap-2 h-10 rounded-md">
                    <Plus className="h-4 w-4" />
                    New Campaign
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.section>

          <motion.section 
            id="campaigns-empty-state-section" 
            className="px-4 sm:px-6 lg:px-8 py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="max-w-md mx-auto text-center">
              {/* Minimalist rocket illustration with animation */}
              <motion.div 
                className="mb-8"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring', damping: 15 }}
              >
                <EmptyCampaignsIllustration size="lg" className="mx-auto" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold mb-2 text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                No campaigns yet
              </motion.h2>
              <motion.p 
                className="text-muted-foreground mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Start your first email campaign to reach potential buyers
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button id="campaigns-create-campaign-button" aria-label="Create first campaign" onClick={handleCreateCampaign} className="gap-2 h-10 rounded-md">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <section id="campaigns-header-with-campaigns-section" className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Campaigns</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage your email campaigns
              </p>
            </div>
            <Button id="campaigns-new-campaign-button" aria-label="Create new campaign" onClick={handleCreateCampaign} className="gap-2 h-10 rounded-md">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </section>

      <section id="campaigns-content-section" className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="divide-y divide-border/30">
                {campaigns.map((campaign) => {
              const canCancel = campaign.status === 'drafted' || campaign.status === 'active'
              const canPause = campaign.status === 'active'
              const canResume = campaign.status === 'paused'
              const isLoading = cancellingCampaign === campaign.campaign_id

              return (
                <div
                  key={campaign.campaign_id}
                  className="p-4 sm:p-5 hover:bg-background-secondary transition-colors duration-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Product Image */}
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-md bg-accent-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                      <div className={`text-xl font-semibold text-primary-dark ${campaign.productImageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                        {campaign.products?.product_name?.charAt(0) || 'P'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Row 1: Campaign Name, Status, Date */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 text-foreground">{campaign.campaign_name}</h3>
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
                            className="gap-2 h-9"
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
                              className="gap-2 h-9"
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
                              className="gap-2 h-9"
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
                                className="h-9 w-9 p-0"
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
                              {(campaign.status === 'completed' || campaign.status === 'stopped') && (
                                <DropdownMenuItem
                                  onClick={(e) => handleArchiveClick(campaign.campaign_id, e)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => openDeleteDialog(campaign.campaign_id, e)}
                                className="text-semantic-error focus:text-semantic-error focus:bg-semantic-error-soft"
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
                        <div className="w-full bg-background-secondary rounded-full h-1.5">
                          <div
                            className="bg-primary-dark rounded-full h-1.5 transition-all duration-300"
                            style={{ width: `${campaign.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Row 3: Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-background-secondary rounded-md p-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Opens</span>
                          </div>
                          <div className="text-base font-semibold text-foreground">{campaign.openRate || 0}%</div>
                        </div>
                        <div className="bg-background-secondary rounded-md p-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MousePointerClick className="h-3 w-3" />
                            <span>Clicks</span>
                          </div>
                          <div className="text-base font-semibold text-foreground">{campaign.clickRate || 0}%</div>
                        </div>
                        <div className="bg-background-secondary rounded-md p-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>RFQs</span>
                          </div>
                          <div className="text-base font-semibold text-semantic-success">{campaign.rfqs_received}</div>
                        </div>
                        <div className="bg-background-secondary rounded-md p-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Reached</span>
                          </div>
                          <div className="text-base font-semibold text-foreground">{campaign.emails_sent}</div>
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
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelCampaign}
              disabled={cancellingCampaign !== null}
              className="h-10"
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
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCampaign}
              disabled={cancellingCampaign !== null}
              className="h-10"
            >
              {cancellingCampaign ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Campaign Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this campaign? You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveCampaign} className="h-10">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
