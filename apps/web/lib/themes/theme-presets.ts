/**
 * Theme Style Presets
 * 
 * Each style has a complete color palette and design characteristics
 * designed to be light, cheerful, fresh, and premium yet professional
 * (except Linear which is dark and sleek)
 */

export interface ThemePreset {
  id: string
  name: string
  description: string
  category: 'Light' | 'Dark' | 'Vibrant'
  preview: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  // CSS custom properties for this theme
  cssVariables: {
    light: Record<string, string>
    dark: Record<string, string>
  }
  // Special characteristics
  characteristics: {
    borderRadius: 'sharp' | 'soft' | 'rounded' | 'pill'
    shadows: 'none' | 'subtle' | 'soft' | 'neumorphic' | 'elevated'
    borders: 'none' | 'subtle' | 'visible' | 'accent'
    gradients: boolean
    blur: boolean
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  // ============================================
  // 1. MINIMALISM - Clean, subtle, lots of breathing room
  // ============================================
  {
    id: 'minimalism',
    name: 'Minimalism',
    description: 'Clean and subtle with refined elegance',
    category: 'Light',
    preview: {
      primary: '#7C9EB2',    // Dusty blue-gray
      secondary: '#A8B5BE',  // Soft gray
      accent: '#E8B4A0',     // Warm terracotta
      background: '#FAFAFA'
    },
    cssVariables: {
      light: {
        '--background': '0 0% 98%',
        '--background-secondary': '0 0% 95%',
        '--foreground': '220 15% 20%',
        '--primary': '200 25% 59%',
        '--primary-foreground': '0 0% 100%',
        '--primary-light': '200 25% 75%',
        '--primary-dark': '200 30% 45%',
        '--primary-darker': '200 35% 35%',
        '--accent-surface': '200 20% 95%',
        '--accent-color': '200 25% 59%',
        '--muted': '0 0% 95%',
        '--muted-foreground': '220 10% 45%',
        '--border': '0 0% 90%',
        '--border-hover': '0 0% 80%',
        '--ring': '200 30% 45%',
        // Semantic colors - muted tones
        '--semantic-success': '160 25% 55%',
        '--semantic-success-bg': '160 25% 95%',
        '--semantic-info': '200 30% 55%',
        '--semantic-info-bg': '200 30% 95%',
        '--semantic-warning': '35 40% 55%',
        '--semantic-warning-bg': '35 40% 95%',
        '--semantic-error': '0 30% 55%',
        '--semantic-error-bg': '0 30% 95%',
      },
      dark: {
        '--background': '220 15% 10%',
        '--background-secondary': '220 15% 14%',
        '--foreground': '0 0% 93%',
        '--primary': '200 30% 55%',
        '--primary-foreground': '220 15% 10%',
        '--primary-light': '200 25% 65%',
        '--primary-dark': '200 35% 50%',
        '--primary-darker': '200 40% 40%',
        '--accent-surface': '200 25% 18%',
        '--accent-color': '200 30% 55%',
        '--muted': '220 15% 18%',
        '--muted-foreground': '220 10% 60%',
        '--border': '220 15% 22%',
        '--border-hover': '220 15% 32%',
        '--ring': '200 35% 50%',
        '--semantic-success': '160 30% 50%',
        '--semantic-success-bg': '160 25% 18%',
        '--semantic-info': '200 35% 50%',
        '--semantic-info-bg': '200 30% 18%',
        '--semantic-warning': '35 45% 50%',
        '--semantic-warning-bg': '35 40% 18%',
        '--semantic-error': '0 35% 50%',
        '--semantic-error-bg': '0 30% 18%',
      }
    },
    characteristics: {
      borderRadius: 'soft',
      shadows: 'subtle',
      borders: 'subtle',
      gradients: false,
      blur: false
    }
  },

  // ============================================
  // 2. DESIGN SYSTEM - Professional, consistent, inspired by Figma/Notion
  // ============================================
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Professional and consistent like Figma',
    category: 'Light',
    preview: {
      primary: '#6366F1',    // Indigo
      secondary: '#8B5CF6',  // Violet
      accent: '#F472B6',     // Pink
      background: '#FFFFFF'
    },
    cssVariables: {
      light: {
        '--background': '0 0% 100%',
        '--background-secondary': '240 10% 97%',
        '--foreground': '240 10% 15%',
        '--primary': '239 84% 67%',
        '--primary-foreground': '0 0% 100%',
        '--primary-light': '239 84% 80%',
        '--primary-dark': '239 84% 55%',
        '--primary-darker': '239 84% 45%',
        '--accent-surface': '239 60% 96%',
        '--accent-color': '239 84% 67%',
        '--muted': '240 10% 96%',
        '--muted-foreground': '240 5% 45%',
        '--border': '240 10% 90%',
        '--border-hover': '239 50% 80%',
        '--ring': '239 84% 55%',
        '--semantic-success': '142 50% 50%',
        '--semantic-success-bg': '142 50% 95%',
        '--semantic-info': '221 80% 60%',
        '--semantic-info-bg': '221 80% 95%',
        '--semantic-warning': '38 90% 55%',
        '--semantic-warning-bg': '38 90% 95%',
        '--semantic-error': '0 70% 55%',
        '--semantic-error-bg': '0 70% 95%',
      },
      dark: {
        '--background': '240 10% 8%',
        '--background-secondary': '240 10% 12%',
        '--foreground': '0 0% 95%',
        '--primary': '239 84% 65%',
        '--primary-foreground': '240 10% 8%',
        '--primary-light': '239 70% 75%',
        '--primary-dark': '239 84% 55%',
        '--primary-darker': '239 84% 45%',
        '--accent-surface': '239 50% 18%',
        '--accent-color': '239 84% 65%',
        '--muted': '240 10% 16%',
        '--muted-foreground': '240 5% 60%',
        '--border': '240 10% 20%',
        '--border-hover': '239 50% 35%',
        '--ring': '239 84% 55%',
        '--semantic-success': '142 55% 45%',
        '--semantic-success-bg': '142 40% 15%',
        '--semantic-info': '221 75% 55%',
        '--semantic-info-bg': '221 60% 15%',
        '--semantic-warning': '38 85% 50%',
        '--semantic-warning-bg': '38 70% 15%',
        '--semantic-error': '0 65% 50%',
        '--semantic-error-bg': '0 50% 15%',
      }
    },
    characteristics: {
      borderRadius: 'rounded',
      shadows: 'soft',
      borders: 'visible',
      gradients: false,
      blur: true
    }
  },

