'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ColorSchemePicker } from './color-scheme-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { applyColorScheme, COLOR_SCHEMES, type ColorScheme } from '@/lib/theme'

interface ThemeColorSettingsProps {
  organizationId: string
  currentScheme?: {
    primary: string
    secondary: string
    accent: string
  }
}

export function ThemeColorSettings({ 
  organizationId, 
  currentScheme = {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F87171'
  }
}: ThemeColorSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  
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
      // Safety check for COLOR_SCHEMES
      if (!COLOR_SCHEMES || !Array.isArray(COLOR_SCHEMES) || COLOR_SCHEMES.length === 0) {
        console.warn('COLOR_SCHEMES not available, using fallback')
        return FALLBACK_SCHEME
      }
      
      const matchingScheme = COLOR_SCHEMES.find(scheme => 
        scheme?.primary === currentScheme.primary &&
        scheme?.secondary === currentScheme.secondary &&
        scheme?.accent === currentScheme.accent
      )
      
      return matchingScheme || COLOR_SCHEMES[0] || FALLBACK_SCHEME
    } catch (error) {
      console.error('Error in getInitialScheme:', error)
      return FALLBACK_SCHEME
    }
  }

  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>(() => getInitialScheme())
  const [isSaving, setIsSaving] = useState(false)

  // Apply color scheme on mount and when it changes
  useEffect(() => {
    if (selectedScheme) {
      applyColorScheme(selectedScheme)
      // Store in localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('pitchivo-color-scheme', JSON.stringify({
          primary: selectedScheme.primary,
          secondary: selectedScheme.secondary,
          accent: selectedScheme.accent
        }))
      }
    }
  }, [selectedScheme])
  
  // Reapply current scheme when currentScheme prop changes (after page navigation)
  useEffect(() => {
    const scheme = getInitialScheme()
    setSelectedScheme(scheme)
    applyColorScheme(scheme)
  }, [currentScheme.primary, currentScheme.secondary, currentScheme.accent])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          primary_color: selectedScheme.primary,
          secondary_color: selectedScheme.secondary,
          accent_color: selectedScheme.accent
        })
        .eq('id', organizationId)

      if (error) throw error

      toast.success('Color scheme updated successfully!')
      
      // Apply the scheme immediately
      applyColorScheme(selectedScheme)
      
      // Force router to refresh server-side data
      router.refresh()
      
      // Small delay to ensure the color persists
      setTimeout(() => {
        applyColorScheme(selectedScheme)
      }, 100)
    } catch (error) {
      console.error('Error updating color scheme:', error)
      toast.error('Failed to update color scheme. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanged = 
    selectedScheme.primary !== currentScheme.primary ||
    selectedScheme.secondary !== currentScheme.secondary ||
    selectedScheme.accent !== currentScheme.accent

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Brand Colors
        </CardTitle>
        <CardDescription>
          Choose a professional color scheme for your organization. This will be applied across your dashboard and customer-facing pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ColorSchemePicker 
          value={selectedScheme} 
          onChange={setSelectedScheme} 
        />
        
        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanged}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Color Scheme'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

