'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PriceTier } from './types'

interface TieredPricingSectionProps {
  priceTiers: PriceTier[]
  onChange: (tiers: PriceTier[]) => void
  errors?: Record<string, string>
}

export function TieredPricingSection({
  priceTiers,
  onChange,
  errors = {},
}: TieredPricingSectionProps) {
  const addTier = () => {
    const newTier: PriceTier = {
      id: Date.now().toString(),
      moq: 0,
      price: 0,
      leadTime: 0,
    }
    onChange([...priceTiers, newTier])
  }

  const updateTier = (id: string, updates: Partial<PriceTier>) => {
    onChange(
      priceTiers.map((tier) =>
        tier.id === id ? { ...tier, ...updates } : tier
      )
    )
  }

  const removeTier = (id: string) => {
    if (priceTiers.length > 1) {
      onChange(priceTiers.filter((tier) => tier.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Pricing Tiers *</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Set different prices based on order quantity
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTier}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tier
        </Button>
      </div>

      <div className="space-y-3">
        {priceTiers.map((tier, index) => (
          <div
            key={tier.id}
            className={cn(
              'rounded-xl border border-border/30 p-4 bg-card/50',
              'hover:border-primary/30 transition-colors'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* MOQ */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    MOQ (kg) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={tier.moq || ''}
                    onChange={(e) =>
                      updateTier(tier.id, { moq: parseInt(e.target.value) || 0 })
                    }
                    placeholder="e.g., 100"
                    className="mt-1"
                  />
                </div>

                {/* Price per kg */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Price (USD/kg) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tier.price || ''}
                    onChange={(e) =>
                      updateTier(tier.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="e.g., 15.50"
                    className="mt-1"
                  />
                </div>

                {/* Lead Time */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Lead Time (days) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={tier.leadTime || ''}
                    onChange={(e) =>
                      updateTier(tier.id, { leadTime: parseInt(e.target.value) || 0 })
                    }
                    placeholder="e.g., 10"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTier(tier.id)}
                disabled={priceTiers.length === 1}
                className={cn(
                  'flex-shrink-0 text-destructive hover:text-destructive mt-5',
                  priceTiers.length === 1 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary */}
            {tier.moq > 0 && tier.price > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Summary:</span> Orders of{' '}
                  <span className="text-foreground font-medium">{tier.moq}kg+</span> at{' '}
                  <span className="text-foreground font-medium">${tier.price}/kg</span>,{' '}
                  delivered in{' '}
                  <span className="text-foreground font-medium">{tier.leadTime} days</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {errors.priceTiers && (
        <p className="text-sm text-destructive">{errors.priceTiers}</p>
      )}

      {/* Helpful Note */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-medium">Tip:</span> Add multiple tiers to encourage larger orders.
          Example: 100kg at $20/kg, 500kg at $18/kg, 1000kg+ at $15/kg
        </p>
      </div>
    </div>
  )
}

