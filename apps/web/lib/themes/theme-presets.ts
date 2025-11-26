/**
 * Theme Style Presets
 * 
 * Each style has a carefully curated color palette designed to be:
 * - Eye-pleasing and harmonious
 * - Popular and modern
 * - Distinctive to its aesthetic
 * 
 * All themes are LIGHT mode except Linear which is DARK
 */

export interface ThemePreset {
  id: string
  name: string
  description: string
  isDark: boolean
  preview: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  // CSS custom properties
  cssVariables: Record<string, string>
  // Design characteristics
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
  // 1. MINIMALISM
  // Inspired by: Apple, Notion, Rauno Freiberg
  // Philosophy: Less is more, every element has purpose
  // ============================================
  {
    id: 'minimalism',
    name: 'Minimalism',
    description: 'Clean elegance with purposeful simplicity',
    isDark: false,
    preview: {
      primary: '#2D3748',    // Charcoal blue
      secondary: '#718096',  // Cool gray
      accent: '#E53E3E',     // Vermillion red accent
      background: '#FFFFFF'
    },
    cssVariables: {
      // Backgrounds - Pure white with warm gray secondary
      '--background': '0 0% 100%',
      '--background-secondary': '40 10% 98%',
      '--foreground': '220 25% 20%',
      
      // Primary - Sophisticated charcoal blue
      '--primary': '215 25% 27%',
      '--primary-foreground': '0 0% 100%',
      '--primary-light': '215 20% 45%',
      '--primary-dark': '215 30% 22%',
      '--primary-darker': '215 35% 15%',
      
      // Accent - Warm vermillion for highlights
      '--accent-surface': '40 15% 96%',
      '--accent-color': '0 72% 51%',
      '--accent-color-foreground': '0 0% 100%',
      
      // Muted & Secondary
      '--muted': '40 10% 96%',
      '--muted-foreground': '220 10% 50%',
      '--secondary': '40 10% 96%',
      '--secondary-foreground': '220 25% 20%',
      
      // Borders - Nearly invisible
      '--border': '40 10% 92%',
      '--border-hover': '40 10% 85%',
      '--ring': '215 30% 22%',
      '--input': '40 10% 92%',
      
      // Semantic - Muted, sophisticated
      '--semantic-success': '160 40% 45%',
      '--semantic-success-bg': '160 40% 96%',
      '--semantic-success-text': '160 45% 30%',
      '--semantic-info': '210 60% 50%',
      '--semantic-info-bg': '210 60% 96%',
      '--semantic-info-text': '210 65% 35%',
      '--semantic-warning': '38 80% 50%',
      '--semantic-warning-bg': '38 80% 96%',
      '--semantic-warning-text': '38 85% 35%',
      '--semantic-error': '0 65% 50%',
      '--semantic-error-bg': '0 65% 96%',
      '--semantic-error-text': '0 70% 35%',
      '--semantic-purple': '270 50% 55%',
      '--semantic-purple-bg': '270 50% 96%',
      '--semantic-purple-text': '270 55% 38%',
      '--semantic-teal': '175 50% 42%',
      '--semantic-teal-bg': '175 50% 96%',
      '--semantic-teal-text': '175 55% 28%',
      
      // Browser dots
      '--dot-red': '0 55% 65%',
      '--dot-yellow': '45 60% 60%',
      '--dot-green': '145 40% 55%',
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
  // 2. DESIGN SYSTEM
  // Inspired by: Figma, Vercel, Raycast
  // Philosophy: Systematic, consistent, scalable
  // ============================================
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Systematic precision like modern SaaS',
    isDark: false,
    preview: {
      primary: '#6366F1',    // Vibrant indigo
      secondary: '#818CF8',  // Light indigo
      accent: '#F472B6',     // Pink accent
      background: '#FAFAFA'
    },
    cssVariables: {
      // Backgrounds - Crisp with subtle warmth
      '--background': '0 0% 100%',
      '--background-secondary': '240 5% 98%',
      '--foreground': '240 10% 10%',
      
      // Primary - Electric indigo (Figma-inspired)
      '--primary': '239 84% 67%',
      '--primary-foreground': '0 0% 100%',
      '--primary-light': '239 84% 78%',
      '--primary-dark': '239 84% 58%',
      '--primary-darker': '239 84% 48%',
      
      // Accent - Playful pink
      '--accent-surface': '239 70% 97%',
      '--accent-color': '330 81% 70%',
      '--accent-color-foreground': '0 0% 100%',
      
      // Muted & Secondary
      '--muted': '240 5% 96%',
      '--muted-foreground': '240 5% 45%',
      '--secondary': '240 5% 96%',
      '--secondary-foreground': '240 10% 10%',
      
      // Borders - Subtle but present
      '--border': '240 5% 90%',
      '--border-hover': '239 60% 85%',
      '--ring': '239 84% 58%',
      '--input': '240 5% 90%',
      
      // Semantic - Vibrant but balanced
      '--semantic-success': '142 72% 45%',
      '--semantic-success-bg': '142 72% 96%',
      '--semantic-success-text': '142 76% 30%',
      '--semantic-info': '217 91% 60%',
      '--semantic-info-bg': '217 91% 96%',
      '--semantic-info-text': '217 91% 40%',
      '--semantic-warning': '38 92% 55%',
      '--semantic-warning-bg': '38 92% 96%',
      '--semantic-warning-text': '38 92% 35%',
      '--semantic-error': '0 84% 60%',
      '--semantic-error-bg': '0 84% 96%',
      '--semantic-error-text': '0 84% 40%',
      '--semantic-purple': '262 83% 58%',
      '--semantic-purple-bg': '262 83% 96%',
      '--semantic-purple-text': '262 83% 40%',
      '--semantic-teal': '172 66% 50%',
      '--semantic-teal-bg': '172 66% 96%',
      '--semantic-teal-text': '172 66% 32%',
      
      '--dot-red': '0 70% 62%',
      '--dot-yellow': '45 80% 58%',
      '--dot-green': '142 65% 52%',
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
  // 3. NATURALISM
  // Inspired by: Patagonia, Aesop, Kinfolk
  // Philosophy: Organic, earthy, grounded
  // ============================================
  {
    id: 'naturalism',
    name: 'Naturalism',
    description: 'Earthy warmth inspired by nature',
    isDark: false,
    preview: {
      primary: '#4A7C59',    // Forest sage
      secondary: '#8B7355',  // Warm taupe
      accent: '#D4A373',     // Honey gold
      background: '#FFFCF7'
    },
    cssVariables: {
      // Backgrounds - Warm cream paper
      '--background': '40 100% 99%',
      '--background-secondary': '38 50% 96%',
      '--foreground': '30 25% 18%',
      
      // Primary - Deep forest sage
      '--primary': '140 28% 39%',
      '--primary-foreground': '40 100% 99%',
      '--primary-light': '140 25% 55%',
      '--primary-dark': '140 32% 32%',
      '--primary-darker': '140 35% 25%',
      
      // Accent - Warm honey gold
      '--accent-surface': '38 40% 95%',
      '--accent-color': '30 50% 64%',
      '--accent-color-foreground': '30 25% 18%',
      
      // Muted & Secondary
      '--muted': '38 35% 95%',
      '--muted-foreground': '30 15% 45%',
      '--secondary': '30 20% 93%',
      '--secondary-foreground': '30 25% 18%',
      
      // Borders - Warm and soft
      '--border': '38 25% 88%',
      '--border-hover': '140 20% 75%',
      '--ring': '140 32% 32%',
      '--input': '38 25% 90%',
      
      // Semantic - Natural tones
      '--semantic-success': '145 45% 40%',
      '--semantic-success-bg': '145 40% 95%',
      '--semantic-success-text': '145 50% 28%',
      '--semantic-info': '195 50% 45%',
      '--semantic-info-bg': '195 45% 95%',
      '--semantic-info-text': '195 55% 32%',
      '--semantic-warning': '32 70% 50%',
      '--semantic-warning-bg': '32 65% 95%',
      '--semantic-warning-text': '32 75% 35%',
      '--semantic-error': '8 55% 50%',
      '--semantic-error-bg': '8 50% 95%',
      '--semantic-error-text': '8 60% 35%',
      '--semantic-purple': '280 35% 50%',
      '--semantic-purple-bg': '280 30% 95%',
      '--semantic-purple-text': '280 40% 38%',
      '--semantic-teal': '170 40% 42%',
      '--semantic-teal-bg': '170 35% 95%',
      '--semantic-teal-text': '170 45% 30%',
      
      '--dot-red': '8 50% 62%',
      '--dot-yellow': '42 55% 58%',
      '--dot-green': '145 38% 50%',
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
  // 4. LIGHT NEOMORPHISM
  // Inspired by: Apple Big Sur, soft UI trends
  // Philosophy: Tactile, soft, touchable 3D
  // FIXED: White background, not gray
  // ============================================
  {
    id: 'neomorphism',
    name: 'Light Neomorphism',
    description: 'Soft 3D with touchable elegance',
    isDark: false,
    preview: {
      primary: '#6C8EEF',    // Soft periwinkle blue
      secondary: '#A78BFA',  // Soft violet
      accent: '#F9A8D4',     // Soft pink
      background: '#FFFFFF'
    },
    cssVariables: {
      // Backgrounds - CLEAN WHITE (not gray!)
      '--background': '0 0% 100%',
      '--background-secondary': '225 25% 98%',
      '--foreground': '225 20% 22%',
      
      // Primary - Soft periwinkle (friendly, modern)
      '--primary': '227 75% 68%',
      '--primary-foreground': '0 0% 100%',
      '--primary-light': '227 75% 80%',
      '--primary-dark': '227 78% 55%',
      '--primary-darker': '227 80% 45%',
      
      // Accent - Soft blush pink
      '--accent-surface': '227 40% 97%',
      '--accent-color': '326 78% 80%',
      '--accent-color-foreground': '225 20% 22%',
      
      // Muted & Secondary
      '--muted': '225 20% 97%',
      '--muted-foreground': '225 15% 50%',
      '--secondary': '225 20% 97%',
      '--secondary-foreground': '225 20% 22%',
      
      // Borders - Very subtle for neumorphic
      '--border': '225 15% 92%',
      '--border-hover': '227 50% 85%',
      '--ring': '227 78% 55%',
      '--input': '225 15% 95%',
      
      // Semantic - Soft and friendly
      '--semantic-success': '158 55% 52%',
      '--semantic-success-bg': '158 50% 96%',
      '--semantic-success-text': '158 60% 35%',
      '--semantic-info': '217 75% 60%',
      '--semantic-info-bg': '217 70% 96%',
      '--semantic-info-text': '217 80% 42%',
      '--semantic-warning': '42 85% 58%',
      '--semantic-warning-bg': '42 80% 96%',
      '--semantic-warning-text': '42 90% 38%',
      '--semantic-error': '350 70% 60%',
      '--semantic-error-bg': '350 65% 96%',
      '--semantic-error-text': '350 75% 42%',
      '--semantic-purple': '267 75% 65%',
      '--semantic-purple-bg': '267 70% 96%',
      '--semantic-purple-text': '267 80% 45%',
      '--semantic-teal': '175 60% 48%',
      '--semantic-teal-bg': '175 55% 96%',
      '--semantic-teal-text': '175 65% 32%',
      
      '--dot-red': '350 60% 68%',
      '--dot-yellow': '42 70% 62%',
      '--dot-green': '158 50% 55%',
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
  // 5. DIFFUSE GRADIENT
  // Inspired by: Stripe, Linear gradients, Cosmos
  // Philosophy: Ethereal, dreamy, otherworldly
  // ============================================
  {
    id: 'diffuse-gradient',
    name: 'Diffuse Gradient',
    description: 'Dreamy aurora with ethereal glow',
    isDark: false,
    preview: {
      primary: '#8B5CF6',    // Vivid violet
      secondary: '#06B6D4',  // Cyan
      accent: '#F472B6',     // Pink
      background: '#FEFEFF'
    },
    cssVariables: {
      // Backgrounds - Crisp with hint of violet
      '--background': '270 50% 100%',
      '--background-secondary': '270 30% 98%',
      '--foreground': '270 40% 15%',
      
      // Primary - Vivid violet (Stripe-inspired)
      '--primary': '263 70% 66%',
      '--primary-foreground': '0 0% 100%',
      '--primary-light': '263 70% 78%',
      '--primary-dark': '263 75% 54%',
      '--primary-darker': '263 80% 45%',
      
      // Accent - Electric cyan
      '--accent-surface': '263 45% 97%',
      '--accent-color': '186 91% 43%',
      '--accent-color-foreground': '0 0% 100%',
      
      // Muted & Secondary
      '--muted': '270 25% 97%',
      '--muted-foreground': '270 15% 48%',
      '--secondary': '270 25% 97%',
      '--secondary-foreground': '270 40% 15%',
      
      // Borders - Ethereal
      '--border': '270 20% 92%',
      '--border-hover': '263 45% 82%',
      '--ring': '263 75% 54%',
      '--input': '270 20% 94%',
      
      // Semantic - Vibrant but dreamy
      '--semantic-success': '162 70% 45%',
      '--semantic-success-bg': '162 65% 96%',
      '--semantic-success-text': '162 75% 30%',
      '--semantic-info': '195 85% 50%',
      '--semantic-info-bg': '195 80% 96%',
      '--semantic-info-text': '195 90% 32%',
      '--semantic-warning': '45 90% 55%',
      '--semantic-warning-bg': '45 85% 96%',
      '--semantic-warning-text': '45 95% 35%',
      '--semantic-error': '340 75% 58%',
      '--semantic-error-bg': '340 70% 96%',
      '--semantic-error-text': '340 80% 40%',
      '--semantic-purple': '280 75% 60%',
      '--semantic-purple-bg': '280 70% 96%',
      '--semantic-purple-text': '280 80% 42%',
      '--semantic-teal': '175 70% 45%',
      '--semantic-teal-bg': '175 65% 96%',
      '--semantic-teal-text': '175 75% 30%',
      
      '--dot-red': '340 65% 65%',
      '--dot-yellow': '45 75% 60%',
      '--dot-green': '162 60% 52%',
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
  // 6. DOPAMINE
  // Inspired by: Notion, Airtable, Happy colors
  // Philosophy: Joyful, energizing, optimistic
  // ============================================
  {
    id: 'dopamine',
    name: 'Dopamine',
    description: 'Joyful energy that sparks happiness',
    isDark: false,
    preview: {
      primary: '#FF6B6B',    // Coral
      secondary: '#4ECDC4',  // Teal
      accent: '#FFE66D',     // Sunny yellow
      background: '#FFFFFE'
    },
    cssVariables: {
      // Backgrounds - Warm white
      '--background': '60 50% 100%',
      '--background-secondary': '45 40% 98%',
      '--foreground': '215 30% 18%',
      
      // Primary - Energetic coral (not too red)
      '--primary': '0 100% 71%',
      '--primary-foreground': '0 0% 100%',
      '--primary-light': '0 100% 82%',
      '--primary-dark': '0 90% 62%',
      '--primary-darker': '0 85% 52%',
      
      // Accent - Fresh teal
      '--accent-surface': '0 50% 97%',
      '--accent-color': '168 76% 55%',
      '--accent-color-foreground': '0 0% 100%',
      
      // Muted & Secondary
      '--muted': '45 30% 97%',
      '--muted-foreground': '215 20% 48%',
      '--secondary': '45 30% 97%',
      '--secondary-foreground': '215 30% 18%',
      
      // Borders - Warm and playful
      '--border': '45 25% 90%',
      '--border-hover': '0 60% 85%',
      '--ring': '0 90% 62%',
      '--input': '45 25% 92%',
      
      // Semantic - Bright and clear
      '--semantic-success': '168 70% 48%',
      '--semantic-success-bg': '168 65% 95%',
      '--semantic-success-text': '168 75% 32%',
      '--semantic-info': '200 85% 55%',
      '--semantic-info-bg': '200 80% 95%',
      '--semantic-info-text': '200 90% 35%',
      '--semantic-warning': '45 100% 55%',
      '--semantic-warning-bg': '45 95% 94%',
      '--semantic-warning-text': '45 100% 30%',
      '--semantic-error': '0 85% 60%',
      '--semantic-error-bg': '0 80% 95%',
      '--semantic-error-text': '0 90% 40%',
      '--semantic-purple': '270 70% 60%',
      '--semantic-purple-bg': '270 65% 95%',
      '--semantic-purple-text': '270 75% 42%',
      '--semantic-teal': '168 70% 48%',
      '--semantic-teal-bg': '168 65% 95%',
      '--semantic-teal-text': '168 75% 32%',
      
      '--dot-red': '0 85% 68%',
      '--dot-yellow': '45 90% 58%',
      '--dot-green': '168 60% 55%',
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
  // 7. RETRO-FUTURISM
  // Inspired by: Mid-century modern, 60s space age
  // Philosophy: Nostalgic optimism, warm future
  // ============================================
  {
    id: 'retro-futurism',
    name: 'Retro-Futurism',
    description: 'Vintage charm meets modern vision',
    isDark: false,
    preview: {
      primary: '#D56C4E',    // Burnt sienna
      secondary: '#2D4A6F',  // Navy blue
      accent: '#E8B059',     // Mustard gold
      background: '#FFF8F0'
    },
    cssVariables: {
      // Backgrounds - Warm parchment
      '--background': '30 100% 98%',
      '--background-secondary': '32 50% 95%',
      '--foreground': '215 45% 18%',
      
      // Primary - Rich terracotta
      '--primary': '15 62% 57%',
      '--primary-foreground': '30 100% 98%',
      '--primary-light': '15 60% 70%',
      '--primary-dark': '15 65% 48%',
      '--primary-darker': '15 70% 38%',
      
      // Accent - Vintage gold
      '--accent-surface': '32 45% 95%',
      '--accent-color': '40 75% 63%',
      '--accent-color-foreground': '215 45% 18%',
      
      // Muted & Secondary
      '--muted': '32 40% 95%',
      '--muted-foreground': '215 30% 45%',
      '--secondary': '215 42% 36%',
      '--secondary-foreground': '30 100% 98%',
      
      // Borders - Warm sepia
      '--border': '32 30% 88%',
      '--border-hover': '15 40% 78%',
      '--ring': '15 65% 48%',
      '--input': '32 30% 90%',
      
      // Semantic - Vintage tones
      '--semantic-success': '155 50% 42%',
      '--semantic-success-bg': '155 45% 95%',
      '--semantic-success-text': '155 55% 28%',
      '--semantic-info': '205 55% 48%',
      '--semantic-info-bg': '205 50% 95%',
      '--semantic-info-text': '205 60% 32%',
      '--semantic-warning': '40 70% 52%',
      '--semantic-warning-bg': '40 65% 95%',
      '--semantic-warning-text': '40 75% 32%',
      '--semantic-error': '8 60% 52%',
      '--semantic-error-bg': '8 55% 95%',
      '--semantic-error-text': '8 65% 35%',
      '--semantic-purple': '275 45% 52%',
      '--semantic-purple-bg': '275 40% 95%',
      '--semantic-purple-text': '275 50% 38%',
      '--semantic-teal': '175 50% 40%',
      '--semantic-teal-bg': '175 45% 95%',
      '--semantic-teal-text': '175 55% 28%',
      
      '--dot-red': '8 55% 60%',
      '--dot-yellow': '40 65% 55%',
      '--dot-green': '155 45% 48%',
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
  // 8. LINEAR (DARK THEME)
  // Inspired by: Linear app, dark mode excellence
  // Philosophy: Focused, sleek, professional
  // ============================================
  {
    id: 'linear',
    name: 'Linear',
    description: 'Dark and focused like the pros use',
    isDark: true,
    preview: {
      primary: '#5E6AD2',    // Linear purple
      secondary: '#6E79D6',  // Light purple
      accent: '#F2C94C',     // Gold highlight
      background: '#0A0A0A'
    },
    cssVariables: {
      // Backgrounds - True dark (Linear's signature)
      '--background': '0 0% 4%',
      '--background-secondary': '0 0% 8%',
      '--foreground': '0 0% 90%',
      
      // Primary - Linear's signature purple
      '--primary': '235 52% 60%',
      '--primary-foreground': '0 0% 100%',
      '--primary-light': '235 50% 70%',
      '--primary-dark': '235 55% 52%',
      '--primary-darker': '235 60% 42%',
      
      // Accent - Subtle gold
      '--accent-surface': '235 25% 12%',
      '--accent-color': '46 87% 64%',
      '--accent-color-foreground': '0 0% 4%',
      
      // Muted & Secondary
      '--muted': '0 0% 10%',
      '--muted-foreground': '0 0% 55%',
      '--secondary': '0 0% 10%',
      '--secondary-foreground': '0 0% 90%',
      
      // Borders - Subtle but visible
      '--border': '0 0% 15%',
      '--border-hover': '235 30% 30%',
      '--ring': '235 55% 52%',
      '--input': '0 0% 12%',
      
      // Semantic - Muted for dark mode
      '--semantic-success': '145 55% 48%',
      '--semantic-success-bg': '145 40% 12%',
      '--semantic-success-text': '145 60% 70%',
      '--semantic-info': '210 70% 55%',
      '--semantic-info-bg': '210 55% 12%',
      '--semantic-info-text': '210 75% 72%',
      '--semantic-warning': '45 85% 52%',
      '--semantic-warning-bg': '45 70% 12%',
      '--semantic-warning-text': '45 90% 70%',
      '--semantic-error': '0 65% 55%',
      '--semantic-error-bg': '0 50% 12%',
      '--semantic-error-text': '0 70% 72%',
      '--semantic-purple': '263 55% 58%',
      '--semantic-purple-bg': '263 40% 12%',
      '--semantic-purple-text': '263 60% 75%',
      '--semantic-teal': '172 55% 48%',
      '--semantic-teal-bg': '172 40% 12%',
      '--semantic-teal-text': '172 60% 70%',
      
      '--dot-red': '0 50% 55%',
      '--dot-yellow': '45 70% 50%',
      '--dot-green': '145 45% 48%',
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
export function getPresetsByCategory(): { light: ThemePreset[], dark: ThemePreset[] } {
  return {
    light: THEME_PRESETS.filter(p => !p.isDark),
    dark: THEME_PRESETS.filter(p => p.isDark)
  }
}