  // ============================================
  // 3. NATURALISM - Earthy, organic, warm and grounded
  // ============================================
  {
    id: 'naturalism',
    name: 'Naturalism',
    description: 'Earthy tones inspired by nature',
    category: 'Light',
    preview: {
      primary: '#5D8A66',    // Forest green
      secondary: '#8B7355',  // Warm brown
      accent: '#D4A574',     // Sandy gold
      background: '#FAF8F5'
    },
    cssVariables: {
      light: {
        '--background': '40 30% 98%',
        '--background-secondary': '40 25% 94%',
        '--foreground': '30 20% 20%',
        '--primary': '135 25% 46%',
        '--primary-foreground': '40 30% 98%',
        '--primary-light': '135 25% 65%',
        '--primary-dark': '135 30% 38%',
        '--primary-darker': '135 35% 28%',
        '--accent-surface': '135 20% 94%',
        '--accent-color': '135 25% 46%',
        '--muted': '40 20% 94%',
        '--muted-foreground': '30 15% 45%',
        '--border': '40 15% 88%',
        '--border-hover': '135 20% 75%',
        '--ring': '135 30% 38%',
        '--semantic-success': '145 35% 45%',
        '--semantic-success-bg': '145 30% 94%',
        '--semantic-info': '200 35% 50%',
        '--semantic-info-bg': '200 30% 94%',
        '--semantic-warning': '35 55% 55%',
        '--semantic-warning-bg': '35 50% 94%',
        '--semantic-error': '10 45% 50%',
        '--semantic-error-bg': '10 40% 94%',
      },
      dark: {
        '--background': '30 15% 10%',
        '--background-secondary': '30 15% 14%',
        '--foreground': '40 20% 90%',
        '--primary': '135 30% 50%',
        '--primary-foreground': '30 15% 10%',
        '--primary-light': '135 25% 60%',
        '--primary-dark': '135 35% 42%',
        '--primary-darker': '135 40% 32%',
        '--accent-surface': '135 20% 18%',
        '--accent-color': '135 30% 50%',
        '--muted': '30 15% 18%',
        '--muted-foreground': '30 10% 60%',
        '--border': '30 15% 22%',
        '--border-hover': '135 25% 35%',
        '--ring': '135 35% 42%',
        '--semantic-success': '145 40% 42%',
        '--semantic-success-bg': '145 30% 16%',
        '--semantic-info': '200 40% 45%',
        '--semantic-info-bg': '200 30% 16%',
        '--semantic-warning': '35 60% 50%',
        '--semantic-warning-bg': '35 45% 16%',
        '--semantic-error': '10 50% 45%',
        '--semantic-error-bg': '10 40% 16%',
      }
    },
    characteristics: {
      borderRadius: 'soft',
      shadows: 'soft',
      borders: 'subtle',
      gradients: false,
      blur: false
    }
  },

