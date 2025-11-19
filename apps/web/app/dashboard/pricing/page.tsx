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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Building2, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
    if (tier === 'free') {
      toast.error('You are already on the free plan')
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

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      toast.error('Failed to start checkout. Please try again.')
      setProcessingTier(null)
    }
  }

  const getTierIcon = (tier: PricingTier) => {
    switch (tier) {
      case 'free':
        return <Sparkles className="h-5 w-5" />
      case 'basic':
        return <Zap className="h-5 w-5" />
      case 'premium':
        return <Sparkles className="h-5 w-5" />
      case 'enterprise':
        return <Building2 className="h-5 w-5" />
    }
  }

  const isCurrentTier = (tier: PricingTier) => tier === currentTier

  if (isLoadingOrg || isLoadingSub) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div id="pricing-header-section" className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Object.entries(PRICING_TIERS).map(([key, config]) => {
          const tierKey = key as PricingTier
          const isCurrent = isCurrentTier(tierKey)
          const isProcessing = processingTier === tierKey

          return (
            <Card 
              key={tierKey} 
              className={`relative ${config.popular ? 'border-blue-600 border-2 shadow-lg' : ''} ${isCurrent ? 'bg-blue-50' : ''}`}
            >
              {config.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${config.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {getTierIcon(tierKey)}
                  </div>
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                </div>
                <CardDescription className="min-h-[40px]">
                  {config.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Price */}
                <div className="mb-6">
                  {config.price === null ? (
                    <div className="text-3xl font-bold">Custom</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold">
                        {formatPrice(config.price)}
                      </div>
                      <div className="text-sm text-gray-500">per month</div>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{config.features.productListing} product listings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      <strong>{config.features.emailQuota >= 999999 ? 'Unlimited' : config.features.emailQuota.toLocaleString()}</strong> emails per month
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      <strong>{config.features.qrLinksPerProduct >= 999999 ? 'Unlimited' : config.features.qrLinksPerProduct}</strong> QR/custom links per product
                    </span>
                  </li>
                  {config.features.apiAccess && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Custom API access</span>
                    </li>
                  )}
                  {config.features.datasetIntegration && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Dataset integration</span>
                    </li>
                  )}
                  {config.features.sla && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">SLA support</span>
                    </li>
                  )}
                  {!config.features.aiExposed && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Not exposed to AI</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
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
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div id="pricing-feature-comparison-section" className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
          Compare Features
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Free</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Basic</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Premium</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((feature, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3 px-4 text-sm text-gray-900">{feature.name}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-600">{feature.free}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-600">{feature.basic}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-600">{feature.premium}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-600">{feature.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="pricing-faq-section" className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <details className="bg-white rounded-lg border p-4">
            <summary className="font-semibold cursor-pointer">Can I change my plan later?</summary>
            <p className="mt-2 text-sm text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.
            </p>
          </details>
          <details className="bg-white rounded-lg border p-4">
            <summary className="font-semibold cursor-pointer">What happens if I exceed my quota?</summary>
            <p className="mt-2 text-sm text-gray-600">
              You'll be notified when you're close to your quota limit. If you exceed it, you'll need to upgrade to continue sending emails or adding QR links.
            </p>
          </details>
          <details className="bg-white rounded-lg border p-4">
            <summary className="font-semibold cursor-pointer">Do you offer refunds?</summary>
            <p className="mt-2 text-sm text-gray-600">
              Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
            </p>
          </details>
        </div>
      </div>
    </main>
  )
}

