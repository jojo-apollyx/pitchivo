/**
 * Pricing Page
 * Displays pricing tiers and allows users to upgrade
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRICING_TIERS, FEATURE_COMPARISON, formatPrice, PricingTier } from '@/lib/constants/pricing'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatQuota } from '@/lib/constants/pricing'

export default function PricingPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)
  const [processingTier, setProcessingTier] = useState<PricingTier | null>(null)

  const { subscription, tier: currentTier, isLoading: isLoadingSub } = useSubscription(orgId || undefined)

  // Get organization ID
  useEffect(() => {
    async function getOrgId() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/callback')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profile?.organization_id) {
        setOrgId(profile.organization_id)
      }
      setIsLoadingOrg(false)
    }

    getOrgId()
  }, [router])

  const handleUpgrade = async (tier: PricingTier) => {
    // If selecting free tier and already on free, show error
    if (tier === 'free' && currentTier === 'free') {
      toast.error('You are already on the free plan')
      return
    }

    // If selecting free tier from a paid plan, cancel the subscription
    if (tier === 'free' && currentTier !== 'free') {
      setProcessingTier(tier)
      try {
        const response = await fetch('/api/stripe/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to cancel subscription')
        }

        toast.success('Subscription will be canceled at the end of the billing period')
        window.location.reload()
      } catch (error) {
        console.error('Error canceling subscription:', error)
        toast.error('Failed to cancel subscription. Please try again.')
        setProcessingTier(null)
      }
      return
    }

    if (tier === 'enterprise') {
      // Redirect to contact page
      router.push('/contact')
      return
    }

    setProcessingTier(tier)

    try {
      // Call Stripe checkout API
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          orgId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process subscription change')
      }

      if (data.url) {
        // New subscription - redirect to Stripe checkout
        window.location.href = data.url
      } else if (data.success) {
        // Existing subscription updated - show success and refresh
        toast.success('Subscription updated successfully!')
        // Refresh the page to show updated subscription
        window.location.reload()
      } else {
        throw new Error(data.error || 'Unexpected response format')
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      toast.error('Failed to start checkout. Please try again.')
      setProcessingTier(null)
    }
  }

  const isCurrentTier = (tier: PricingTier) => tier === currentTier

  if (isLoadingOrg || isLoadingSub) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
      {/* Header */}
      <div id="pricing-header-section" className="text-center mb-12">
        <Badge variant="premium" className="mb-4">
          Pricing
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start with a free plan and upgrade as you grow. All plans include unlimited product listings.
        </p>
        {currentTier && (
          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              Current Plan: {PRICING_TIERS[currentTier].name}
            </Badge>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 max-w-6xl mx-auto">
        {Object.entries(PRICING_TIERS).map(([key, config]) => {
          const tierKey = key as PricingTier
          const isCurrent = isCurrentTier(tierKey)
          const isProcessing = processingTier === tierKey

          // Build features list similar to landing page
          const features = [
            `${config.features.productListing} product listings`,
            `${formatQuota(config.features.emailQuota)} emails/month`,
            `${formatQuota(config.features.qrLinksPerProduct)} QR/custom links per product`,
            config.features.browseable ? "Browseable directory" : "Private listings",
          ]
          
          if (!config.features.aiExposed) {
            features.push("Not exposed to AI")
          }
          if (config.features.apiAccess) {
            features.push("Custom API access")
          }
          if (config.features.datasetIntegration) {
            features.push("Dataset integration")
          }
          if (config.features.sla) {
            features.push("SLA support")
          }

          return (
            <Card 
              key={tierKey}
              variant={config.popular ? "premium" : "default"}
              className={cn(
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] flex flex-col relative",
                config.popular && "border-primary/50 ring-2 ring-primary/20",
                isCurrent && "ring-2 ring-primary/30"
              )}
            >
              {config.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-8">
                <CardTitle className="text-xl mb-2">{config.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  {config.price === null ? (
                    <span className="text-4xl font-bold text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-foreground">{formatPrice(config.price)}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {config.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 flex-1 mb-6">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full h-11 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
                  variant={config.popular ? 'default' : 'outline'}
                  onClick={() => handleUpgrade(tierKey)}
                  disabled={isCurrent || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      {config.cta}
                      {tierKey !== 'enterprise' && <ArrowRight className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card id="pricing-feature-comparison-section" className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl font-display font-bold text-foreground">Compare Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Free</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Basic</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Premium</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((feature, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 text-sm text-foreground">{feature.name}</td>
                    <td className="py-3 px-4 text-sm text-center text-muted-foreground">{feature.free}</td>
                    <td className="py-3 px-4 text-sm text-center text-muted-foreground">{feature.basic}</td>
                    <td className="py-3 px-4 text-sm text-center text-muted-foreground">{feature.premium}</td>
                    <td className="py-3 px-4 text-sm text-center text-muted-foreground">{feature.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div id="pricing-faq-section" className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <details className="group">
                <summary className="font-semibold cursor-pointer text-foreground list-none">
                  <span className="group-open:hidden">Can I change my plan later?</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.
                </p>
              </details>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <details className="group">
                <summary className="font-semibold cursor-pointer text-foreground list-none">
                  <span className="group-open:hidden">What happens if I exceed my quota?</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  You'll be notified when you're close to your quota limit. If you exceed it, you'll need to upgrade to continue sending emails or adding QR links.
                </p>
              </details>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <details className="group">
                <summary className="font-semibold cursor-pointer text-foreground list-none">
                  <span className="group-open:hidden">Do you offer refunds?</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
                </p>
              </details>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

