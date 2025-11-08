/**
 * Theme color utilities
 * Converts hex colors to HSL and applies them dynamically
 */

/**
 * Convert hex color to HSL
 * @param hex - Hex color string (e.g., "#ADEBB3")
 * @returns HSL values as string (e.g., "126 61% 80%")
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
 * Apply organization theme color to the document
 * @param themeColor - Hex color string (e.g., "#ADEBB3")
 */
export function applyThemeColor(themeColor: string): void {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  const hsl = hexToHsl(themeColor)
  
  // Apply primary color
  root.style.setProperty('--primary', hsl)
  
  // Apply primary variants
  root.style.setProperty('--primary-light', lightenHsl(hsl, 10))
  root.style.setProperty('--primary-dark', darkenHsl(hsl, 10))
  root.style.setProperty('--primary-darker', darkenHsl(hsl, 20))
  
  // Apply accent color (same as primary)
  root.style.setProperty('--accent-color', hsl)
  
  // Apply ring color
  root.style.setProperty('--ring', hsl)
  
  // Apply chart colors
  root.style.setProperty('--chart-1', hsl)
  root.style.setProperty('--chart-2', lightenHsl(hsl, 10))
  root.style.setProperty('--chart-3', darkenHsl(hsl, 10))
  root.style.setProperty('--chart-4', darkenHsl(hsl, 20))
}

/**
 * Reset theme color to default
 */
export function resetThemeColor(): void {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Reset to default #ADEBB3
  root.style.setProperty('--primary', '126 61% 80%')
  root.style.setProperty('--primary-light', '126 61% 90%')
  root.style.setProperty('--primary-dark', '126 61% 70%')
  root.style.setProperty('--primary-darker', '126 61% 60%')
  root.style.setProperty('--accent-color', '126 61% 80%')
  root.style.setProperty('--ring', '126 61% 80%')
  root.style.setProperty('--chart-1', '126 61% 80%')
  root.style.setProperty('--chart-2', '126 61% 90%')
  root.style.setProperty('--chart-3', '126 61% 70%')
  root.style.setProperty('--chart-4', '126 61% 60%')
}

