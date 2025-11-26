'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Sparkles, Check, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useThemeStore, THEME_PRESETS, type ThemePreset } from '@/lib/stores/theme-store'

// Visual preview of each theme style
function ThemeStylePreview({ preset, isSelected }: { preset: ThemePreset; isSelected: boolean }) {
  const { primary, secondary, accent, background } = preset.preview
  
  return (
    <div className={cn(
      "relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300",
      isSelected 
        ? "ring-2 ring-primary-dark ring-offset-2 ring-offset-background" 
        : "ring-1 ring-border/50 hover:ring-border hover:shadow-soft"
    )}>
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: background }}
      />
      
      {/* Mini UI mockup */}
      <div className="absolute inset-2 flex flex-col gap-1.5">
        {/* Header bar */}
        <div className="flex items-center gap-1">
          <div 
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: primary, opacity: 0.6 }}
          />
          <div 
            className="h-1.5 flex-1 rounded-sm"
            style={{ backgroundColor: primary, opacity: 0.15 }}
          />
        </div>
        
        {/* Content area */}
        <div className="flex-1 flex gap-1.5">
          {/* Sidebar */}
          <div className="w-1/4 flex flex-col gap-1">
            <div 
              className="h-1.5 w-full rounded-sm"
              style={{ backgroundColor: secondary, opacity: 0.25 }}
            />
            <div 
              className="h-1.5 w-3/4 rounded-sm"
              style={{ backgroundColor: secondary, opacity: 0.15 }}
            />
            <div 
              className="h-1.5 w-5/6 rounded-sm"
              style={{ backgroundColor: secondary, opacity: 0.1 }}
            />
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Hero card */}
            <div 
              className="h-5 rounded-sm"
              style={{ backgroundColor: primary, opacity: 0.12 }}
            />
            {/* Stats row */}
            <div className="flex gap-1">
              <div 
                className="flex-1 h-3 rounded-sm"
                style={{ backgroundColor: secondary, opacity: 0.18 }}
              />
              <div 
                className="flex-1 h-3 rounded-sm"
                style={{ backgroundColor: accent, opacity: 0.22 }}
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
      
      {/* Dark mode indicator for Linear */}
      {preset.isDark && (
        <div className="absolute top-1.5 left-1.5">
          <Moon className="w-3 h-3 text-white/60" />
        </div>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-dark flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
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

  // Separate light and dark themes
  const lightThemes = THEME_PRESETS.filter(p => !p.isDark)
  const darkThemes = THEME_PRESETS.filter(p => p.isDark)

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
            Choose a style that reflects your brand's personality
          </p>
        </div>
        {/* Decorative accent */}
        <div 
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-[0.07]"
          style={{ backgroundColor: currentSelectedStyle.preview.primary }}
        />
      </div>

      {/* Current Selection Info */}
      {currentSelectedStyle && (
        <div className="flex items-center gap-3 p-4 bg-accent-surface/50 rounded-lg border border-border/30">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: currentSelectedStyle.preview.primary }}
          >
            {currentSelectedStyle.isDark ? (
              <Moon className="w-5 h-5 text-white" />
            ) : (
              <Sun className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{currentSelectedStyle.name}</p>
            <p className="text-xs text-muted-foreground">{currentSelectedStyle.description}</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <div 
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ backgroundColor: currentSelectedStyle.preview.primary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ backgroundColor: currentSelectedStyle.preview.secondary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ backgroundColor: currentSelectedStyle.preview.accent }}
            />
          </div>
        </div>
      )}

      {/* Light Theme Styles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary-dark" />
          <Label className="text-sm font-medium">Light Themes</Label>
          <span className="text-xs text-muted-foreground">({lightThemes.length} styles)</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {lightThemes.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleStyleSelect(preset)}
              className="text-left group"
            >
              <ThemeStylePreview 
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

      {/* Dark Theme Styles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-primary-dark" />
          <Label className="text-sm font-medium">Dark Theme</Label>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {darkThemes.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleStyleSelect(preset)}
              className="text-left group"
            >
              <ThemeStylePreview 
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
