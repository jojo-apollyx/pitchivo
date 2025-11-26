/**
 * UpgradePrompt Component
 * Modal/banner to prompt users to upgrade their subscription
 */

'use client'

import { useState } from 'react'
import { PricingTier, getTierConfig, formatPrice } from '@/lib/constants/pricing'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Badge } from './badge'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface UpgradePromptProps {
  feature: string
  currentTier: PricingTier
  recommendedTier?: PricingTier
  open?: boolean
  onClose?: () => void
  onUpgrade?: () => void
  inline?: boolean
  showComparison?: boolean
}

export function UpgradePrompt({
  feature,
  currentTier,
  recommendedTier = 'premium',
  open = false,
  onClose,
  onUpgrade,
  inline = false,
  showComparison = true
}: UpgradePromptProps) {
  const currentConfig = getTierConfig(currentTier)
  const recommendedConfig = getTierConfig(recommendedTier)

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    }
  }

  // Inline banner version
  if (inline) {
    return (
      <div className="bg-accent-surface border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-6 w-6 text-primary-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Upgrade to unlock {feature}
            </h3>
            <div className="text-sm text-muted-foreground mb-3">
              You're currently on the <Badge variant="outline">{currentConfig.name}</Badge> plan.
              Upgrade to <Badge variant="default">{recommendedConfig.name}</Badge> to access this feature.
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/pricing">
                <Button size="sm">
                  View Pricing <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">
                Starting at {formatPrice(recommendedConfig.price)}/month
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modal version
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary-dark" />
            <DialogTitle>Upgrade Your Plan</DialogTitle>
          </div>
          <DialogDescription>
            Unlock <span className="font-semibold text-foreground">{feature}</span> by upgrading to the {recommendedConfig.name} plan.
          </DialogDescription>
        </DialogHeader>

        {showComparison && (
          <div className="grid grid-cols-2 gap-4 my-6">
            {/* Current Plan */}
            <div className="border border-border/50 rounded-lg p-4 bg-background-secondary">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{currentConfig.name}</h3>
                <Badge variant="outline">Current</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground mb-4">
                {formatPrice(currentConfig.price)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{currentConfig.features.emailQuota} emails/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{currentConfig.features.qrLinksPerProduct} QR links/product</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              </ul>
            </div>

            {/* Recommended Plan */}
            <div className="border-2 border-primary-dark rounded-lg p-4 bg-accent-surface relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary-dark">Recommended</Badge>
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <h3 className="font-semibold text-foreground">{recommendedConfig.name}</h3>
              </div>
              <div className="text-2xl font-bold text-foreground mb-4">
                {formatPrice(recommendedConfig.price)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{recommendedConfig.features.emailQuota.toLocaleString()} emails/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">
                    {recommendedConfig.features.qrLinksPerProduct >= 999999 
                      ? 'Unlimited' 
                      : recommendedConfig.features.qrLinksPerProduct} QR links
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-primary-dark">{feature}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Link href="/dashboard/pricing" className="w-full sm:w-auto">
            <Button className="w-full" onClick={handleUpgrade}>
              View Pricing Plans <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
