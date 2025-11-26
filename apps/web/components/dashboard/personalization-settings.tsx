'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Save, Sparkles, Sun, Moon, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useThemeStore, THEME_PRESETS, type ThemePreset } from '@/lib/stores/theme-store'
import { useTheme } from 'next-themes'

// Minimalist SVG illustration for each theme style
function ThemeStyleIllustration({ preset, isSelected }: { preset: ThemePreset; isSelected: boolean }) {
  const { primary, secondary, accent, background } = preset.preview
  
  return (
    <div className={cn(
      "relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300",
      isSelected 
        ? "ring-2 ring-primary-dark ring-offset-2 ring-offset-background" 
        : "ring-1 ring-border/50 hover:ring-border"
    )}>
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: background }}
      />
      
      {/* Mini UI mockup */}
      <div className="absolute inset-2 flex flex-col gap-1.5">
        {/* Header bar */}
        <div 
          className="h-2 rounded-sm opacity-20"
          style={{ backgroundColor: primary }}
        />
        
        {/* Content area */}
        <div className="flex-1 flex gap-1.5">
          {/* Sidebar */}
          <div className="w-1/4 flex flex-col gap-1">
            <div 
              className="h-1.5 w-full rounded-sm opacity-30"
              style={{ backgroundColor: secondary }}
            />
            <div 
              className="h-1.5 w-3/4 rounded-sm opacity-20"
              style={{ backgroundColor: secondary }}
            />
            <div 
              className="h-1.5 w-full rounded-sm opacity-15"
              style={{ backgroundColor: secondary }}
            />
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Card 1 */}
            <div 
              className="h-6 rounded-sm"
              style={{ backgroundColor: primary, opacity: 0.15 }}
            />
            {/* Cards row */}
            <div className="flex gap-1">
              <div 
                className="flex-1 h-4 rounded-sm"
                style={{ backgroundColor: secondary, opacity: 0.2 }}
              />
              <div 
                className="flex-1 h-4 rounded-sm"
                style={{ backgroundColor: accent, opacity: 0.25 }}
              />
            </div>
            {/* Button */}
            <div 
              className="h-2 w-1/3 rounded-sm mt-auto"
              style={{ backgroundColor: primary }}
            />
          </div>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-dark flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}

// Theme appearance illustration (sun/moon)
function ThemeAppearanceIllustration({ isDark }: { isDark: boolean }) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      {isDark ? (
        // Moon with stars
        <>
          <circle cx="32" cy="32" r="16" fill="hsl(var(--primary-dark))" opacity="0.2" />
          <path
            d="M38 20C34.5 20 31.5 21.5 29.5 24C27.5 26.5 27 30 28 33C29 36 31.5 38.5 35 39.5C38.5 40.5 42 40 45 38C43 41.5 39 44 34 44C27 44 21 38 21 31C21 24 27 18 34 18C35.5 18 37 18.3 38 20Z"
            fill="hsl(var(--primary-dark))"
            opacity="0.9"
          />
          <circle cx="46" cy="18" r="1.5" fill="hsl(var(--primary-dark))" opacity="0.6" />
          <circle cx="50" cy="26" r="1" fill="hsl(var(--primary-dark))" opacity="0.4" />
          <circle cx="44" cy="12" r="1" fill="hsl(var(--primary-dark))" opacity="0.5" />
        </>
      ) : (
        // Sun with rays
        <>
          <circle cx="32" cy="32" r="20" fill="hsl(var(--primary-dark))" opacity="0.1" />
          <circle cx="32" cy="32" r="12" fill="hsl(var(--primary-dark))" opacity="0.2" />
          <circle cx="32" cy="32" r="8" fill="hsl(var(--primary-dark))" opacity="0.9" />
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={32 + 14 * Math.cos((angle * Math.PI) / 180)}
              y1={32 + 14 * Math.sin((angle * Math.PI) / 180)}
              x2={32 + 20 * Math.cos((angle * Math.PI) / 180)}
              y2={32 + 20 * Math.sin((angle * Math.PI) / 180)}
              stroke="hsl(var(--primary-dark))"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={i % 2 === 0 ? 0.6 : 0.3}
            />
          ))}
        </>
      )}
    </svg>
  )
}

