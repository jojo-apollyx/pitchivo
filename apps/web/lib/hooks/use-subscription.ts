/**
 * useSubscription hook
 * Provides easy access to subscription and quota data
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTierConfig, PricingTier } from '@/lib/constants/pricing'
import { getQuotaStatus, QuotaStatus } from '@/lib/utils/quotas'

interface Subscription {
  subscription_id: string
  org_id: string
  tier: PricingTier
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
  email_quota: number
  qr_links_per_product: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  custom_quota_override?: boolean
}

interface UseSubscriptionReturn {
  subscription: Subscription | null
  tier: PricingTier
  status: string
  isLoading: boolean
  error: Error | null
  quotaUsage: QuotaStatus | null
  canSendEmails: (count?: number) => boolean
  canAddQRLink: (productId?: string) => Promise<boolean>
  refetch: () => Promise<void>
  isPremium: boolean
  isEnterprise: boolean
  isFree: boolean
  isActive: boolean
}

export function useSubscription(orgId?: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [quotaUsage, setQuotaUsage] = useState<QuotaStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubscription = async () => {
    if (!orgId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .single()

      if (subError) {
        throw subError
      }

      setSubscription(subData as Subscription)

      // Fetch quota usage
      const quotaData = await getQuotaStatus(orgId)
      setQuotaUsage(quotaData)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [orgId])

  const canSendEmails = (count: number = 1): boolean => {
    if (!quotaUsage) return false
    if (quotaUsage.emailsQuota >= 999999) return true // Unlimited
    return quotaUsage.emailsRemaining >= count
  }

  const canAddQRLink = async (productId?: string): Promise<boolean> => {
    if (!quotaUsage) return false
    if (quotaUsage.qrLinksQuota >= 999999) return true // Unlimited
    
    if (productId) {
      // Check specific product link count
      const supabase = createClient()
      const { count } = await supabase
        .from('product_links')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)

      return (count || 0) < quotaUsage.qrLinksQuota
    }

    return quotaUsage.qrLinksRemaining > 0
  }

  const tier = subscription?.tier || 'free'
  const status = subscription?.status || 'inactive'

  return {
    subscription,
    tier,
    status,
    isLoading,
    error,
    quotaUsage,
    canSendEmails,
    canAddQRLink,
    refetch: fetchSubscription,
    isPremium: tier === 'premium',
    isEnterprise: tier === 'enterprise',
    isFree: tier === 'free',
    isActive: status === 'active' || status === 'trialing'
  }
}

