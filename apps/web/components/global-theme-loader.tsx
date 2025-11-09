'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/stores/theme-store'

/**
 * Global theme loader that applies colors from Zustand store on every page
 * This ensures colors persist across all pages, including setup and non-dashboard pages
 */
export function GlobalThemeLoader() {
  const { initializeFromStorage } = useThemeStore()

  useEffect(() => {
    // Initialize theme from storage on mount
    initializeFromStorage()
  }, [initializeFromStorage])

  return null
}

