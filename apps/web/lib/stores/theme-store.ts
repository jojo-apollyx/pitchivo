import { create } from 'zustand'
import { THEME_PRESETS, type ThemePreset, getThemePreset, getDefaultThemePreset } from '@/lib/themes/theme-presets'

interface ThemeState {
  selectedStyle: ThemePreset | null
  setStyle: (preset: ThemePreset) => void
  resetStyle: () => void
  initializeFromStorage: () => void
}

/**
 * Apply theme CSS variables to the document
 */
function applyThemePreset(preset: ThemePreset, isDark: boolean = false): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  const variables = isDark ? preset.cssVariables.dark : preset.cssVariables.light
  
  // Add transitioning class for smooth theme change
  root.setAttribute('data-theme-transitioning', 'true')
  
  // Apply CSS variables
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  // Set theme style attribute for CSS selectors
  root.setAttribute('data-theme-style', preset.id)
  root.setAttribute('data-theme-radius', preset.characteristics.borderRadius)
  
  // Remove transitioning class after animation
  setTimeout(() => {
    root.removeAttribute('data-theme-transitioning')
  }, 300)
}

/**
 * Detect if dark mode is active
 */
function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for next-themes dark class or system preference
  const htmlElement = document.documentElement
  if (htmlElement.classList.contains('dark')) return true
  if (htmlElement.getAttribute('data-theme') === 'dark') return true
  
  // Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Zustand store for theme style management
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  selectedStyle: null,

  setStyle: (preset: ThemePreset) => {
    applyThemePreset(preset, isDarkMode())
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitchivo-theme-style', preset.id)
    }
    set({ selectedStyle: preset })
  },

  resetStyle: () => {
    const defaultPreset = getDefaultThemePreset()
    applyThemePreset(defaultPreset, isDarkMode())
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitchivo-theme-style', defaultPreset.id)
    }
    set({ selectedStyle: defaultPreset })
  },

  initializeFromStorage: () => {
    const state = get()
    
    if (state.selectedStyle) {
      applyThemePreset(state.selectedStyle, isDarkMode())
      return
    }
    
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const storedStyleId = localStorage.getItem('pitchivo-theme-style')
      
      if (storedStyleId) {
        const preset = getThemePreset(storedStyleId)
        if (preset) {
          applyThemePreset(preset, isDarkMode())
          set({ selectedStyle: preset })
          return
        }
      }
      
      // No stored style, use default
      const defaultPreset = getDefaultThemePreset()
      applyThemePreset(defaultPreset, isDarkMode())
      set({ selectedStyle: defaultPreset })
    }
  },
}))

// Listen for dark mode changes to reapply theme
if (typeof window !== 'undefined') {
  // Watch for class changes on html element (next-themes)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
        const state = useThemeStore.getState()
        if (state.selectedStyle) {
          applyThemePreset(state.selectedStyle, isDarkMode())
        }
      }
    })
  })
  
  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.documentElement, { attributes: true })
    })
  } else {
    observer.observe(document.documentElement, { attributes: true })
  }
  
  // Also listen for system color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState()
    if (state.selectedStyle) {
      applyThemePreset(state.selectedStyle, isDarkMode())
    }
  })
}

// Re-export for backwards compatibility
export { THEME_PRESETS, type ThemePreset }
