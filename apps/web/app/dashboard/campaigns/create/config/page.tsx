'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Info, CheckCircle2, AlertTriangle, Clock, XCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Multiselect } from '@/components/ui/multiselect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { SENDER_ADDRESSES, getSenderHealthLabel, getSenderHealthGrade, calculateCampaignMetrics } from '@/lib/mock-data/buyers'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function ConfigureSendingPage() {
  const router = useRouter()
  const { draft, setDraft, nextStep, prevStep } = useCampaignStore()
  const [emailCount, setEmailCount] = useState(draft.emailCount)
  const [durationDays, setDurationDays] = useState(draft.durationDays)
  const [startDate, setStartDate] = useState('')
  const [senderEmail, setSenderEmail] = useState(draft.senderEmail || '')
  const [orgSlug, setOrgSlug] = useState('yourcompany')
  const [selectedLocations, setSelectedLocations] = useState<string[]>((draft as any).priorityLocations || [])
  const [reputationDialogOpen, setReputationDialogOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const supabase = createClient()

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
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', profile.organization_id)
          .single()

        if (orgError) {
          console.error('Error loading organization:', orgError)
          return
        }

        if (org?.slug) {
          setOrgSlug(org.slug)
        }
      }
    } catch (error) {
      console.error('Error loading org:', error)
    }
  }

  // For Pitchivo managed email, use default healthy stats
  const isPitchivoManaged = senderEmail === 'pitchivo-managed'
  const selectedSender = senderEmail && !isPitchivoManaged ? SENDER_ADDRESSES.find(s => s.email === senderEmail) : null
  const senderHealth: 'healthy' | 'warming_up' | 'caution' | 'poor' = isPitchivoManaged ? 'healthy' : (selectedSender?.health || 'healthy')
  const senderHealthInfo = getSenderHealthLabel(senderHealth)
  const deliveryRate = isPitchivoManaged ? 98 : (selectedSender?.deliveryRate || 98)
  const lastWarmup = isPitchivoManaged ? '2 days ago' : (selectedSender?.lastWarmup || '3 days ago')

  const metrics = calculateCampaignMetrics(emailCount, durationDays)
  const planQuota = 2000
  const remainingQuota = planQuota - emailCount

  function handleNext() {
    // For Pitchivo managed, store the generic domain, otherwise replace {org} placeholder
    const finalSenderEmail = isPitchivoManaged 
      ? `@${orgSlug}.pitchivo.com` 
      : senderEmail 
        ? senderEmail.replace('{org}', orgSlug) 
        : ''
    
    setDraft({
      emailCount,
      durationDays,
      startDate: startDate ? new Date(startDate) : undefined,
      senderEmail: finalSenderEmail,
      senderHealth,
      priorityLocations: selectedLocations
    })
    nextStep()
    router.push('/dashboard/campaigns/create/review')
  }


  function handleBack() {
    prevStep()
    router.push('/dashboard/campaigns/create/buyers')
  }

  const isValid = emailCount >= 50 && emailCount <= planQuota && durationDays >= metrics.minDays

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
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">
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
                    <div className="space-y-2">
                      <Input
                        id="emailCount"
                        type="number"
                        min="50"
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
                      <input
                        type="range"
                        min="50"
                        max={planQuota}
                        value={emailCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          setEmailCount(value)
                          const minDays = Math.max(Math.ceil(value / 250), 1)
                          if (durationDays < minDays) {
                            setDurationDays(minDays)
                          }
                        }}
                        className="w-full accent-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        Remaining: <span className="font-semibold text-foreground">{remainingQuota}</span> emails
                        {remainingQuota < 0 && (
                          <span className="text-destructive ml-2">⚠️ Upgrade needed</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="duration" className="text-base font-semibold mb-3 block">
                      Distribute over (days)
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="duration"
                        type="number"
                        min={metrics.minDays}
                        max="30"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                        className="text-lg"
                      />
                      <input
                        type="range"
                        min={metrics.minDays}
                        max="30"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value))}
                        className="w-full accent-primary"
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
                <div className="pb-6 border-b border-border/30">
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

                {/* Sender Identity */}
                <div>
                  <Label htmlFor="sender" className="text-base font-semibold mb-3 block">
                    Select sender address <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={senderEmail || undefined} onValueChange={(value) => setSenderEmail(value)}>
                        <SelectTrigger className="flex-1 h-11">
                          <SelectValue placeholder="We'll choose the best sender address for you" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pitchivo-managed">
                            @{orgSlug}.pitchivo.com
                          </SelectItem>
                          <SelectItem value="custom-email" disabled>
                            <div className="flex items-center justify-between w-full">
                              <span className="text-muted-foreground">Use your own email</span>
                              <span className="text-xs text-muted-foreground ml-2">(Supporting soon)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Redesigned Health Indicator - Only show if sender is selected */}
                      {senderEmail && (
                        <div className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                          ${senderHealth === 'healthy' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 
                            senderHealth === 'warming_up' ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                            senderHealth === 'caution' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800' :
                            'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}
                        `}>
                          {senderHealth === 'healthy' ? <CheckCircle2 className="h-4 w-4" /> :
                           senderHealth === 'warming_up' ? <Clock className="h-4 w-4" /> :
                           senderHealth === 'caution' ? <AlertTriangle className="h-4 w-4" /> :
                           <XCircle className="h-4 w-4" />}
                          <span>{senderHealthInfo.label}</span>
                          <span className="text-xs opacity-70">({getSenderHealthGrade(deliveryRate)})</span>
                        </div>
                      )}
                    </div>
                    {!senderEmail && (
                      <p className="text-xs text-muted-foreground">
                        We'll automatically choose the best sender address for you based on deliverability and reputation.
                      </p>
                    )}
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Sender health is calculated based on bounce rate, open rate, and domain age.
                      </p>
                      <Dialog open={reputationDialogOpen} onOpenChange={setReputationDialogOpen}>
                        <DialogTrigger asChild>
                          <button className="text-xs text-primary hover:underline text-left">
                            Learn about sender reputation →
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Understanding Sender Reputation</DialogTitle>
                            <DialogDescription>
                              Learn how sender reputation affects email deliverability and inbox placement
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 text-sm">
                            <div>
                              <h3 className="font-semibold mb-2">What is Sender Reputation?</h3>
                              <p className="text-muted-foreground">
                                Sender reputation is a score that email service providers (ESPs) assign to your sending domain and IP address. 
                                It determines how likely your emails are to reach the inbox versus being filtered to spam.
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">How It's Calculated</h3>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                                <li><strong>Bounce Rate:</strong> Percentage of emails that couldn't be delivered. Lower is better (target: &lt;2%)</li>
                                <li><strong>Open Rate:</strong> How many recipients open your emails. Higher engagement signals quality (target: &gt;20%)</li>
                                <li><strong>Domain Age:</strong> How long your domain has been sending emails. Older domains with good history are trusted more</li>
                                <li><strong>Spam Complaints:</strong> Number of recipients marking emails as spam. Should be minimal (&lt;0.1%)</li>
                                <li><strong>Unsubscribe Rate:</strong> Healthy unsubscribes are better than spam complaints</li>
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Health Status Levels</h3>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  <div>
                                    <div className="font-medium">Healthy</div>
                                    <div className="text-xs text-muted-foreground">Excellent reputation, optimal deliverability (95%+ delivery rate)</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  <div>
                                    <div className="font-medium">Warming Up</div>
                                    <div className="text-xs text-muted-foreground">New domain or recovering from issues (85-94% delivery rate)</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <div>
                                    <div className="font-medium">Caution</div>
                                    <div className="text-xs text-muted-foreground">Some issues detected, monitor closely (70-84% delivery rate)</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  <div>
                                    <div className="font-medium">Poor</div>
                                    <div className="text-xs text-muted-foreground">Significant issues, high spam risk (&lt;70% delivery rate)</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Best Practices</h3>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                                <li>Start with smaller volumes and gradually increase</li>
                                <li>Maintain consistent sending patterns</li>
                                <li>Keep bounce rates low by using verified email lists</li>
                                <li>Monitor engagement metrics regularly</li>
                                <li>Use SPF, DKIM, and DMARC authentication</li>
                                <li>Avoid sudden spikes in sending volume</li>
                              </ul>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
                      <span className="font-semibold">{planQuota}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selected</span>
                      <span className="font-semibold">{emailCount} ({Math.round((emailCount / planQuota) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-border/30 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${Math.min((emailCount / planQuota) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sender Health */}
                <div className="bg-card/50 rounded-xl p-5 border border-border/30">
                  <h3 className="text-base font-semibold mb-4">Sender Health</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selected</span>
                      <span className="font-mono text-xs">
                        {isPitchivoManaged 
                          ? `@${orgSlug}.pitchivo.com` 
                          : senderEmail 
                            ? senderEmail.replace('{org}', orgSlug).substring(0, 20) + '...'
                            : 'Auto-select'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Health</span>
                      <span className={`font-semibold ${senderHealthInfo.color}`}>
                        {senderHealthInfo.label} ({getSenderHealthGrade(deliveryRate)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recent delivery rate</span>
                      <span className="font-semibold">{deliveryRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last warm-up check</span>
                      <span className="font-semibold">{lastWarmup}</span>
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
    </div>
  )
}