interface PersonalizationSettingsProps {
  organizationId: string
  currentStyleId?: string
}

export function PersonalizationSettings({ 
  organizationId, 
  currentStyleId = 'minimalism'
}: PersonalizationSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  const { selectedStyle, setStyle, initializeFromStorage } = useThemeStore()
  const [isSaving, setIsSaving] = useState(false)
  const [originalStyleId, setOriginalStyleId] = useState(currentStyleId)

  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  const currentSelectedStyle = selectedStyle || THEME_PRESETS.find(p => p.id === currentStyleId) || THEME_PRESETS[0]

  const handleStyleSelect = (preset: ThemePreset) => {
    setStyle(preset)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (!selectedStyle) {
        toast.error('No style selected')
        return
      }

      // Save the theme style ID to the organization
      const { data, error } = await supabase.rpc('update_user_organization', {
        p_org_id: organizationId,
        p_primary_color: selectedStyle.preview.primary,
        p_secondary_color: selectedStyle.preview.secondary,
        p_accent_color: selectedStyle.preview.accent,
        p_name: null,
        p_industry: null,
        p_company_size: null,
        p_description: null,
        p_use_cases: null,
        p_logo_url: null,
        p_onboarding_completed_at: null
      })

      if (error) throw error

      if (!data) {
        throw new Error('Failed to update style. You may not have permission.')
      }

      setOriginalStyleId(selectedStyle.id)
      toast.success(`${selectedStyle.name} style applied!`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanged = selectedStyle?.id !== originalStyleId

  // Group presets by category
  const lightPresets = THEME_PRESETS.filter(p => p.category === 'Light')
  const vibrantPresets = THEME_PRESETS.filter(p => p.category === 'Vibrant')
  const darkPresets = THEME_PRESETS.filter(p => p.category === 'Dark')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-background via-background to-muted/30 p-6 border border-border/30">
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent-surface flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-dark" />
            </div>
            Personalization
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a style that reflects your brand personality
          </p>
        </div>
        {/* Decorative accent */}
        <div 
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-[0.07]"
          style={{ backgroundColor: currentSelectedStyle.preview.primary }}
        />
      </div>

      {/* Style Selection */}
      <div className="space-y-6">
        {/* Light Styles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-primary-dark" />
            <Label className="text-sm font-medium">Light & Clean</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {lightPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleStyleSelect(preset)}
                className="text-left group"
              >
                <ThemeStyleIllustration 
                  preset={preset} 
                  isSelected={currentSelectedStyle.id === preset.id} 
                />
                <div className="mt-2">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary-dark transition-colors">
                    {preset.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Vibrant Styles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary-dark" />
            <Label className="text-sm font-medium">Vibrant & Expressive</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {vibrantPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleStyleSelect(preset)}
                className="text-left group"
              >
                <ThemeStyleIllustration 
                  preset={preset} 
                  isSelected={currentSelectedStyle.id === preset.id} 
                />
                <div className="mt-2">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary-dark transition-colors">
                    {preset.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dark Styles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Moon className="h-4 w-4 text-primary-dark" />
            <Label className="text-sm font-medium">Dark & Sleek</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {darkPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleStyleSelect(preset)}
                className="text-left group"
              >
                <ThemeStyleIllustration 
                  preset={preset} 
                  isSelected={currentSelectedStyle.id === preset.id} 
                />
                <div className="mt-2">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary-dark transition-colors">
                    {preset.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-background-secondary rounded-lg p-6 hover:shadow-soft transition-shadow duration-300">
        <div className="flex items-start gap-4">
          {/* Minimalist Theme Illustration */}
          <div className="hidden sm:flex flex-shrink-0">
            <ThemeAppearanceIllustration isDark={theme === 'dark'} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-primary-dark sm:hidden" />
                ) : (
                  <Sun className="h-4 w-4 text-primary-dark sm:hidden" />
                )}
                <Label className="text-sm font-medium">Mode</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Auto
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanged && (
        <div className="flex justify-end pt-4 border-t border-border/30">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2 transition-colors duration-200"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Style'}
          </Button>
        </div>
      )}
    </div>
  )
}
