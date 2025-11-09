'use client'

import { useState } from 'react'
import { Check, ChevronDown, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/theme'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ColorSchemePickerProps {
  value?: ColorScheme
  onChange: (scheme: ColorScheme) => void
  className?: string
}

export function ColorSchemePicker({ value, onChange, className }: ColorSchemePickerProps) {
  const currentScheme = value || COLOR_SCHEMES[0]

  // Group schemes by category
  const schemesByCategory = COLOR_SCHEMES.reduce((acc, scheme) => {
    if (!acc[scheme.category]) {
      acc[scheme.category] = []
    }
    acc[scheme.category].push(scheme)
    return acc
  }, {} as Record<string, ColorScheme[]>)

  const categoryOrder: Array<ColorScheme['category']> = [
    'Vibrant',
    'Tranquil',
    'Playful',
    'Neutral',
    'Romantic'
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Compact Dropdown Selector */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Select Color Scheme
        </label>
        <Select
          value={currentScheme.name}
          onValueChange={(name) => {
            const scheme = COLOR_SCHEMES.find(s => s.name === name)
            if (scheme) onChange(scheme)
          }}
        >
          <SelectTrigger className="w-full min-h-[44px] touch-manipulation">
            <SelectValue>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div 
                    className="h-4 w-4 rounded" 
                    style={{ backgroundColor: currentScheme.primary }}
                  />
                  <div 
                    className="h-4 w-4 rounded" 
                    style={{ backgroundColor: currentScheme.secondary }}
                  />
                  <div 
                    className="h-4 w-4 rounded" 
                    style={{ backgroundColor: currentScheme.accent }}
                  />
                </div>
                <span className="font-medium">{currentScheme.name}</span>
                <span className="text-xs text-muted-foreground">({currentScheme.category})</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categoryOrder.map((category) => (
              <div key={category}>
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                  {category}
                </div>
                {schemesByCategory[category]?.map((scheme) => (
                  <SelectItem 
                    key={scheme.name} 
                    value={scheme.name}
                    className="min-h-[44px] py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex gap-1">
                        <div 
                          className="h-4 w-4 rounded" 
                          style={{ backgroundColor: scheme.primary }}
                        />
                        <div 
                          className="h-4 w-4 rounded" 
                          style={{ backgroundColor: scheme.secondary }}
                        />
                        <div 
                          className="h-4 w-4 rounded" 
                          style={{ backgroundColor: scheme.accent }}
                        />
                      </div>
                      <span>{scheme.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {currentScheme.description}
        </p>
      </div>

      {/* Compact Preview Card */}
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-3">Preview</p>
          
          {/* Button Previews - Compact */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div 
              className="h-9 rounded-lg flex items-center justify-center text-xs font-semibold"
              style={{ 
                backgroundColor: currentScheme.primary,
                color: getContrastColor(currentScheme.primary)
              }}
            >
              Primary
            </div>
            <div 
              className="h-9 rounded-lg flex items-center justify-center text-xs font-semibold"
              style={{ 
                backgroundColor: currentScheme.secondary,
                color: getContrastColor(currentScheme.secondary)
              }}
            >
              Secondary
            </div>
            <div 
              className="h-9 rounded-lg flex items-center justify-center text-xs font-semibold"
              style={{ 
                backgroundColor: currentScheme.accent,
                color: getContrastColor(currentScheme.accent)
              }}
            >
              Accent
            </div>
          </div>

          {/* Color Values - Compact */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/30">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground mb-1">Primary</div>
              <code className="text-[10px] font-mono bg-background/80 px-1 py-0.5 rounded">{currentScheme.primary}</code>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground mb-1">Secondary</div>
              <code className="text-[10px] font-mono bg-background/80 px-1 py-0.5 rounded">{currentScheme.secondary}</code>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground mb-1">Accent</div>
              <code className="text-[10px] font-mono bg-background/80 px-1 py-0.5 rounded">{currentScheme.accent}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Theory Info - Compact */}
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs font-medium mb-1">About {currentScheme.category} Schemes:</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {getCategoryDescription(currentScheme.category)}
        </p>
      </div>
    </div>
  )
}

// Helper function to determine if text should be dark or light
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// Helper function to get category description
function getCategoryDescription(category: ColorScheme['category']): string {
  const descriptions = {
    'Vibrant': 'Bold, confident color combinations with complementary accents. Perfect for brands that want to stand out and convey energy.',
    'Tranquil': 'Calm, peaceful palettes with soft complementary accents. Ideal for wellness, healthcare, and meditation apps.',
    'Playful': 'Friendly, approachable colors with energetic accents. Great for consumer apps, food brands, and creative services.',
    'Neutral': 'Sophisticated, timeless grays with warm accents. Professional and elegant for corporate and B2B platforms.',
    'Romantic': 'Soft, gentle pastels with delicate accents. Perfect for beauty, fashion, and lifestyle brands.',
  }
  return descriptions[category] || ''
}
