'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Rocket, Building2, Users, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { getSenderHealthLabel, getSenderHealthGrade, calculateCampaignMetrics } from '@/lib/mock-data/buyers'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function ReviewLaunchPage() {
  const router = useRouter()
  const { draft, prevStep, resetDraft } = useCampaignStore()
  const [confirmed, setConfirmed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadOrgId()
  }, [])

  async function loadOrgId() {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .single()

      if (profile) {
        setOrgId(profile.organization_id)
      }
    } catch (error) {
      console.error('Error loading org:', error)
    }
  }

  const metrics = calculateCampaignMetrics(draft.emailCount, draft.durationDays)
  const senderHealthInfo = getSenderHealthLabel(draft.senderHealth)

  async function handleLaunch() {
    if (!confirmed || !orgId || !draft.productId) return

    setLaunching(true)

    try {
      // Create campaign in database
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          org_id: orgId,
          product_id: draft.productId,
          campaign_name: `${draft.productName} Campaign`,
          data_source_id: draft.dataSourceId,
          buyer_count: draft.buyerCount,
          email_count: draft.emailCount,
          duration_days: draft.durationDays,
          start_date: draft.startDate?.toISOString() || new Date().toISOString(),
          sender_email: draft.senderEmail,
          sender_health: draft.senderHealth,
          status: 'scheduled',
          launched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Reset draft
      resetDraft()

      // Redirect to campaigns page
      router.push('/dashboard/campaigns')
    } catch (error) {
      console.error('Error launching campaign:', error)
      alert('Failed to launch campaign. Please try again.')
    } finally {
      setLaunching(false)
    }
  }

  function handleBack() {
    prevStep()
    router.push('/dashboard/campaigns/create/config')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-base sm:text-lg font-semibold">Campaign Setup</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Step 4 of 4</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              Review Your Campaign
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Confirm details before launch
            </p>
          </div>

          <div className="space-y-6">
            {/* Section 1: Product Summary */}
            <div className="pb-6 border-b border-border/30">
              <h3 className="text-lg font-semibold mb-4">Product Summary</h3>
              <div className="bg-card/50 rounded-xl p-4 flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary/50">
                    {draft.productName?.charAt(0) || 'P'}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-2">{draft.productName}</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {draft.productTags?.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {draft.attachedFilesCount || 0} {draft.attachedFilesCount === 1 ? 'file' : 'files'} attached
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Audience Summary */}
            <div className="pb-6 border-b border-border/30">
              <h3 className="text-lg font-semibold mb-4">Audience Summary</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total buyers</div>
                    <div className="text-xl font-bold text-primary">
                      {draft.buyerCount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total contacts</div>
                    <div className="text-xl font-bold">
                      {draft.totalContacts.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Data source</div>
                    <div className="text-sm font-semibold">
                      Pitchville Curated DB
                    </div>
                  </div>
                </div>

                {/* Sample Buyers */}
                {draft.sampleBuyers && draft.sampleBuyers.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-3">Sample buyers:</p>
                    <div className="space-y-2">
                      {draft.sampleBuyers.slice(0, 3).map((buyer, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{buyer.company}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{buyer.contacts}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Sending Configuration Summary */}
            <div className="pb-6 border-b border-border/30">
              <h3 className="text-lg font-semibold mb-4">Sending Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Emails to send</span>
                  </div>
                  <div className="text-2xl font-bold">{draft.emailCount}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">Duration</div>
                  <div className="text-2xl font-bold">{draft.durationDays} days</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">Daily rate</div>
                  <div className="text-2xl font-bold">{metrics.emailsPerDay}/day</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">Start date</div>
                  <div className="text-base font-semibold">
                    {draft.startDate 
                      ? draft.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Immediately'
                    }
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sender identity:</span>{' '}
                    <span className="font-mono text-xs">{draft.senderEmail}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sender health:</span>{' '}
                    <span className={`font-semibold ${senderHealthInfo.color}`}>
                      {senderHealthInfo.icon} {senderHealthInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Email Section (Collapsible) */}
            <div className="pb-6 border-b border-border/30">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-between w-full text-left hover:bg-accent/5 rounded-lg p-2 -mx-2 transition-colors"
              >
                <h3 className="text-lg font-semibold">Preview AI-generated outreach sample</h3>
                {showPreview ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {showPreview && (
                <div className="mt-4 bg-muted/30 rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground italic">
                    Subject: Introducing {draft.productName} - Premium Quality for Your Products
                  </p>
                  <p className="text-muted-foreground mt-3">
                    Hi [First Name],
                  </p>
                  <p className="text-muted-foreground mt-2">
                    I noticed your company sources ingredients for health and wellness products. We've recently launched {draft.productName}, which might be perfect for your formulations...
                  </p>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    (Sample text for preview purposes only)
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I confirm all campaign details are correct and I agree to Pitchville Terms.
                </span>
              </label>
            </div>

            {/* Launch Button */}
            <div className="flex justify-center pt-4">
              <div className="text-center">
                <Button
                  onClick={handleLaunch}
                  disabled={!confirmed || launching}
                  className="gap-2 min-h-[52px] px-8 text-base"
                  size="lg"
                >
                  <Rocket className="h-5 w-5" />
                  {launching ? 'Launching...' : 'Launch Campaign'}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Emails will start sending within 15 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sticky Bar (Mobile) */}
      <section className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 border-t border-border/50 sm:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Progress Indicator */}
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            </div>

            {/* Launch Button */}
            <Button
              onClick={handleLaunch}
              disabled={!confirmed || launching}
              className="gap-2 min-h-[44px]"
            >
              <Rocket className="h-4 w-4" />
              {launching ? 'Launching...' : 'Launch'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

