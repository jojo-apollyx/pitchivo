'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, ArrowUpRight, Mail, Link as LinkIcon, Loader2 } from 'lucide-react'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { PRICING_TIERS, formatPrice, formatQuota } from '@/lib/constants/pricing'
import { QuotaBar } from '@/components/ui/quota-bar'
import Link from 'next/link'

export default function BillingPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)

  const { subscription, tier, status, quotaUsage, isLoading: isLoadingSub } = useSubscription(orgId || undefined)

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

  const tierConfig = tier ? PRICING_TIERS[tier] : null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>
      case 'past_due':
        return <Badge variant="outline" className="border-destructive/50 text-destructive">Past Due</Badge>
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>
      default:
        return <Badge variant="outline">Inactive</Badge>
    }
  }

  const handleManageBilling = async () => {
    setIsLoadingPortal(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
    } finally {
      setIsLoadingPortal(false)
    }
  }

  if (isLoadingOrg || isLoadingSub) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary-dark" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Page Header */}
        <section id="billing-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight text-foreground">Billing & Subscription</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
              Manage your subscription plan and billing information
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 max-w-4xl">
          {/* Current Plan */}
          <section id="billing-current-plan-section" className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200 hover:bg-muted hover:shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground">Current Plan</h2>
              {getStatusBadge(status)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {tierConfig?.name || 'Free'} Plan
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-normal">
                  {tierConfig?.description || 'Free tier'}
                </p>
                {tierConfig && tierConfig.price !== null && (
                  <p className="text-lg font-semibold text-foreground mt-2">
                    {formatPrice(tierConfig.price)}/month
                  </p>
                )}
                {subscription?.current_period_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscription.cancel_at_period_end 
                      ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    }
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard/pricing">
                  <Button id="billing-change-plan-button" aria-label="Change subscription plan" className="gap-2 w-full">
                    {tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                {subscription?.stripe_customer_id && (
                  <Button 
                    id="billing-manage-billing-button"
                    aria-label="Manage billing through Stripe"
                    variant="outline" 
                    onClick={handleManageBilling}
                    disabled={isLoadingPortal}
                    className="gap-2 w-full"
                  >
                    {isLoadingPortal ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Usage Statistics */}
          {quotaUsage && (
            <section id="billing-usage-statistics-section" className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200 hover:bg-muted hover:shadow-soft">
              <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-6">Usage Statistics</h2>
              <div className="space-y-6">
                <QuotaBar
                  used={quotaUsage.emailsUsed}
                  total={quotaUsage.emailsQuota}
                  label="Email Quota"
                  type="emails"
                  showPercentage
                />
                <QuotaBar
                  used={quotaUsage.qrLinksUsed}
                  total={quotaUsage.qrLinksQuota}
                  label="QR / Custom Links"
                  type="links"
                  showPercentage
                />
              </div>

              {/* Usage Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary-dark" />
                      Emails Sent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {quotaUsage.emailsUsed.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      of {formatQuota(quotaUsage.emailsQuota)} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary-dark" />
                      QR Links Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {quotaUsage.qrLinksUsed.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      of {formatQuota(quotaUsage.qrLinksQuota)} total
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* Billing Information */}
          <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-colors duration-200 hover:bg-muted hover:shadow-soft">
            <div className="text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-accent-surface flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary-dark" />
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                {subscription?.stripe_customer_id 
                  ? 'Billing managed through Stripe'
                  : 'No billing information on file'
                }
              </p>
              {subscription?.stripe_customer_id && (
                <Button 
                  variant="link" 
                  onClick={handleManageBilling}
                  disabled={isLoadingPortal}
                  className="mt-2"
                >
                  View billing details
                </Button>
              )}
            </div>
          </section>

          {/* Invoice History */}
          <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-colors duration-200 hover:bg-muted hover:shadow-soft">
            <p className="text-sm text-muted-foreground text-center font-normal">
              {subscription?.stripe_customer_id 
                ? 'Invoice history available in Stripe billing portal'
                : 'No invoices yet'
              }
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

