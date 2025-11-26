'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Save, Sparkles, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/theme'
import { useThemeStore } from '@/lib/stores/theme-store'
import { useTheme } from 'next-themes'

// Minimalist SVG illustration for color/palette
function ColorPaletteIllustration({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      {/* Artistic brush stroke shapes */}
      <ellipse cx="20" cy="28" rx="14" ry="18" fill={colors.primary} opacity="0.9" transform="rotate(-15 20 28)" />
      <ellipse cx="38" cy="24" rx="12" ry="16" fill={colors.secondary} opacity="0.85" transform="rotate(10 38 24)" />
      <ellipse cx="44" cy="42" rx="10" ry="14" fill={colors.accent} opacity="0.8" transform="rotate(-5 44 42)" />
      {/* Subtle highlight */}
      <circle cx="16" cy="22" r="3" fill="white" opacity="0.4" />
      <circle cx="36" cy="18" r="2" fill="white" opacity="0.3" />
    </svg>
  )
}

// Minimalist SVG illustration for theme/appearance
function ThemeIllustration({ isDark }: { isDark: boolean }) {
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
  currentScheme?: {
    primary: string
    secondary: string
    accent: string
  }
}

export function PersonalizationSettings({ 
  organizationId, 
  currentScheme = {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F87171'
  }
}: PersonalizationSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  // Default fallback scheme
  const FALLBACK_SCHEME: ColorScheme = {
    name: 'Emerald Spark',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F87171',
    description: 'Fresh emerald with coral red accents',
    category: 'Vibrant'
  }
  
  // Find the matching scheme from COLOR_SCHEMES or use fallback
  const getInitialScheme = (): ColorScheme => {
    try {
      if (!COLOR_SCHEMES || !Array.isArray(COLOR_SCHEMES) || COLOR_SCHEMES.length === 0) {
        return FALLBACK_SCHEME
      }
      
      const matchingScheme = COLOR_SCHEMES.find(scheme => 
        scheme?.primary === currentScheme.primary &&
        scheme?.secondary === currentScheme.secondary &&
        scheme?.accent === currentScheme.accent
      )
      
      return matchingScheme || COLOR_SCHEMES[0] || FALLBACK_SCHEME
    } catch (error) {
      return FALLBACK_SCHEME
    }
  }

  const { selectedScheme, setScheme, initializeFromStorage } = useThemeStore()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])
  
  useEffect(() => {
    const scheme = getInitialScheme()
    if (scheme) {
      setScheme(scheme)
    }
  }, [currentScheme.primary, currentScheme.secondary, currentScheme.accent, setScheme])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (!selectedScheme) {
        toast.error('No color scheme selected')
        return
      }

      const { data, error } = await supabase.rpc('update_user_organization', {
        p_org_id: organizationId,
        p_primary_color: selectedScheme.primary,
        p_secondary_color: selectedScheme.secondary,
        p_accent_color: selectedScheme.accent,
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
        throw new Error('Failed to update colors. You may not have permission.')
      }

      toast.success(`Color scheme saved!`)
      setScheme(selectedScheme)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanged = selectedScheme
    ? (selectedScheme.primary !== currentScheme.primary ||
       selectedScheme.secondary !== currentScheme.secondary ||
       selectedScheme.accent !== currentScheme.accent)
    : false

  const currentSelectedScheme = selectedScheme || getInitialScheme()

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
    <div className="space-y-8">
      {/* Header with subtle gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-background via-background to-muted/30 p-6 border border-border/30">
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent-surface flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-dark" />
            </div>
            Personalization
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel of your workspace
          </p>
        </div>
        {/* Decorative accent dot */}
        <div 
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-[0.07]"
          style={{ backgroundColor: currentSelectedScheme.primary }}
        />
      </div>

      {/* Theme Color Section */}
      <div className="bg-background-secondary rounded-lg p-6 hover:shadow-soft transition-shadow duration-300">
        <div className="flex items-start gap-4">
          {/* Minimalist Color Illustration */}
          <div className="hidden sm:flex flex-shrink-0">
            <ColorPaletteIllustration colors={currentSelectedScheme} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className="h-4 w-4 text-primary-dark sm:hidden" />
                <Label className="text-sm font-medium">Brand Colors</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose colors for your dashboard and customer pages
              </p>
            </div>

            <Select
              value={currentSelectedScheme.name}
              onValueChange={(name) => {
                const scheme = COLOR_SCHEMES.find(s => s.name === name)
                if (scheme) setScheme(scheme)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div 
                        className="h-4 w-4 rounded" 
                        style={{ backgroundColor: currentSelectedScheme.primary }}
                      />
                      <div 
                        className="h-4 w-4 rounded" 
                        style={{ backgroundColor: currentSelectedScheme.secondary }}
                      />
                      <div 
                        className="h-4 w-4 rounded" 
                        style={{ backgroundColor: currentSelectedScheme.accent }}
                      />
                    </div>
                    <span className="font-medium">{currentSelectedScheme.name}</span>
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
                        className="py-2"
                      >
                        <div className="flex items-center gap-2">
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

            <p className="text-xs text-muted-foreground">
              {currentSelectedScheme.description}
            </p>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-background-secondary rounded-lg p-6 hover:shadow-soft transition-shadow duration-300">
        <div className="flex items-start gap-4">
          {/* Minimalist Theme Illustration */}
          <div className="hidden sm:flex flex-shrink-0">
            <ThemeIllustration isDark={theme === 'dark'} />
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
                <Label className="text-sm font-medium">Appearance</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>

            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>System</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

