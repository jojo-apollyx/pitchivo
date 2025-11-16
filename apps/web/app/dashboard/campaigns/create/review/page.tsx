'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Rocket, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { getSenderHealthLabel, calculateCampaignMetrics } from '@/lib/mock-data/buyers'
import { createClient } from '@/lib/supabase/client'

interface ProductData {
  category?: string
  form?: string
  grade?: string
  manufacturer_name?: string
  cas_number?: string
  origin_country?: string
  tags?: string[]
  product_images?: string[]
  uploaded_files?: Array<{ file_id: string; name: string }>
}

export default function ReviewLaunchPage() {
  const router = useRouter()
  const { draft, prevStep, resetDraft, initializeFromStorage } = useCampaignStore()
  const [confirmed, setConfirmed] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Initialize from localStorage on client mount
    initializeFromStorage()
    setMounted(true)
  }, [initializeFromStorage])

  useEffect(() => {
    if (!mounted) return
    loadOrgId()
    if (draft.productId) {
      loadProductData()
    }
  }, [mounted, draft.productId])

  async function loadOrgId() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Select multiple columns like auth/callback/page.tsx does (which works)
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

  async function loadProductData() {
    if (!draft.productId) return
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_data')
        .eq('product_id', draft.productId)
        .single()

      if (error) throw error

      if (data?.product_data) {
        const parsed = typeof data.product_data === 'string' 
          ? JSON.parse(data.product_data) 
          : data.product_data
        setProductData(parsed)
      }
    } catch (error) {
      console.error('Error loading product data:', error)
    }
  }

  const metrics = calculateCampaignMetrics(draft.emailCount, draft.durationDays)
  const senderHealthInfo = getSenderHealthLabel(draft.senderHealth)
  const productImages = productData?.product_images || []
  const firstImage = productImages.length > 0 ? productImages[0] : null
  const getImageUrl = () => {
    if (!firstImage) return null
    if (firstImage.startsWith('http')) return firstImage
    const { data } = supabase.storage.from('product-images').getPublicUrl(firstImage)
    return data.publicUrl
  }
  const imageUrl = getImageUrl()

  async function handleLaunch() {
    if (!confirmed || !orgId || !draft.productId) return

    setLaunching(true)

    try {
      const priorityLocations = (draft as any).priorityLocations || []
      
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
          priority_locations: priorityLocations.length > 0 ? priorityLocations : null,
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
            <div className="flex-1 flex items-center justify-between">
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

          {!mounted ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading campaign details...
            </div>
          ) : (
          <div className="space-y-6">
            {/* Section 1: Product Summary */}
            <div className="pb-6 border-b border-border/30">
              <h3 className="text-lg font-semibold mb-4">Product Summary</h3>
              <div className="bg-card/50 rounded-xl p-4 flex items-start gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl}
                      alt={draft.productName || 'Product'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={`text-2xl sm:text-3xl font-bold text-primary/50 ${imageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                    {draft.productName?.charAt(0) || 'P'}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-2">{draft.productName}</h4>
                  
                  {/* Identifying Information */}
                  <div className="space-y-1.5 mb-2">
                    {/* Category */}
                    {productData?.category && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">Category:</span>
                        <span>{productData.category}</span>
                      </div>
                    )}
                    
                    {/* Form & Grade */}
                    {(productData?.form || productData?.grade) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {productData?.form && productData?.grade ? (
                          <>
                            <span className="font-medium text-foreground/70">Form:</span>
                            <span>{productData.form}</span>
                            <span className="text-foreground/40">•</span>
                            <span className="font-medium text-foreground/70">Grade:</span>
                            <span>{productData.grade}</span>
                          </>
                        ) : (
                          <>
                            {productData?.form && (
                              <>
                                <span className="font-medium text-foreground/70">Form:</span>
                                <span>{productData.form}</span>
                              </>
                            )}
                            {productData?.grade && (
                              <>
                                <span className="font-medium text-foreground/70">Grade:</span>
                                <span>{productData.grade}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Manufacturer */}
                    {productData?.manufacturer_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">Manufacturer:</span>
                        <span className="line-clamp-1">{productData.manufacturer_name}</span>
                      </div>
                    )}
                    
                    {/* CAS Number or Origin Country */}
                    {(productData?.cas_number || productData?.origin_country) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {productData?.cas_number && (
                          <span className="font-medium text-foreground/70">CAS:</span>
                        )}
                        <span>{productData?.cas_number || productData?.origin_country}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {draft.productTags && draft.productTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {draft.productTags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {draft.productTags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{draft.productTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Files Count */}
                  {draft.attachedFilesCount && draft.attachedFilesCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {draft.attachedFilesCount} {draft.attachedFilesCount === 1 ? 'file' : 'files'} attached
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Audience Summary */}
            <div className="pb-6 border-b border-border/30">
              <h3 className="text-lg font-semibold mb-4">Audience Summary</h3>
              <div className="grid grid-cols-2 gap-4">
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
                    <span className="font-mono text-xs break-all">
                      {draft.senderEmail || 'We\'ll choose the best sender address for you'}
                    </span>
                  </div>
                  {draft.senderEmail && (
                    <div>
                      <span className="text-muted-foreground">Sender health:</span>{' '}
                      <span className={`font-semibold ${senderHealthInfo.color}`}>
                        {senderHealthInfo.icon} {senderHealthInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
                  I confirm all campaign details are correct and I agree to Pitchivo Terms.
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
                  Email will start sending within next 24 hours.
                </p>
              </div>
            </div>
          </div>
          )}
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

