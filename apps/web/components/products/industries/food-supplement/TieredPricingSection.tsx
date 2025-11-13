'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type PriceLeadTimeTier = {
  moq?: string
  price?: string
  lead_time?: string
}

interface TieredPricingSectionProps {
  priceTiers: PriceLeadTimeTier[]
  onChange: (tiers: PriceLeadTimeTier[]) => void
  errors?: Record<string, string>
}

export function TieredPricingSection({
  priceTiers,
  onChange,
  errors = {},
}: TieredPricingSectionProps) {
  // Ensure priceTiers is always an array
  const safePriceTiers = priceTiers || []
  
  // Ensure at least one tier exists
  const tiers = safePriceTiers.length > 0 ? safePriceTiers : [{ moq: '', price: '', lead_time: '' }]
  
  const addTier = () => {
    const newTier: PriceLeadTimeTier = {
      moq: '',
      price: '',
      lead_time: '',
    }
    onChange([...tiers, newTier])
  }

  const updateTier = (index: number, updates: Partial<PriceLeadTimeTier>) => {
    onChange(
      tiers.map((tier, i) =>
        i === index ? { ...tier, ...updates } : tier
      )
    )
  }

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      onChange(tiers.filter((_, i) => i !== index))
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
        {tiers.map((tier, index) => (
          <div
            key={index}
            className={cn(
              'rounded-xl border border-border/30 p-4 bg-card/50',
              'hover:border-primary/30 transition-colors'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                {/* MOQ */}
                <div className="flex flex-col min-w-0">
                  <Label className="text-xs text-muted-foreground mb-1 whitespace-nowrap">
                    MOQ (kg) *
                  </Label>
                  <Input
                    type="text"
                    value={tier.moq || ''}
                    onChange={(e) =>
                      updateTier(index, { moq: e.target.value })
                    }
                    placeholder="e.g., 100"
                  />
                </div>

                {/* Price per kg */}
                <div className="flex flex-col min-w-0">
                  <Label className="text-xs text-muted-foreground mb-1 whitespace-nowrap">
                    Price (USD/kg) *
                  </Label>
                  <Input
                    type="text"
                    value={tier.price || ''}
                    onChange={(e) =>
                      updateTier(index, { price: e.target.value })
                    }
                    placeholder="e.g., 15.50"
                  />
                </div>

                {/* Lead Time */}
                <div className="flex flex-col min-w-0">
                  <Label className="text-xs text-muted-foreground mb-1 whitespace-nowrap">
                    Lead Time (days) *
                  </Label>
                  <Input
                    type="text"
                    value={tier.lead_time || ''}
                    onChange={(e) =>
                      updateTier(index, { lead_time: e.target.value })
                    }
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTier(index)}
                disabled={tiers.length === 1}
                className={cn(
                  'flex-shrink-0 text-destructive hover:text-destructive mt-5',
                  tiers.length === 1 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary */}
            {tier.moq && tier.price && parseFloat(tier.moq) > 0 && parseFloat(tier.price) > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Summary:</span> Orders of{' '}
                  <span className="text-foreground font-medium">{tier.moq}kg+</span> at{' '}
                  <span className="text-foreground font-medium">${tier.price}/kg</span>
                  {tier.lead_time && (
                    <>, delivered in{' '}
                    <span className="text-foreground font-medium">{tier.lead_time} days</span></>
                  )}
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

