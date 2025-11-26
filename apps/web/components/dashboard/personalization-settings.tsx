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
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-dark" />
          Personalization
        </h2>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Theme Color Section */}
      <div className="bg-background-secondary rounded-lg p-6">
        <div className="flex items-start gap-4">
          {/* Fancy Color Icon Illustration */}
          <div className="hidden sm:flex flex-shrink-0">
            <div className="relative w-16 h-16">
              {/* Layered color circles */}
              <div 
                className="absolute top-0 left-0 w-10 h-10 rounded-full opacity-80 shadow-soft"
                style={{ backgroundColor: currentSelectedScheme.primary }}
              />
              <div 
                className="absolute top-2 left-4 w-10 h-10 rounded-full opacity-80 shadow-soft"
                style={{ backgroundColor: currentSelectedScheme.secondary }}
              />
              <div 
                className="absolute top-4 left-2 w-10 h-10 rounded-full opacity-80 shadow-soft"
                style={{ backgroundColor: currentSelectedScheme.accent }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className="h-4 w-4 text-primary-dark" />
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
      <div className="bg-background-secondary rounded-lg p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="hidden sm:flex flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-accent-surface flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon className="h-8 w-8 text-primary-dark" />
              ) : (
                <Sun className="h-8 w-8 text-primary-dark" />
              )}
            </div>
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

