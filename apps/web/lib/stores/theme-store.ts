import { create } from 'zustand'
import { THEME_PRESETS, type ThemePreset, getThemePreset, getDefaultThemePreset } from '@/lib/themes/theme-presets'

interface ThemeState {
  selectedStyle: ThemePreset | null
  setStyle: (preset: ThemePreset) => void
  resetStyle: () => void
  initializeFromStorage: () => void
}

/**
 * Apply theme CSS variables and mode to the document
 * Each theme has a fixed mode (Linear = dark, others = light)
 */
function applyThemePreset(preset: ThemePreset): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  const variables = preset.cssVariables
  
  // Add transitioning class for smooth theme change
  root.setAttribute('data-theme-transitioning', 'true')
  
  // Apply CSS variables
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  // Set theme style attribute for CSS selectors
  root.setAttribute('data-theme-style', preset.id)
  root.setAttribute('data-theme-radius', preset.characteristics.borderRadius)
  
  // Apply dark/light mode based on theme (Linear is dark, others are light)
  if (preset.isDark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
  
  // Remove transitioning class after animation
  setTimeout(() => {
    root.removeAttribute('data-theme-transitioning')
  }, 300)
}

/**
 * Zustand store for theme style management
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  selectedStyle: null,

  setStyle: (preset: ThemePreset) => {
    applyThemePreset(preset)
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitchivo-theme-style', preset.id)
    }
    set({ selectedStyle: preset })
  },

  resetStyle: () => {
    const defaultPreset = getDefaultThemePreset()
    applyThemePreset(defaultPreset)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitchivo-theme-style', defaultPreset.id)
    }
    set({ selectedStyle: defaultPreset })
  },

  initializeFromStorage: () => {
    const state = get()
    
    if (state.selectedStyle) {
      applyThemePreset(state.selectedStyle)
      return
    }
    
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const storedStyleId = localStorage.getItem('pitchivo-theme-style')
      
      if (storedStyleId) {
        const preset = getThemePreset(storedStyleId)
        if (preset) {
          applyThemePreset(preset)
          set({ selectedStyle: preset })
          return
        }
      }
      
      // No stored style, use default
      const defaultPreset = getDefaultThemePreset()
      applyThemePreset(defaultPreset)
      set({ selectedStyle: defaultPreset })
    }
  },
}))

// Re-export for convenience
export { THEME_PRESETS, type ThemePreset }
