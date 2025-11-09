/**
 * Theme color utilities
 * Complete color scheme system with primary, secondary, and accent colors
 */

/**
 * Color scheme interface
 */
export interface ColorScheme {
  name: string
  primary: string
  secondary: string
  accent: string
  description: string
  category: 'Vibrant' | 'Tranquil' | 'Playful' | 'Neutral' | 'Romantic'
}

/**
 * Professional color schemes with proper complementary accents
 * Primary: Main brand color (buttons, CTAs, active states)
 * Secondary: Darker shade of primary (hover states)
 * Accent: Complementary color (notifications, badges, highlights, important info)
 * 
 * Following Figma's color theory: https://www.figma.com/resource-library/color-combinations/
 */
export const COLOR_SCHEMES: ColorScheme[] = [
  // Vibrant - Bold, confident, attention-grabbing
  {
    name: 'Emerald Spark',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F87171', // Red - complementary to green
    description: 'Fresh emerald with coral red accents for energy and action',
    category: 'Vibrant',
  },
  {
    name: 'Ocean Energy',
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#FB923C', // Orange - complementary to blue
    description: 'Professional blue with warm orange highlights',
    category: 'Vibrant',
  },
  {
    name: 'Royal Violet',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#FBBF24', // Yellow - complementary to purple
    description: 'Creative purple with golden accents for luxury',
    category: 'Vibrant',
  },
  {
    name: 'Indigo Night',
    primary: '#6366F1',
    secondary: '#4F46E5',
    accent: '#FB7185', // Coral - complementary to indigo
    description: 'Professional indigo with coral highlights (Vercel-inspired)',
    category: 'Vibrant',
  },
  
  // Tranquil - Calm, peaceful, soothing
  {
    name: 'Forest Calm',
    primary: '#16A34A',
    secondary: '#15803D',
    accent: '#E8B298', // Peach - soft complementary
    description: 'Natural green with soft peach accents for warmth',
    category: 'Tranquil',
  },
  {
    name: 'Coastal Morning',
    primary: '#0891B2',
    secondary: '#0E7490',
    accent: '#FCD34D', // Soft yellow - complementary warmth
    description: 'Calm teal with gentle yellow highlights',
    category: 'Tranquil',
  },
  {
    name: 'Lavender Fields',
    primary: '#A78BFA',
    secondary: '#9333EA',
    accent: '#BEF264', // Lime green - fresh complement
    description: 'Serene lavender with fresh green accents',
    category: 'Tranquil',
  },
  
  // Playful - Friendly, approachable, energetic
  {
    name: 'Sunset Glow',
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#60A5FA', // Blue - playful complement
    description: 'Warm amber with cool blue accents for balance',
    category: 'Playful',
  },
  {
    name: 'Cherry Blossom',
    primary: '#F43F5E',
    secondary: '#E11D48',
    accent: '#34D399', // Mint green - fresh complement
    description: 'Bold rose with mint accents for playful contrast',
    category: 'Playful',
  },
  
  // Neutral - Sophisticated, elegant, timeless
  {
    name: 'Professional Slate',
    primary: '#64748B',
    secondary: '#475569',
    accent: '#F97316', // Orange - warm accent
    description: 'Sophisticated slate with warm orange highlights',
    category: 'Neutral',
  },
  {
    name: 'Midnight Black',
    primary: '#1F2937',
    secondary: '#111827',
    accent: '#60A5FA', // Blue - professional accent
    description: 'Premium black with blue accents for luxury brands',
    category: 'Neutral',
  },
  {
    name: 'Light Minimalist',
    primary: '#9CA3AF',
    secondary: '#6B7280',
    accent: '#10B981', // Green - fresh accent
    description: 'Clean gray with emerald accents for minimalist brands',
    category: 'Neutral',
  },
  {
    name: 'Corporate Gray',
    primary: '#6B7280',
    secondary: '#4B5563',
    accent: '#3B82F6', // Blue - trust accent
    description: 'Professional gray with blue accents for corporate identity',
    category: 'Neutral',
  },
  {
    name: 'Charcoal Elite',
    primary: '#374151',
    secondary: '#1F2937',
    accent: '#FBBF24', // Gold - premium accent
    description: 'Dark charcoal with gold accents for premium services',
    category: 'Neutral',
  },
]

/**
 * Convert hex color to HSL
 * @param hex - Hex color string (e.g., "#10B981")
 * @returns HSL values as string (e.g., "160 84% 39%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  const lightness = Math.round(l * 100)
  
  return `${h} ${s}% ${lightness}%`
}

/**
 * Generate lighter variant of HSL color
 * @param hsl - HSL string (e.g., "126 61% 80%")
 * @param amount - Lightness increase (0-100)
 * @returns Lighter HSL string
 */
export function lightenHsl(hsl: string, amount: number = 10): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return hsl
  
  const [, h, s, l] = match
  const newLightness = Math.min(100, parseInt(l) + amount)
  
  return `${h} ${s}% ${newLightness}%`
}

