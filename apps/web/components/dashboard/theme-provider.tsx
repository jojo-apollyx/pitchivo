'use client'

import { useEffect } from 'react'
import { applyThemeColor, resetThemeColor } from '@/lib/theme'

interface ThemeProviderProps {
  themeColor?: string | null
}

export function ThemeProvider({ themeColor }: ThemeProviderProps) {
  useEffect(() => {
    if (themeColor) {
      applyThemeColor(themeColor)
    } else {
      // Reset to default if no theme color
      resetThemeColor()
    }

    // Cleanup: reset to default when component unmounts
    return () => {
      resetThemeColor()
    }
  }, [themeColor])

  return null
}

