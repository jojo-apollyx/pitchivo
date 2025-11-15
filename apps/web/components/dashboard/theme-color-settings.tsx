'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ColorSchemePicker } from './color-scheme-picker'
import { Button } from '@/components/ui/button'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/theme'
import { useThemeStore } from '@/lib/stores/theme-store'

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

  const { selectedScheme, setScheme, initializeFromStorage } = useThemeStore()
  const [isSaving, setIsSaving] = useState(false)

  // Initialize from storage on mount
  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])
  
  // Reapply current scheme when currentScheme prop changes (after page navigation)
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

      console.log('[Theme Save] Saving color scheme:', {
        organizationId,
        primary: selectedScheme.primary,
        secondary: selectedScheme.secondary,
        accent: selectedScheme.accent,
        name: selectedScheme.name
      })

      // Use RPC function to bypass RLS restrictions
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

      console.log('[Theme Save] RPC result:', { data, error })

      if (error) {
        console.error('[Theme Save] Database error:', error)
        throw error
      }

      if (!data) {
        console.warn('[Theme Save] RPC returned false - may not have permission')
        throw new Error('Failed to update colors. You may not have permission to modify this organization.')
      }

      console.log('[Theme Save] Successfully updated organization colors')
      toast.success(`Color scheme "${selectedScheme.name}" saved successfully!`)
      
      // Update Zustand store (which applies the scheme)
      setScheme(selectedScheme)
      
      // Force router to refresh server-side data
      router.refresh()
    } catch (error) {
      console.error('[Theme Save] Error updating color scheme:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update color scheme. Please try again.')
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Brand Colors
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose a professional color scheme for your organization. This will be applied across your dashboard and customer-facing pages.
        </p>
      </div>
      
      <ColorSchemePicker 
        value={currentSelectedScheme} 
        onChange={(scheme) => setScheme(scheme)} 
      />
      
      <div className="flex justify-end pt-4 border-t border-border/30">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanged}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Color Scheme'}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

