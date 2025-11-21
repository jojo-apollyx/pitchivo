'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Activity, Users, BarChart3, List, Settings, Play, Pause, Square, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getDisplayName } from '@/lib/utils/campaign-naming'

// Tab components
import { OverviewTab } from './components/OverviewTab'
import { LeadsTab } from './components/LeadsTab'
import { AnalyticsTab } from './components/AnalyticsTab'
import { SequencesTab } from './components/SequencesTab'
import { SettingsTab } from './components/SettingsTab'

interface Campaign {
  campaign_id: string
  display_name: string
  smartlead_name: string
  smartlead_campaign_id: string
  status: string
  email_count: number
  duration_days: number
  start_date: string
  created_at: string
  launched_at: string
  
  // Metrics
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  emails_delivered: number
  emails_bounced: number
  replies_received: number
  
  // Relations
  products?: {
    product_name: string
  }
  organizations?: {
    name: string
    slug: string
  }
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.campaignId as string
  const supabase = createClient()
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
    }
  }, [campaignId])

  async function loadCampaign() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          products(product_name),
          organizations(name, slug)
        `)
        .eq('campaign_id', campaignId)
        .single()

      if (error) throw error
      setCampaign(data)
    } catch (error) {
      console.error('Error loading campaign:', error)
      toast.error('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: 'active' | 'paused' | 'stopped') {
    if (!campaign?.smartlead_campaign_id) {
      toast.error('Campaign not synced with Smartlead')
      return
    }

    setIsUpdating(true)
    try {
      // Map our status to Smartlead status
      const smartleadStatus = {
        active: 'START',
        paused: 'PAUSED',
        stopped: 'STOPPED'
      }[newStatus]

      // Call Smartlead API to update status
      const response = await fetch(`/api/smartlead/campaigns/${campaign.smartlead_campaign_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: smartleadStatus })
      })

      if (!response.ok) throw new Error('Failed to update campaign status')

      // Update local database
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (error) throw error

      toast.success(`Campaign ${newStatus}`)
      await loadCampaign()
    } catch (error) {
      console.error('Error updating campaign status:', error)
      toast.error('Failed to update campaign status')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    setIsUpdating(true)
    try {
      // Delete from Smartlead if campaign is synced
      if (campaign?.smartlead_campaign_id) {
        const response = await fetch(`/api/smartlead/campaigns/${campaignId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          console.error('Failed to delete from Smartlead, continuing with local delete')
        }
      }

      // Delete from local database
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('campaign_id', campaignId)

      if (error) throw error

      toast.success('Campaign deleted')
      router.push('/admin/campaigns')
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
      setIsUpdating(false)
    }
  }

  async function handleExport() {
    if (!campaign?.smartlead_campaign_id) {
      toast.error('Campaign not synced with Smartlead')
      return
    }

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/export`)
      if (!response.ok) throw new Error('Failed to export campaign data')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${campaign.display_name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Campaign data exported')
    } catch (error) {
      console.error('Error exporting campaign:', error)
      toast.error('Failed to export campaign data')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            Campaign not found. It may have been deleted.
          </AlertDescription>
          <Button onClick={() => router.push('/admin/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </Alert>
      </div>
    )
  }

  const displayName = campaign.display_name || getDisplayName(campaign.smartlead_name || '')
  const statusColors = {
    drafted: 'bg-gray-500',  // Matches Smartlead DRAFTED
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    stopped: 'bg-orange-500',  // Matches Smartlead STOPPED (replaces cancelled)
    completed: 'bg-purple-500',
    deleted: 'bg-red-500'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {/* Top Row: Back, Title, Badges, Export, Delete */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/campaigns')}
                  className="mt-1 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={statusColors[campaign.status as keyof typeof statusColors] || 'bg-gray-500'}>
                        {campaign.status}
                      </Badge>
                      {!campaign.smartlead_campaign_id && (
                        <Badge variant="outline" className="text-amber-600">
                          Not Synced
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="whitespace-nowrap">Product: {campaign.products?.product_name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    {campaign.launched_at && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">Launched: {new Date(campaign.launched_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Export and Delete buttons on the right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-2"
                  onClick={handleDelete}
                  disabled={isUpdating}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
            
            {/* Status Control Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {campaign.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('paused')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Pause className="h-4 w-4" />
                  <span className="hidden sm:inline">Pause</span>
                </Button>
              )}
              
              {campaign.status === 'paused' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Resume</span>
                </Button>
              )}
              
              {(campaign.status === 'active' || campaign.status === 'paused') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('stopped')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  <span className="hidden sm:inline">Stop</span>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="bg-card/50 rounded-xl border border-border/30 p-2">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Leads</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="sequences" className="gap-2">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Sequences</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <OverviewTab campaign={campaign} onRefresh={loadCampaign} />
              </TabsContent>

              <TabsContent value="leads" className="space-y-6">
                <LeadsTab campaign={campaign} onRefresh={loadCampaign} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsTab campaign={campaign} />
              </TabsContent>

              <TabsContent value="sequences" className="space-y-6">
                <SequencesTab campaign={campaign} onRefresh={loadCampaign} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <SettingsTab campaign={campaign} onRefresh={loadCampaign} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  )
}

