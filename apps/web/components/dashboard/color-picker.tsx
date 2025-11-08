'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Popular color palettes for B2B SaaS
// Based on popular design systems and color psychology
const colorPalettes = [
  {
    name: 'Mint Green',
    value: '#ADEBB3',
    description: 'Fresh, natural, calming',
    category: 'Green',
  },
  {
    name: 'Ocean Blue',
    value: '#4A90E2',
    description: 'Trust, professionalism, stability',
    category: 'Blue',
  },
  {
    name: 'Royal Purple',
    value: '#9B59B6',
    description: 'Creativity, luxury, innovation',
    category: 'Purple',
  },
  {
    name: 'Coral Pink',
    value: '#FF6B9D',
    description: 'Warmth, energy, approachable',
    category: 'Pink',
  },
  {
    name: 'Sunset Orange',
    value: '#FF8C42',
    description: 'Enthusiasm, creativity, warmth',
    category: 'Orange',
  },
  {
    name: 'Forest Green',
    value: '#27AE60',
    description: 'Growth, sustainability, reliability',
    category: 'Green',
  },
  {
    name: 'Sky Blue',
    value: '#5DADE2',
    description: 'Openness, clarity, communication',
    category: 'Blue',
  },
  {
    name: 'Amethyst',
    value: '#8E44AD',
    description: 'Wisdom, spirituality, creativity',
    category: 'Purple',
  },
  {
    name: 'Rose',
    value: '#E74C3C',
    description: 'Passion, urgency, attention',
    category: 'Red',
  },
  {
    name: 'Teal',
    value: '#1ABC9C',
    description: 'Balance, sophistication, clarity',
    category: 'Teal',
  },
  {
    name: 'Indigo',
    value: '#5B6BC0',
    description: 'Depth, intuition, professionalism',
    category: 'Blue',
  },
  {
    name: 'Emerald',
    value: '#2ECC71',
    description: 'Success, prosperity, harmony',
    category: 'Green',
  },
]

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value = '#ADEBB3', onChange, className }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value)
  const [showCustom, setShowCustom] = useState(!colorPalettes.some(p => p.value === value))

  const handlePaletteSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setShowCustom(false)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    onChange(color)
    setShowCustom(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Color Palettes */}
      <div>
        <label className="text-sm font-medium mb-3 block">Choose a Color Palette</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {colorPalettes.map((palette) => {
            const isSelected = value === palette.value && !showCustom
            return (
              <button
                key={palette.value}
                type="button"
                onClick={() => handlePaletteSelect(palette.value)}
                className={cn(
                  'relative h-12 w-full rounded-lg transition-all duration-200',
                  'hover:scale-110 active:scale-95 touch-manipulation',
                  'border-2',
                  isSelected 
                    ? 'border-foreground shadow-lg scale-110' 
                    : 'border-border hover:border-foreground/50'
                )}
                style={{ backgroundColor: palette.value }}
                title={`${palette.name} - ${palette.description}`}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-background/90 flex items-center justify-center">
                      <Check className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Hover to see color names and descriptions
        </p>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="text-sm font-medium mb-3 block">Or Choose Custom Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="h-12 w-24 rounded-lg border-2 border-border cursor-pointer touch-manipulation"
          />
          <div className="flex-1">
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const color = e.target.value
                if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                  handleCustomColorChange(color)
                } else {
                  setCustomColor(color)
                }
              }}
              placeholder="#ADEBB3"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono"
            />
          </div>
          {showCustom && (
            <div className="h-12 w-12 rounded-lg border-2 border-foreground shadow-lg flex items-center justify-center" style={{ backgroundColor: customColor }}>
              <Check className="h-5 w-5 text-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Preview</p>
          <div className="flex items-center gap-3">
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center text-sm font-semibold"
              style={{ 
                backgroundColor: value,
                color: getContrastColor(value)
              }}
            >
              Aa
            </div>
            <div className="flex-1">
              <div 
                className="h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                style={{ 
                  backgroundColor: value,
                  color: getContrastColor(value)
                }}
              >
                Button Preview
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to determine if text should be dark or light
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return dark or light text color
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