  // ============================================
  // 4. LIGHT NEOMORPHISM - Soft 3D, embossed, tactile
  // ============================================
  {
    id: 'neomorphism',
    name: 'Light Neomorphism',
    description: 'Soft 3D with tactile feel',
    category: 'Light',
    preview: {
      primary: '#6B8DE3',    // Soft blue
      secondary: '#9F7AEA',  // Soft purple
      accent: '#F687B3',     // Soft pink
      background: '#E8EDF5'
    },
    cssVariables: {
      light: {
        '--background': '220 30% 94%',
        '--background-secondary': '220 25% 91%',
        '--foreground': '220 20% 20%',
        '--primary': '225 65% 65%',
        '--primary-foreground': '0 0% 100%',
        '--primary-light': '225 65% 78%',
        '--primary-dark': '225 70% 52%',
        '--primary-darker': '225 75% 42%',
        '--accent-surface': '220 30% 91%',
        '--accent-color': '225 65% 65%',
        '--muted': '220 25% 91%',
        '--muted-foreground': '220 15% 45%',
        '--border': '220 20% 88%',
        '--border-hover': '225 40% 78%',
        '--ring': '225 70% 52%',
        '--semantic-success': '155 45% 50%',
        '--semantic-success-bg': '155 35% 90%',
        '--semantic-info': '225 60% 60%',
        '--semantic-info-bg': '225 50% 90%',
        '--semantic-warning': '40 60% 55%',
        '--semantic-warning-bg': '40 50% 90%',
        '--semantic-error': '350 55% 55%',
        '--semantic-error-bg': '350 45% 90%',
      },
      dark: {
        '--background': '220 20% 16%',
        '--background-secondary': '220 20% 20%',
        '--foreground': '220 20% 92%',
        '--primary': '225 60% 60%',
        '--primary-foreground': '220 20% 16%',
        '--primary-light': '225 55% 70%',
        '--primary-dark': '225 65% 50%',
        '--primary-darker': '225 70% 40%',
        '--accent-surface': '220 25% 22%',
        '--accent-color': '225 60% 60%',
        '--muted': '220 20% 22%',
        '--muted-foreground': '220 15% 60%',
        '--border': '220 20% 26%',
        '--border-hover': '225 40% 40%',
        '--ring': '225 65% 50%',
        '--semantic-success': '155 50% 45%',
        '--semantic-success-bg': '155 35% 18%',
        '--semantic-info': '225 55% 55%',
        '--semantic-info-bg': '225 45% 18%',
        '--semantic-warning': '40 55% 50%',
        '--semantic-warning-bg': '40 45% 18%',
        '--semantic-error': '350 50% 50%',
        '--semantic-error-bg': '350 40% 18%',
      }
    },
    characteristics: {
      borderRadius: 'rounded',
      shadows: 'neumorphic',
      borders: 'none',
      gradients: false,
      blur: false
    }
  },

