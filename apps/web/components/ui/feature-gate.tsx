/**
 * FeatureGate Component
 * Conditionally render content based on subscription tier/features
 */

'use client'

import { ReactNode } from 'react'
import { PricingTier, hasFeature } from '@/lib/constants/pricing'
import { useSubscription } from '@/lib/hooks/use-subscription'

interface FeatureGateProps {
  children: ReactNode
  feature: string
  requiredTier?: PricingTier
  fallback?: ReactNode
  orgId?: string
  checkFunction?: (tier: PricingTier) => boolean
}

export function FeatureGate({
  children,
  feature,
  requiredTier,
  fallback,
  orgId,
  checkFunction
}: FeatureGateProps) {
  const { tier, isLoading } = useSubscription(orgId)

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 rounded h-20" />
  }

  let hasAccess = false

  // Custom check function
  if (checkFunction) {
    hasAccess = checkFunction(tier)
  }
  // Required tier check
  else if (requiredTier) {
    const tierPriority: Record<PricingTier, number> = {
      free: 0,
      basic: 1,
      premium: 2,
      enterprise: 3
    }
    hasAccess = tierPriority[tier] >= tierPriority[requiredTier]
  }
  // Default: always show (no restriction)
  else {
    hasAccess = true
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback || null}</>
}

