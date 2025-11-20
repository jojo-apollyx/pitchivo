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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Upgrade to unlock {feature}
            </h3>
            <div className="text-sm text-gray-600 mb-3">
              You're currently on the <Badge variant="outline">{currentConfig.name}</Badge> plan.
              Upgrade to <Badge variant="default" className="bg-blue-600">{recommendedConfig.name}</Badge> to access this feature.
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/pricing">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  View Pricing <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
              <span className="text-xs text-gray-500">
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
            <Sparkles className="h-6 w-6 text-blue-600" />
            <DialogTitle>Upgrade Your Plan</DialogTitle>
          </div>
          <DialogDescription>
            Unlock <span className="font-semibold text-gray-900">{feature}</span> by upgrading to the {recommendedConfig.name} plan.
          </DialogDescription>
        </DialogHeader>

        {showComparison && (
          <div className="grid grid-cols-2 gap-4 my-6">
            {/* Current Plan */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{currentConfig.name}</h3>
                <Badge variant="outline">Current</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-4">
                {formatPrice(currentConfig.price)}
                <span className="text-sm font-normal text-gray-500">/month</span>
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
                  <span className="text-gray-400">{feature}</span>
                </li>
              </ul>
            </div>

            {/* Recommended Plan */}
            <div className="border-2 border-blue-600 rounded-lg p-4 bg-blue-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600">Recommended</Badge>
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <h3 className="font-semibold text-gray-900">{recommendedConfig.name}</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-4">
                {formatPrice(recommendedConfig.price)}
                <span className="text-sm font-normal text-gray-500">/month</span>
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
                  <span className="font-medium text-blue-700">{feature}</span>
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
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleUpgrade}>
              View Pricing Plans <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

