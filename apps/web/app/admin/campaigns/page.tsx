'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Send, TrendingUp, Users, MousePointerClick, MessageSquare, Calendar, Plus, Minus, RefreshCw, BarChart3, Settings, Eye, CheckCircle2, XCircle, PauseCircle, PlayCircle, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Email form state
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
  }, [])

  // Filter campaigns based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCampaigns(campaigns)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = campaigns.filter((campaign) => {
        const campaignName = campaign.campaign_name?.toLowerCase() || ''
        const orgName = campaign.organizations?.name?.toLowerCase() || ''
        const productName = campaign.products?.product_name?.toLowerCase() || ''
        const status = campaign.status?.toLowerCase() || ''
        
        return (
          campaignName.includes(query) ||
          orgName.includes(query) ||
          productName.includes(query) ||
          status.includes(query)
        )
      })
      setFilteredCampaigns(filtered)
    }
  }, [searchQuery, campaigns])

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, organizations(name, domain), products(product_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
      setFilteredCampaigns(data || [])
      
      if (data && data.length > 0) {
        setSelectedCampaign(data[0])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendEmail() {
    if (!selectedCampaign || !emailTo || !emailSubject || !emailContent) {
      alert('Please fill in all email fields')
      return
    }

    setSending(true)
    try {
      // Send email via API
      const response = await fetch('/api/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign.campaign_id,
          to: emailTo,
          subject: emailSubject,
          content: emailContent
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      // Update campaign metrics
      await updateCampaignMetric(selectedCampaign.campaign_id, 'emails_sent', 1)
      await updateCampaignMetric(selectedCampaign.campaign_id, 'emails_delivered', 1)

      alert('Email sent successfully!')
      
      // Clear form
      setEmailTo('')
      setEmailContent('')
      
      // Reload campaigns
      await loadCampaigns()
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  async function updateCampaignMetric(campaignId: string, metric: string, increment: number) {
    try {
      const response = await fetch('/api/admin/campaigns/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, metric, increment })
      })

      if (!response.ok) {
        throw new Error('Failed to update metric')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating metric:', error)
      throw error
    }
  }

  async function handleUpdateMetric(metric: string, increment: number) {
    if (!selectedCampaign) return

    try {
      await updateCampaignMetric(selectedCampaign.campaign_id, metric, increment)
      await loadCampaigns()
    } catch (error) {
      console.error('Error updating metric:', error)
    }
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
      alert('Campaign status updated successfully!')
    } catch (error) {
      console.error('Error updating campaign status:', error)
      alert('Failed to update campaign status. Please try again.')
    }
  }

  function handleViewCampaignDetails(campaignId: string) {
    // Check if user is admin and create impersonation context
    router.push(`/admin/campaigns/${campaignId}/analytics`)
  }
  
  // Set default email subject and content when a campaign is selected
  useEffect(() => {
    if (selectedCampaign) {
      // Set default subject
      if (!emailSubject || emailSubject === getDefaultSubject(null)) {
        setEmailSubject(getDefaultSubject(selectedCampaign))
      }
      
      // Set default content
      if (!emailContent || emailContent === getDefaultContent(null)) {
        setEmailContent(getDefaultContent(selectedCampaign))
      }
    }
  }, [selectedCampaign])
  
  function getDefaultSubject(campaign: Campaign | null): string {
    if (!campaign) return ''
    
    const productName = campaign.products?.product_name || 'our product'
    return `Introducing ${productName} - Premium Solution for Your Business`
  }
  
  function getDefaultContent(campaign: Campaign | null): string {
    if (!campaign) return ''
    
    const orgName = campaign.organizations?.name || 'Our Company'
    const productName = campaign.products?.product_name || 'our premium product'
    
    return `Hi {{buyer_name}},

I hope this message finds you well. I'm reaching out from ${orgName} to introduce ${productName}.

We've noticed your company's commitment to quality, and we believe our solution could be a great fit for your needs. Our product offers:

• Premium quality and reliability
• Competitive pricing and flexible terms
• Dedicated support and partnership

I'd love to share more details with you. You can view our complete product information here:
{{product_link}}

Would you be interested in learning more or discussing how we can support your business?

Best regards,
${orgName} Team

P.S. Feel free to submit an RFQ directly through our product page if you'd like to move forward.`
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

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Campaign Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Admin view - {campaigns.length} total campaigns
              </p>
            </div>
            <Button onClick={loadCampaigns} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by campaign, company, product, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No campaigns yet</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No campaigns found matching "{searchQuery}"</p>
              <Button onClick={() => setSearchQuery('')} variant="outline" className="mt-4">
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Campaign List */}
              <div className="lg:col-span-1 space-y-3">
                <h2 className="text-lg font-semibold mb-4">
                  {searchQuery ? `Results (${filteredCampaigns.length})` : 'All Campaigns'}
                </h2>
                <div className="divide-y divide-border/30 border border-border/30 rounded-xl overflow-hidden">
                  {filteredCampaigns.map((campaign) => (
                    <button
                      key={campaign.campaign_id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`
                        w-full text-left p-4 hover:bg-accent/5 transition-colors
                        ${selectedCampaign?.campaign_id === campaign.campaign_id ? 'bg-primary/5' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate">{campaign.campaign_name}</h3>
                          <Badge variant="outline" className={`text-xs mb-2 ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </Badge>
                          {campaign.organizations && (
                            <p className="text-xs text-muted-foreground truncate">
                              {/* @ts-ignore */}
                              {campaign.organizations.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Campaign Details & Actions */}
              {selectedCampaign && (
                <div className="lg:col-span-2 space-y-6">
                  {/* Campaign Info */}
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-border/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-2">{selectedCampaign.campaign_name}</h2>
                        {selectedCampaign.organizations && (
                          <p className="text-sm text-muted-foreground">
                            {/* @ts-ignore */}
                            Organization: {selectedCampaign.organizations.name}
                          </p>
                        )}
                        {selectedCampaign.products && (
                          <p className="text-sm text-muted-foreground">
                            {/* @ts-ignore */}
                            Product: {selectedCampaign.products.product_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(selectedCampaign.status)}>
                          {selectedCampaign.status}
                        </Badge>
                      </div>
                    </div>

                    {selectedCampaign.launched_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                        <Calendar className="h-3 w-3" />
                        Launched: {new Date(selectedCampaign.launched_at).toLocaleString()}
                      </p>
                    )}

                    {/* Admin Actions */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewCampaignDetails(selectedCampaign.campaign_id)}
                        className="gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        View Detailed Analytics
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="status-change" className="text-xs text-muted-foreground whitespace-nowrap">Change Status:</Label>
                        <Select
                          value={selectedCampaign.status}
                          onValueChange={(value) => handleStatusChange(selectedCampaign.campaign_id, value)}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">
                              <div className="flex items-center gap-2">
                                <Settings className="h-3 w-3" />
                                Draft
                              </div>
                            </SelectItem>
                            <SelectItem value="scheduled">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Scheduled
                              </div>
                            </SelectItem>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <PlayCircle className="h-3 w-3" />
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="paused">
                              <div className="flex items-center gap-2">
                                <PauseCircle className="h-3 w-3" />
                                Paused
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </div>
                            </SelectItem>
                            <SelectItem value="cancelled">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-3 w-3" />
                                Cancelled
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Metrics with Manual Controls */}
                  <div className="bg-card/50 rounded-xl p-6 border border-border/30">
                    <h3 className="text-lg font-semibold mb-4">Campaign Metrics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Emails Sent */}
                      <div className="bg-background rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>Emails Sent</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateMetric('emails_sent', -1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateMetric('emails_sent', 1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{selectedCampaign.emails_sent}</div>
                        <div className="text-xs text-muted-foreground">of {selectedCampaign.email_count} planned</div>
                      </div>

                      {/* Emails Opened */}
                      <div className="bg-background rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>Opened</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateMetric('emails_opened', -1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateMetric('emails_opened', 1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{selectedCampaign.emails_opened}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedCampaign.emails_sent > 0 
                            ? `${Math.round((selectedCampaign.emails_opened / selectedCampaign.emails_sent) * 100)}%`
                            : '0%'
                          } open rate
                        </div>
                      </div>

                      {/* Emails Clicked */}
                      <div className="bg-background rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MousePointerClick className="h-4 w-4" />
                            <span>Clicked</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateMetric('emails_clicked', -1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateMetric('emails_clicked', 1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{selectedCampaign.emails_clicked}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedCampaign.emails_sent > 0 
                            ? `${Math.round((selectedCampaign.emails_clicked / selectedCampaign.emails_sent) * 100)}%`
                            : '0%'
                          } click rate
                        </div>
                      </div>

                      {/* RFQs */}
                      <div className="bg-background rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>RFQs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateMetric('rfqs_received', -1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateMetric('rfqs_received', 1)}
                              className="h-6 w-6 rounded-md hover:bg-accent/10 flex items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-accent">{selectedCampaign.rfqs_received}</div>
                        <div className="text-xs text-muted-foreground">conversions</div>
                      </div>
                    </div>
                  </div>

                  {/* Email Sending Form */}
                  <div className="bg-card/50 rounded-xl p-6 border border-border/30">
                    <h3 className="text-lg font-semibold mb-4">Send Campaign Email</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emailTo">Recipient Email</Label>
                        <Input
                          id="emailTo"
                          type="email"
                          placeholder="buyer@company.com"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="emailSubject">Subject Line</Label>
                        <Input
                          id="emailSubject"
                          type="text"
                          placeholder="Introducing our premium collagen peptides"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="emailContent">Email Content</Label>
                        <textarea
                          id="emailContent"
                          className="w-full min-h-[200px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Hi {{buyer_name}},&#10;&#10;I noticed your company sources ingredients for health and wellness products. We've recently launched our premium product.&#10;&#10;View full details: {{product_link}}&#10;&#10;Best regards"
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                        />
                        <div className="mt-2 bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <p className="text-xs font-semibold text-primary mb-2">📝 Available Placeholders:</p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2">
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{product_link}}'}</code>
                              <span>→ Full URL to product page</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{product_name}}'}</code>
                              <span>→ Product name</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{buyer_name}}'}</code>
                              <span>→ Buyer company name</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{org_name}}'}</code>
                              <span>→ Your organization name</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Placeholders will be automatically replaced when email is sent.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleSendEmail}
                        disabled={sending || !emailTo || !emailSubject || !emailContent}
                        className="w-full gap-2 min-h-[44px]"
                      >
                        <Send className="h-4 w-4" />
                        {sending ? 'Sending...' : 'Send Email'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