  // ============================================
  // 5. DIFFUSE GRADIENT - Soft gradients, dreamy, pastel
  // ============================================
  {
    id: 'diffuse-gradient',
    name: 'Diffuse Gradient',
    description: 'Soft gradients with dreamy pastels',
    category: 'Vibrant',
    preview: {
      primary: '#A78BFA',    // Soft violet
      secondary: '#67E8F9',  // Soft cyan
      accent: '#FCA5A5',     // Soft coral
      background: '#FEFEFF'
    },
    cssVariables: {
      light: {
        '--background': '250 50% 99%',
        '--background-secondary': '250 40% 97%',
        '--foreground': '250 25% 18%',
        '--primary': '263 70% 76%',
        '--primary-foreground': '250 25% 18%',
        '--primary-light': '263 70% 85%',
        '--primary-dark': '263 75% 62%',
        '--primary-darker': '263 80% 50%',
        '--accent-surface': '263 50% 96%',
        '--accent-color': '263 70% 76%',
        '--muted': '250 35% 96%',
        '--muted-foreground': '250 15% 45%',
        '--border': '250 30% 92%',
        '--border-hover': '263 45% 82%',
        '--ring': '263 75% 62%',
        '--semantic-success': '158 55% 55%',
        '--semantic-success-bg': '158 50% 95%',
        '--semantic-info': '195 75% 60%',
        '--semantic-info-bg': '195 70% 95%',
        '--semantic-warning': '40 75% 60%',
        '--semantic-warning-bg': '40 70% 95%',
        '--semantic-error': '0 65% 65%',
        '--semantic-error-bg': '0 60% 95%',
      },
      dark: {
        '--background': '250 25% 10%',
        '--background-secondary': '250 25% 14%',
        '--foreground': '250 30% 92%',
        '--primary': '263 65% 68%',
        '--primary-foreground': '250 25% 10%',
        '--primary-light': '263 60% 75%',
        '--primary-dark': '263 70% 55%',
        '--primary-darker': '263 75% 45%',
        '--accent-surface': '263 40% 18%',
        '--accent-color': '263 65% 68%',
        '--muted': '250 25% 18%',
        '--muted-foreground': '250 15% 60%',
        '--border': '250 25% 22%',
        '--border-hover': '263 40% 38%',
        '--ring': '263 70% 55%',
        '--semantic-success': '158 50% 48%',
        '--semantic-success-bg': '158 40% 16%',
        '--semantic-info': '195 70% 52%',
        '--semantic-info-bg': '195 55% 16%',
        '--semantic-warning': '40 70% 52%',
        '--semantic-warning-bg': '40 55% 16%',
        '--semantic-error': '0 60% 55%',
        '--semantic-error-bg': '0 45% 16%',
      }
    },
    characteristics: {
      borderRadius: 'rounded',
      shadows: 'soft',
      borders: 'subtle',
      gradients: true,
      blur: true
    }
  },

