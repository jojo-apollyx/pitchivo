import { create } from 'zustand'
import { applyColorScheme, type ColorScheme, COLOR_SCHEMES } from '@/lib/theme'

interface ThemeState {
  selectedScheme: ColorScheme | null
  setScheme: (scheme: ColorScheme) => void
  resetScheme: () => void
  initializeFromStorage: () => void
}

/**
 * Zustand store for theme/color scheme management
 * Persists to localStorage manually for compatibility
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  selectedScheme: null,

  setScheme: (scheme: ColorScheme) => {
    applyColorScheme(scheme)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitchivo-color-scheme', JSON.stringify({
        primary: scheme.primary,
        secondary: scheme.secondary,
        accent: scheme.accent,
      }))
    }
    set({ selectedScheme: scheme })
  },

  resetScheme: () => {
    const defaultScheme = COLOR_SCHEMES[0] // Emerald Spark
    applyColorScheme(defaultScheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitchivo-color-scheme', JSON.stringify({
        primary: defaultScheme.primary,
        secondary: defaultScheme.secondary,
        accent: defaultScheme.accent,
      }))
    }
    set({ selectedScheme: defaultScheme })
  },

  initializeFromStorage: () => {
    const state = get()
    if (state.selectedScheme) {
      applyColorScheme(state.selectedScheme)
    } else {
      // Try to load from localStorage (legacy support)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pitchivo-color-scheme')
        if (stored) {
          try {
            const colorScheme = JSON.parse(stored)
            const matchingScheme = COLOR_SCHEMES.find(
              (scheme) =>
                scheme.primary === colorScheme.primary &&
                scheme.secondary === colorScheme.secondary &&
                scheme.accent === colorScheme.accent
            )
            if (matchingScheme) {
              get().setScheme(matchingScheme)
            }
          } catch (e) {
            console.error('Failed to load stored colors:', e)
          }
        }
      }
    }
  },
}))

