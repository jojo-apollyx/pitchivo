'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { EmailEventStats } from '@/components/email/email-event-stats'

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
  email_count: number
  emails_sent: number
  organizations?: {
    name: string
  }
  products?: {
    product_name: string
  }
}

export default function CampaignTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.campaignId as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadCampaign()
  }, [campaignId])

  async function loadCampaign() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, organizations(name), products(product_name)')
        .eq('campaign_id', campaignId)
        .maybeSingle()

      if (error) throw error
      setCampaign(data)
    } catch (error) {
      console.error('Error loading campaign:', error)
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign...</p>
      </main>
    )
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => router.push('/admin/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/campaigns')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-semibold">
                  {campaign.campaign_name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Detailed email tracking and analytics
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCampaign}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Campaign Info */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Organization</div>
                <div className="font-semibold">{campaign.organizations?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Product</div>
                <div className="font-semibold">{campaign.products?.product_name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Progress</div>
                <div className="font-semibold">
                  {campaign.emails_sent} / {campaign.email_count} emails sent
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Email Event Statistics */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border/50">
            <h2 className="text-lg font-semibold mb-4">Email Event Analytics</h2>
            <EmailEventStats campaignId={campaignId} isAdmin={true} />
          </div>

          {/* Note: Campaign emails are managed by Smartlead */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border/50">
            <h2 className="text-lg font-semibold mb-4">Campaign Email Management</h2>
            <p className="text-sm text-muted-foreground">
              Campaign emails are managed entirely through Smartlead. Email analytics above show data synced from Smartlead webhooks.
              To view individual email status and manage leads, visit the campaign details page.
            </p>
          </div>
        </div>
      </section>
      </div>
    </main>
  )
}