  // ============================================
  // 6. DOPAMINE - Bright, cheerful, energizing
  // ============================================
  {
    id: 'dopamine',
    name: 'Dopamine',
    description: 'Bright and cheerful with positive energy',
    category: 'Vibrant',
    preview: {
      primary: '#FF6B6B',    // Coral red
      secondary: '#4ECDC4',  // Teal
      accent: '#FFE66D',     // Yellow
      background: '#FFFFFE'
    },
    cssVariables: {
      light: {
        '--background': '60 33% 99%',
        '--background-secondary': '60 25% 96%',
        '--foreground': '210 20% 18%',
        '--primary': '0 100% 71%',
        '--primary-foreground': '0 0% 100%',
        '--primary-light': '0 100% 82%',
        '--primary-dark': '0 85% 60%',
        '--primary-darker': '0 80% 50%',
        '--accent-surface': '0 60% 96%',
        '--accent-color': '0 100% 71%',
        '--muted': '60 20% 95%',
        '--muted-foreground': '210 15% 45%',
        '--border': '60 15% 90%',
        '--border-hover': '0 60% 80%',
        '--ring': '0 85% 60%',
        '--semantic-success': '168 70% 45%',
        '--semantic-success-bg': '168 60% 94%',
        '--semantic-info': '200 80% 55%',
        '--semantic-info-bg': '200 70% 94%',
        '--semantic-warning': '48 95% 55%',
        '--semantic-warning-bg': '48 85% 92%',
        '--semantic-error': '0 80% 60%',
        '--semantic-error-bg': '0 70% 94%',
      },
      dark: {
        '--background': '210 20% 10%',
        '--background-secondary': '210 20% 14%',
        '--foreground': '60 20% 92%',
        '--primary': '0 90% 65%',
        '--primary-foreground': '210 20% 10%',
        '--primary-light': '0 85% 75%',
        '--primary-dark': '0 80% 55%',
        '--primary-darker': '0 75% 45%',
        '--accent-surface': '0 50% 18%',
        '--accent-color': '0 90% 65%',
        '--muted': '210 20% 18%',
        '--muted-foreground': '210 15% 60%',
        '--border': '210 20% 22%',
        '--border-hover': '0 50% 40%',
        '--ring': '0 80% 55%',
        '--semantic-success': '168 65% 42%',
        '--semantic-success-bg': '168 50% 16%',
        '--semantic-info': '200 75% 50%',
        '--semantic-info-bg': '200 55% 16%',
        '--semantic-warning': '48 90% 50%',
        '--semantic-warning-bg': '48 70% 16%',
        '--semantic-error': '0 75% 55%',
        '--semantic-error-bg': '0 55% 16%',
      }
    },
    characteristics: {
      borderRadius: 'rounded',
      shadows: 'elevated',
      borders: 'accent',
      gradients: true,
      blur: false
    }
  },

  // ============================================
  // 7. RETRO-FUTURISM - Vintage meets modern, warm with cool accents
  // ============================================
  {
    id: 'retro-futurism',
    name: 'Retro-Futurism',
    description: 'Vintage meets modern aesthetic',
    category: 'Vibrant',
    preview: {
      primary: '#E07A5F',    // Terracotta
      secondary: '#3D5A80',  // Navy blue
      accent: '#81B29A',     // Sage
      background: '#FFF9F0'
    },
    cssVariables: {
      light: {
        '--background': '35 100% 97%',
        '--background-secondary': '35 60% 94%',
        '--foreground': '210 40% 20%',
        '--primary': '13 65% 62%',
        '--primary-foreground': '0 0% 100%',
        '--primary-light': '13 65% 75%',
        '--primary-dark': '13 70% 50%',
        '--primary-darker': '13 75% 40%',
        '--accent-surface': '13 40% 95%',
        '--accent-color': '13 65% 62%',
        '--muted': '35 40% 94%',
        '--muted-foreground': '210 25% 45%',
        '--border': '35 30% 88%',
        '--border-hover': '13 45% 75%',
        '--ring': '13 70% 50%',
        '--semantic-success': '155 35% 48%',
        '--semantic-success-bg': '155 30% 94%',
        '--semantic-info': '210 50% 45%',
        '--semantic-info-bg': '210 45% 94%',
        '--semantic-warning': '38 70% 55%',
        '--semantic-warning-bg': '38 60% 94%',
        '--semantic-error': '0 55% 55%',
        '--semantic-error-bg': '0 50% 94%',
      },
      dark: {
        '--background': '210 35% 12%',
        '--background-secondary': '210 35% 16%',
        '--foreground': '35 50% 90%',
        '--primary': '13 60% 58%',
        '--primary-foreground': '210 35% 12%',
        '--primary-light': '13 55% 68%',
        '--primary-dark': '13 65% 48%',
        '--primary-darker': '13 70% 38%',
        '--accent-surface': '13 35% 20%',
        '--accent-color': '13 60% 58%',
        '--muted': '210 30% 18%',
        '--muted-foreground': '35 30% 60%',
        '--border': '210 30% 22%',
        '--border-hover': '13 40% 40%',
        '--ring': '13 65% 48%',
        '--semantic-success': '155 40% 42%',
        '--semantic-success-bg': '155 30% 16%',
        '--semantic-info': '210 45% 42%',
        '--semantic-info-bg': '210 35% 16%',
        '--semantic-warning': '38 65% 50%',
        '--semantic-warning-bg': '38 50% 16%',
        '--semantic-error': '0 50% 50%',
        '--semantic-error-bg': '0 40% 16%',
      }
    },
    characteristics: {
      borderRadius: 'soft',
      shadows: 'soft',
      borders: 'visible',
      gradients: false,
      blur: false
    }
  },

