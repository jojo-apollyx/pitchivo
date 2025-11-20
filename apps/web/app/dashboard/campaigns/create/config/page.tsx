'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Multiselect } from '@/components/ui/multiselect'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { calculateCampaignMetrics } from '@/lib/mock-data/buyers'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'
import { Slider } from '@/components/ui/slider'
import { PRICING_TIERS, CAMPAIGN_MIN_EMAILS } from '@/lib/constants/pricing'

export default function ConfigureSendingPage() {
  const router = useRouter()
  const { draft, setDraft, nextStep, prevStep } = useCampaignStore()
  const [emailCount, setEmailCount] = useState(draft.emailCount)
  const [durationDays, setDurationDays] = useState(draft.durationDays)
  const [startDate, setStartDate] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [selectedLocations, setSelectedLocations] = useState<string[]>((draft as any).priorityLocations || [])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const supabase = createClient()
  
  // Get subscription and quota data
  const { tier, quotaUsage, isLoading: isLoadingSub } = useSubscription(orgId || undefined)

  const availableCountries = ['USA', 'Canada', 'UK', 'Germany', 'Australia', 'Japan', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Belgium', 'Austria', 'Poland', 'Brazil', 'Mexico', 'India', 'China', 'South Korea', 'Singapore', 'New Zealand']

  useEffect(() => {
    loadOrgSlug()
  }, [])

  async function loadOrgSlug() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error getting user:', userError)
        return
      }

      // Select multiple columns exactly like auth/callback/page.tsx does (which works)
      // PostgREST sometimes rejects single-column selects from browser client
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, domain, organization_id, metadata, org_role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        return
      }

      if (profile?.organization_id) {
        setOrgId(profile.organization_id)
      }
    } catch (error) {
      console.error('Error loading org:', error)
    }
  }

  const metrics = calculateCampaignMetrics(emailCount, durationDays)
  
  // Use real subscription quota - default to free tier values while loading
  const defaultQuota = PRICING_TIERS.free.features.emailQuota
  const planQuota = quotaUsage?.emailsQuota || defaultQuota
  const usedQuota = quotaUsage?.emailsUsed || 0
  const remainingQuota = quotaUsage?.emailsRemaining || defaultQuota
  const canSendCampaign = remainingQuota >= emailCount
  const isQuotaSufficient = isLoadingSub || canSendCampaign || tier === 'enterprise' // Don't block during loading

  function handleNext() {
    // Check quota before proceeding
    if (!isQuotaSufficient) {
      setShowUpgradePrompt(true)
      return
    }
    
    setDraft({
      emailCount,
      durationDays,
      startDate: startDate ? new Date(startDate) : undefined,
      priorityLocations: selectedLocations
    })
    nextStep()
    router.push('/dashboard/campaigns/create/review')
  }


  function handleBack() {
    prevStep()
    router.push('/dashboard/campaigns/create/buyers')
  }

  const isValid = emailCount >= CAMPAIGN_MIN_EMAILS && emailCount <= planQuota && durationDays >= metrics.minDays && isQuotaSufficient

  return (
    <main className="min-h-screen bg-background">
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
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-semibold">Campaign Setup</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Step 3 of 4</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section - Configuration Form */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-display font-semibold mb-2">
                  Set Sending Parameters
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Control how many buyers you'll reach and over what period.
                </p>
              </div>

              <div className="space-y-6">
                {/* Email Count and Duration - Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border/30">
                  {/* Email Count */}
                  <div>
                    <Label htmlFor="emailCount" className="text-base font-semibold mb-3 block">
                      Number of emails to send
                    </Label>
                    <div className="space-y-3">
                      <Input
                        id="emailCount"
                        type="number"
                        min={CAMPAIGN_MIN_EMAILS}
                        max={planQuota}
                        value={emailCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          setEmailCount(Math.min(value, planQuota))
                          // Auto-adjust duration if needed
                          const minDays = Math.max(Math.ceil(value / 250), 1)
                          if (durationDays < minDays) {
                            setDurationDays(minDays)
                          }
                        }}
                        className="text-lg"
                      />
                      <Slider
                        min={CAMPAIGN_MIN_EMAILS}
                        max={planQuota}
                        step={CAMPAIGN_MIN_EMAILS}
                        value={[emailCount]}
                        onValueChange={(values) => {
                          const value = values[0]
                          setEmailCount(value)
                          const minDays = Math.max(Math.ceil(value / 250), 1)
                          if (durationDays < minDays) {
                            setDurationDays(minDays)
                          }
                        }}
                        className="w-full"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <p className="text-xs text-muted-foreground cursor-help hover:text-foreground transition-colors">
                            {!canSendCampaign && !isLoadingSub ? (
                              <>
                                <span className="text-destructive font-semibold">⚠️ Insufficient quota. </span>
                                <a href="/dashboard/settings/billing" className="text-primary underline hover:no-underline">
                                  Upgrade your plan
                                </a>
                                <span className="ml-1">to send this campaign</span>
                                <Info className="inline h-3 w-3 ml-1" />
                              </>
                            ) : (
                              <>
                                <span>Remaining: <span className="font-semibold text-foreground">{remainingQuota.toLocaleString()}</span> emails. </span>
                                <a href="/dashboard/settings/billing" className="text-primary hover:underline">
                                  Need more?
                                </a>
                                <Info className="inline h-3 w-3 ml-1" />
                              </>
                            )}
                          </p>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Email Quota Details</h4>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Current plan:</span>
                                <span className="font-semibold text-foreground">{tier?.toUpperCase() || 'FREE'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Monthly quota:</span>
                                <span className="font-semibold text-foreground">{planQuota.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Already used:</span>
                                <span className="font-semibold text-foreground">{usedQuota.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>This campaign:</span>
                                <span className="font-semibold text-foreground">{emailCount.toLocaleString()}</span>
                              </div>
                              <div className="h-px bg-border my-2" />
                              <div className="flex justify-between">
                                <span>Remaining after:</span>
                                <span className={`font-semibold ${remainingQuota - emailCount >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                  {(remainingQuota - emailCount).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {!canSendCampaign && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Upgrade to send more emails per month
                                </p>
                                <Button size="sm" className="w-full" asChild>
                                  <a href="/dashboard/settings/billing">
                                    View Plans
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="duration" className="text-base font-semibold mb-3 block">
                      Distribute over (days)
                    </Label>
                    <div className="space-y-3">
                      <Input
                        id="duration"
                        type="number"
                        min={metrics.minDays}
                        max="30"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                        className="text-lg"
                      />
                      <Slider
                        min={metrics.minDays}
                        max={30}
                        step={1}
                        value={[durationDays]}
                        onValueChange={(values) => setDurationDays(values[0])}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        {metrics.minDays > 1 && (
                          <p>Min {metrics.minDays} days for {emailCount}+ emails</p>
                        )}
                        <p className="flex items-center gap-1 mt-1">
                          <Info className="h-3 w-3" />
                          Gradual delivery improves inbox placement
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Date & Location Preferences - Same Line */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="startDate" className="text-base font-semibold mb-3 block">
                        Start sending on
                      </Label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-11 bg-background border-border shadow-sm hover:bg-accent",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {startDate ? format(new Date(startDate + 'T00:00:00'), 'PPP') : 'Select date (optional)'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 shadow-lg border-border/50" align="start">
                          <Calendar
                            value={startDate ? new Date(startDate + 'T00:00:00') : undefined}
                            onChange={(date) => {
                              if (date) {
                                const dateStr = format(date, 'yyyy-MM-dd')
                                setStartDate(dateStr)
                                setCalendarOpen(false)
                              } else {
                                setStartDate('')
                              }
                            }}
                            minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground mt-2">
                        Leave blank to start immediately.
                      </p>
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Location Preferences
                      </Label>
                      <Multiselect
                        options={availableCountries}
                        value={selectedLocations}
                        onChange={setSelectedLocations}
                        placeholder="Select locations (optional)..."
                        searchable={true}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Prioritize sending to companies in these locations. Leave empty to target all locations equally.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Section - Live Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Estimated Schedule */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-5 border border-border/30">
                  <h3 className="text-base font-semibold mb-4">Estimated Schedule</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Emails per day</div>
                      <div className="text-2xl font-bold">{metrics.emailsPerDay}</div>
                    </div>
                    <div className="pt-3 border-t border-border/30">
                      <div className="text-xs text-muted-foreground mb-1">Est. completion</div>
                      <div className="text-base font-semibold">
                        {new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/30">
                      <div className="text-xs text-muted-foreground mb-1">Deliverability grade</div>
                      <div className="text-2xl font-bold text-primary">{metrics.deliverabilityGrade}</div>
                    </div>
                  </div>
                </div>

                {/* Plan Usage */}
                <div className="bg-card/50 rounded-xl p-5 border border-border/30">
                  <h3 className="text-base font-semibold mb-4">Plan Usage</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly quota</span>
                      <span className="font-semibold">{planQuota.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selected</span>
                      <span className="font-semibold">{emailCount.toLocaleString()} ({Math.round((emailCount / planQuota) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-border/30 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${Math.min((emailCount / planQuota) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  onClick={handleNext}
                  disabled={!isValid}
                  className="w-full gap-2 min-h-[44px]"
                >
                  Next: Review & Launch
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sticky Bar (Mobile) */}
      <section className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 border-t border-border/50 lg:hidden">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Progress Indicator */}
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-border"></div>
            </div>

            {/* Next Button */}
            <Button
              onClick={handleNext}
              disabled={!isValid}
              className="gap-2 min-h-[44px]"
            >
              Next: Review & Launch
            </Button>
          </div>
        </div>
      </section>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        feature={`Send ${emailCount.toLocaleString()} emails per campaign`}
        currentTier={tier || 'free'}
        recommendedTier={tier === 'free' ? 'basic' : 'premium'}
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        showComparison
      />
    </main>
  )
}

