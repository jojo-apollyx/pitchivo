'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, ArrowUpRight, Mail, Link as LinkIcon, Loader2, Package, BarChart3, Receipt, Download, ExternalLink, MapPin, Phone } from 'lucide-react'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { PRICING_TIERS, formatPrice, formatQuota } from '@/lib/constants/pricing'
import { QuotaBar } from '@/components/ui/quota-bar'
import Link from 'next/link'
import { DopamineLoading, DopamineLoadingInline } from '@/components/ui/dopamine-loading'

interface Invoice {
  id: string
  number: string | null
  amount: number
  currency: string
  status: string
  created: number
  dueDate: number | null
  periodStart: number | null
  periodEnd: number | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  description: string | null
}

interface PaymentMethod {
  id: string
  type: string
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  } | null
  isDefault: boolean
}

interface BillingData {
  customer: {
    id: string
    email: string | null
    name: string | null
    phone: string | null
    address: {
      line1: string | null
      line2: string | null
      city: string | null
      state: string | null
      postalCode: string | null
      country: string | null
    } | null
  } | null
  paymentMethods: PaymentMethod[]
  defaultPaymentMethod: PaymentMethod | null
}

export default function BillingPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [isLoadingBilling, setIsLoadingBilling] = useState(false)

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

  // Fetch invoices when orgId is available
  useEffect(() => {
    if (!orgId || !subscription?.stripe_customer_id) return

    async function fetchInvoices() {
      setIsLoadingInvoices(true)
      try {
        const response = await fetch('/api/stripe/invoices')
        if (response.ok) {
          const data = await response.json()
          setInvoices(data.invoices || [])
        }
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [orgId, subscription?.stripe_customer_id])

  // Fetch billing data when orgId is available
  useEffect(() => {
    if (!orgId || !subscription?.stripe_customer_id) return

    async function fetchBillingData() {
      setIsLoadingBilling(true)
      try {
        const response = await fetch('/api/stripe/billing')
        if (response.ok) {
          const data = await response.json()
          setBillingData(data)
        }
      } catch (error) {
        console.error('Error fetching billing data:', error)
      } finally {
        setIsLoadingBilling(false)
      }
    }

    fetchBillingData()
  }, [orgId, subscription?.stripe_customer_id])

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

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>
      case 'open':
        return <Badge variant="secondary">Open</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'void':
        return <Badge variant="outline" className="border-destructive/50 text-destructive">Void</Badge>
      case 'uncollectible':
        return <Badge variant="destructive">Uncollectible</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1)
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
      <main className="min-h-screen bg-background">
        <DopamineLoading variant="dashboard" message="Loading billing info..." />
      </main>
    )
  }

  return (
    <main className="h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* Page Header */}
        <section id="billing-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight text-foreground">Billing & Subscription</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
              Manage your subscription plan and billing information
            </p>
          </div>
        </section>

        {/* Tabs Content */}
        <section id="billing-tabs-section" className="px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="plan" className="flex flex-col h-full min-h-0 w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 flex-shrink-0">
                <TabsTrigger value="plan" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Plan</span>
                </TabsTrigger>
                <TabsTrigger value="usage" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Usage</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Invoices</span>
                </TabsTrigger>
              </TabsList>

            {/* Plan Tab */}
            <TabsContent value="plan" className="flex-1 overflow-y-auto min-h-0 mt-0">
              <div className="space-y-6 pb-6">
                <section id="billing-current-plan-section" className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
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
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="flex-1 overflow-y-auto min-h-0 mt-0">
              <div className="space-y-6 pb-6">
                {quotaUsage ? (
                  <section id="billing-usage-statistics-section" className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
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
                ) : (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">No usage data available</p>
                  </section>
                )}
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="flex-1 overflow-y-auto min-h-0 mt-0">
              <div className="space-y-6 pb-6">
                {isLoadingBilling ? (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center">
                    <DopamineLoadingInline message="Loading billing details..." />
                  </section>
                ) : !subscription?.stripe_customer_id ? (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-colors duration-200">
                    <div className="text-center">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-accent-surface flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
                        <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary-dark" />
                      </div>
                      <p className="text-sm text-muted-foreground font-normal">
                        No billing information on file
                      </p>
                    </div>
                  </section>
                ) : billingData ? (
                  <div className="space-y-6">
                    {/* Payment Methods */}
                    {billingData.paymentMethods.length > 0 && (
                      <section className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
                        <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-4">Payment Methods</h2>
                        <div className="space-y-3">
                          {billingData.paymentMethods.map((pm) => (
                            <Card key={pm.id} className={pm.isDefault ? 'border-primary/50' : ''}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
                                      <CreditCard className="h-5 w-5 text-primary-dark" />
                                    </div>
                                    <div>
                                      {pm.card && (
                                        <>
                                          <p className="text-sm font-medium">
                                            {formatCardBrand(pm.card.brand)} •••• {pm.card.last4}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Expires {pm.card.expMonth}/{pm.card.expYear}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {pm.isDefault && (
                                    <Badge variant="default" className="text-xs">Default</Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleManageBilling}
                          disabled={isLoadingPortal}
                          className="mt-4 gap-2"
                        >
                          {isLoadingPortal ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Manage Payment Methods
                            </>
                          )}
                        </Button>
                      </section>
                    )}

                    {/* Billing Address */}
                    {billingData.customer?.address && (
                      <section className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
                        <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-4">Billing Address</h2>
                        <div className="space-y-2 text-sm">
                          {billingData.customer.name && (
                            <p className="font-medium">{billingData.customer.name}</p>
                          )}
                          {billingData.customer.address.line1 && (
                            <p>{billingData.customer.address.line1}</p>
                          )}
                          {billingData.customer.address.line2 && (
                            <p>{billingData.customer.address.line2}</p>
                          )}
                          <p>
                            {[
                              billingData.customer.address.city,
                              billingData.customer.address.state,
                              billingData.customer.address.postalCode,
                            ].filter(Boolean).join(', ')}
                          </p>
                          {billingData.customer.address.country && (
                            <p>{billingData.customer.address.country}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleManageBilling}
                          disabled={isLoadingPortal}
                          className="mt-4 gap-2"
                        >
                          {isLoadingPortal ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              Update Address
                            </>
                          )}
                        </Button>
                      </section>
                    )}

                    {/* Customer Info */}
                    {billingData.customer && (
                      <section className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
                        <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-4">Customer Information</h2>
                        <div className="space-y-2 text-sm">
                          {billingData.customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{billingData.customer.email}</span>
                            </div>
                          )}
                          {billingData.customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{billingData.customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">No billing information available</p>
                  </section>
                )}
              </div>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="flex-1 overflow-y-auto min-h-0 mt-0">
              <div className="space-y-6 pb-6">
                {isLoadingInvoices ? (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center">
                    <DopamineLoadingInline message="Loading invoices..." />
                  </section>
                ) : !subscription?.stripe_customer_id ? (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-colors duration-200">
                    <div className="text-center">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-accent-surface flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
                        <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-primary-dark" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center font-normal">
                        No invoices yet
                      </p>
                    </div>
                  </section>
                ) : invoices.length === 0 ? (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-colors duration-200">
                    <div className="text-center">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-accent-surface flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
                        <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-primary-dark" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center font-normal mb-4">
                        No invoices found
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={handleManageBilling}
                        disabled={isLoadingPortal}
                        className="gap-2"
                      >
                        {isLoadingPortal ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            View in Stripe Portal
                          </>
                        )}
                      </Button>
                    </div>
                  </section>
                ) : (
                  <section className="bg-background-secondary rounded-lg p-6 sm:p-8 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground">Invoice History</h2>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleManageBilling}
                        disabled={isLoadingPortal}
                        className="gap-2"
                      >
                        {isLoadingPortal ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Manage in Stripe
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {invoices.map((invoice) => (
                        <Card key={invoice.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center flex-shrink-0">
                                    <Receipt className="h-5 w-5 text-primary-dark" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {invoice.number || invoice.id}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {invoice.description || 'Subscription'}
                                    </p>
                                    {invoice.periodStart && invoice.periodEnd && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(invoice.periodStart * 1000).toLocaleDateString()} - {new Date(invoice.periodEnd * 1000).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-right">
                                  <p className="text-sm font-semibold">
                                    {invoice.currency.toUpperCase()} {formatPrice(invoice.amount / 100)}
                                  </p>
                                  <div className="mt-1">
                                    {getInvoiceStatusBadge(invoice.status)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {invoice.invoicePdf && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(invoice.invoicePdf!, '_blank')}
                                      className="h-8 w-8"
                                      title="Download PDF"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {invoice.hostedInvoiceUrl && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(invoice.hostedInvoiceUrl!, '_blank')}
                                      className="h-8 w-8"
                                      title="View invoice"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  )
}