  // ============================================
  // 8. LINEAR - Dark, sleek, professional (like Linear app)
  // ============================================
  {
    id: 'linear',
    name: 'Linear',
    description: 'Dark and sleek like Linear app',
    category: 'Dark',
    preview: {
      primary: '#5E6AD2',    // Linear purple
      secondary: '#6E79D6',  // Light purple
      accent: '#F2C94C',     // Gold
      background: '#0D0D0D'
    },
    cssVariables: {
      light: {
        // Linear is dark-first, but we provide a light variant
        '--background': '0 0% 98%',
        '--background-secondary': '240 5% 94%',
        '--foreground': '240 10% 15%',
        '--primary': '235 58% 60%',
        '--primary-foreground': '0 0% 100%',
        '--primary-light': '235 55% 72%',
        '--primary-dark': '235 60% 50%',
        '--primary-darker': '235 65% 40%',
        '--accent-surface': '235 35% 95%',
        '--accent-color': '235 58% 60%',
        '--muted': '240 5% 94%',
        '--muted-foreground': '240 5% 45%',
        '--border': '240 5% 88%',
        '--border-hover': '235 35% 75%',
        '--ring': '235 60% 50%',
        '--semantic-success': '145 55% 45%',
        '--semantic-success-bg': '145 45% 94%',
        '--semantic-info': '235 55% 55%',
        '--semantic-info-bg': '235 45% 94%',
        '--semantic-warning': '45 85% 50%',
        '--semantic-warning-bg': '45 75% 94%',
        '--semantic-error': '0 60% 50%',
        '--semantic-error-bg': '0 50% 94%',
      },
      dark: {
        // This is the signature Linear dark theme
        '--background': '0 0% 5%',
        '--background-secondary': '0 0% 9%',
        '--foreground': '0 0% 88%',
        '--primary': '235 58% 60%',
        '--primary-foreground': '0 0% 5%',
        '--primary-light': '235 55% 68%',
        '--primary-dark': '235 60% 52%',
        '--primary-darker': '235 65% 42%',
        '--accent-surface': '235 30% 15%',
        '--accent-color': '235 58% 60%',
        '--muted': '0 0% 12%',
        '--muted-foreground': '0 0% 55%',
        '--border': '0 0% 15%',
        '--border-hover': '235 30% 30%',
        '--ring': '235 60% 52%',
        '--semantic-success': '145 50% 45%',
        '--semantic-success-bg': '145 35% 12%',
        '--semantic-info': '235 50% 55%',
        '--semantic-info-bg': '235 35% 12%',
        '--semantic-warning': '45 80% 48%',
        '--semantic-warning-bg': '45 60% 12%',
        '--semantic-error': '0 55% 48%',
        '--semantic-error-bg': '0 40% 12%',
      }
    },
    characteristics: {
      borderRadius: 'soft',
      shadows: 'none',
      borders: 'subtle',
      gradients: false,
      blur: true
    }
  }
]

// Get preset by ID
export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find(preset => preset.id === id)
}

// Get default preset
export function getDefaultThemePreset(): ThemePreset {
  return THEME_PRESETS[0] // Minimalism
}

// Group presets by category
export function getPresetsByCategory(): Record<string, ThemePreset[]> {
  return THEME_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = []
    }
    acc[preset.category].push(preset)
    return acc
  }, {} as Record<string, ThemePreset[]>)
}