/**
 * Generate darker variant of HSL color
 * @param hsl - HSL string (e.g., "126 61% 80%")
 * @param amount - Lightness decrease (0-100)
 * @returns Darker HSL string
 */
export function darkenHsl(hsl: string, amount: number = 10): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return hsl
  
  const [, h, s, l] = match
  const newLightness = Math.max(0, parseInt(l) - amount)
  
  return `${h} ${s}% ${newLightness}%`
}

/**
 * Calculate luminance from hex color to determine if it's light or dark
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Apply color scheme to the document following design best practices
 * 
 * Color Usage Guide:
 * PRIMARY: Main brand identity
 *   - Use for: Primary buttons, CTAs, links, active navigation, form focus states
 *   - Text: White on dark colors, dark on light colors (auto-calculated)
 * 
 * SECONDARY: Hover and pressed states
 *   - Use for: Button hover states, darker variations
 *   - Automatically applied via --primary-dark
 * 
 * ACCENT: Complementary highlights (use sparingly!)
 *   - Use for: Notifications, badges, alerts, important icons, success messages
 *   - Avoid for: Large backgrounds, primary actions
 * 
 * @param scheme - Color scheme object with primary, secondary, and accent colors
 */
export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Convert colors to HSL
  const primaryHsl = hexToHsl(scheme.primary)
  const secondaryHsl = hexToHsl(scheme.secondary)
  const accentHsl = hexToHsl(scheme.accent)
  
  // Determine foreground color based on luminance
  const primaryLuminance = getLuminance(scheme.primary)
  const accentLuminance = getLuminance(scheme.accent)
  const primaryForeground = primaryLuminance > 0.6 ? '0 0% 10%' : '0 0% 100%' // Dark or white text
  const accentForeground = accentLuminance > 0.6 ? '0 0% 10%' : '0 0% 100%'
  
  // PRIMARY: Main brand color
  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-foreground', primaryForeground)
  root.style.setProperty('--primary-light', lightenHsl(primaryHsl, 10))
  root.style.setProperty('--primary-dark', secondaryHsl) // Hover state
  root.style.setProperty('--primary-darker', darkenHsl(secondaryHsl, 10))
  
  // ACCENT: Complementary color for highlights
  // Use for notifications, badges, important info, success states
  root.style.setProperty('--accent', lightenHsl(accentHsl, 5))
  root.style.setProperty('--accent-foreground', accentForeground)
  root.style.setProperty('--accent-color', accentHsl)
  root.style.setProperty('--accent-light', lightenHsl(accentHsl, 15))
  root.style.setProperty('--accent-dark', darkenHsl(accentHsl, 10))
  
  // Secondary (internal use only)
  root.style.setProperty('--secondary', secondaryHsl)
  root.style.setProperty('--secondary-light', lightenHsl(secondaryHsl, 10))
  root.style.setProperty('--secondary-dark', darkenHsl(secondaryHsl, 10))
  
  // Focus ring
  root.style.setProperty('--ring', primaryHsl)
  
  // Chart colors - primary dominant with accent highlights
  root.style.setProperty('--chart-1', primaryHsl)
  root.style.setProperty('--chart-2', accentHsl)
  root.style.setProperty('--chart-3', lightenHsl(primaryHsl, 15))
  root.style.setProperty('--chart-4', darkenHsl(primaryHsl, 15))
  root.style.setProperty('--chart-5', lightenHsl(accentHsl, 15))
}

/**
 * Legacy function to apply single theme color (backward compatibility)
 * @param themeColor - Hex color string (e.g., "#10B981")
 */
export function applyThemeColor(themeColor: string): void {
  // Convert single color to a scheme
  const hsl = hexToHsl(themeColor)
  const scheme: ColorScheme = {
    name: 'Custom',
    primary: themeColor,
    secondary: `#${hslToHex(lightenHsl(hsl, 15))}`,
    accent: `#${hslToHex(lightenHsl(hsl, 30))}`,
    description: 'Custom theme color',
    category: 'Neutral',
  }
  applyColorScheme(scheme)
}

/**
 * Convert HSL to hex (helper for legacy support)
 * @param hsl - HSL string (e.g., "160 84% 39%")
 * @returns Hex color without # prefix
 */
function hslToHex(hsl: string): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return '000000'
  
  const [, h, s, l] = match.map(Number)
  const hDecimal = h / 360
  const sDecimal = s / 100
  const lDecimal = l / 100
  
  let r, g, b
  if (s === 0) {
    r = g = b = lDecimal
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal
    const p = 2 * lDecimal - q
    r = hue2rgb(p, q, hDecimal + 1/3)
    g = hue2rgb(p, q, hDecimal)
    b = hue2rgb(p, q, hDecimal - 1/3)
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return toHex(r) + toHex(g) + toHex(b)
}

/**
 * Reset theme to default color scheme
 */
export function resetThemeColor(): void {
  if (typeof window === 'undefined') return
  
  // Apply default "Emerald Spark" scheme
  applyColorScheme(COLOR_SCHEMES[0])
}

