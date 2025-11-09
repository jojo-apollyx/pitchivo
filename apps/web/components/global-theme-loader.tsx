'use client'

import { useEffect } from 'react'
import { applyColorScheme, COLOR_SCHEMES, type ColorScheme } from '@/lib/theme'

/**
 * Global theme loader that applies colors from localStorage on every page
 * This ensures colors persist across all pages, including setup and non-dashboard pages
 */
export function GlobalThemeLoader() {
  useEffect(() => {
    // Apply stored colors on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pitchivo-color-scheme')
      if (stored) {
        try {
          const colorScheme = JSON.parse(stored)
          
          if (colorScheme?.primary && colorScheme?.secondary && colorScheme?.accent) {
            // Try to find matching scheme
            const matchingScheme = COLOR_SCHEMES?.find?.(scheme => 
              scheme?.primary === colorScheme.primary &&
              scheme?.secondary === colorScheme.secondary &&
              scheme?.accent === colorScheme.accent
            )

            const schemeToApply: ColorScheme = matchingScheme || {
              name: 'Custom',
              primary: colorScheme.primary,
              secondary: colorScheme.secondary,
              accent: colorScheme.accent,
              description: 'Saved color scheme',
              category: 'Vibrant'
            }

            applyColorScheme(schemeToApply)
            console.log('Applied stored color scheme:', schemeToApply.name)
          }
        } catch (e) {
          console.error('Failed to load stored colors:', e)
        }
      }
    }
  }, [])

  return null
}

