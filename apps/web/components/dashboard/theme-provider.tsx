'use client'

import { useEffect } from 'react'
import { applyColorScheme, resetThemeColor, COLOR_SCHEMES, type ColorScheme } from '@/lib/theme'

interface ThemeProviderProps {
  colorScheme?: {
    primary: string
    secondary: string
    accent: string
  } | null
}

export function ThemeProvider({ colorScheme }: ThemeProviderProps) {
  useEffect(() => {
    let schemeToUse = colorScheme
    
    // If no colorScheme from server, try localStorage
    if (!colorScheme?.primary || !colorScheme?.secondary || !colorScheme?.accent) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pitchivo-color-scheme')
        if (stored) {
          try {
            schemeToUse = JSON.parse(stored)
            console.log('Using stored color scheme from localStorage')
          } catch (e) {
            console.error('Failed to parse stored color scheme:', e)
          }
        }
      }
    }
    
    if (schemeToUse?.primary && schemeToUse?.secondary && schemeToUse?.accent) {
      // Safety check for COLOR_SCHEMES
      if (!COLOR_SCHEMES || !Array.isArray(COLOR_SCHEMES) || COLOR_SCHEMES.length === 0) {
        console.warn('COLOR_SCHEMES not loaded in ThemeProvider, using custom scheme')
        const customScheme: ColorScheme = {
          name: 'Custom',
          primary: schemeToUse.primary,
          secondary: schemeToUse.secondary,
          accent: schemeToUse.accent,
          description: 'Custom color scheme',
          category: 'Vibrant'
        }
        applyColorScheme(customScheme)
        return
      }
      
      // Find matching scheme from COLOR_SCHEMES or create a custom one
      const matchingScheme = COLOR_SCHEMES.find(scheme => 
        scheme?.primary === schemeToUse.primary &&
        scheme?.secondary === schemeToUse.secondary &&
        scheme?.accent === schemeToUse.accent
      )

      const schemeToApply: ColorScheme = matchingScheme || {
        name: 'Custom',
        primary: schemeToUse.primary,
        secondary: schemeToUse.secondary,
        accent: schemeToUse.accent,
        description: 'Custom color scheme',
        category: 'Vibrant'
      }

      applyColorScheme(schemeToApply)
    } else {
      // Reset to default if no color scheme
      resetThemeColor()
    }
    
    // Don't reset on unmount - keep the theme persistent
  }, [colorScheme])

  return null
}

