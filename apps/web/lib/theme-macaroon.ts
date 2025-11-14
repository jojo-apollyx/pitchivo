/**
 * Premium Macaroon Color Palettes - Auto-switching based on theme
 * 
 * All palettes maintain the exact same soft, dreamy, premium aesthetic
 * as the original purple/pink macaroon design.
 */

export interface MacaroonColors {
  primary: string      // Main soft color
  secondary: string    // Variation 1
  tertiary: string     // Variation 2
  accent: string       // Complementary highlight
  chart1: string       // Chart color 1
  chart2: string       // Chart color 2
}

/**
 * Original Purple/Pink Macaroons (the beloved design!)
 */
const PURPLE_MACAROON: MacaroonColors = {
  primary: '#E9A6F5',    // Soft lavender
  secondary: '#F5A6D0',  // Rose pink
  tertiary: '#C6A6F5',   // Lilac
  accent: '#F5C6A6',     // Peach
  chart1: '#A6D4F5',     // Sky blue
  chart2: '#F5E6A6',     // Lemon
}

/**
 * Blueish Macaroons (same softness as purple)
 */
const BLUE_MACAROON: MacaroonColors = {
  primary: '#A6D4F5',    // Soft sky blue (from original chart!)
  secondary: '#A6E8F5',  // Soft aqua
  tertiary: '#B8E0F7',   // Pale blue
  accent: '#F5C6D4',     // Soft pink (complementary)
  chart1: '#C6E0F5',     // Light blue
  chart2: '#F5D6E6',     // Light rose
}

/**
 * Greenish Macaroons (same softness as purple)
 */
const GREEN_MACAROON: MacaroonColors = {
  primary: '#A6F5D0',    // Soft mint
  secondary: '#C6F5E0',  // Pale mint
  tertiary: '#B8F5D8',   // Light mint
  accent: '#F5D0A6',     // Soft peach (complementary)
  chart1: '#D0F5E8',     // Very light mint
  chart2: '#F5E0C6',     // Light apricot
}

/**
 * Greyish Macaroons (same softness as purple)
 */
const GREY_MACAROON: MacaroonColors = {
  primary: '#D4C8E0',    // Soft lavender-grey
  secondary: '#E0D4E8',  // Pale grey-lavender
  tertiary: '#C8D4E0',   // Soft blue-grey
  accent: '#E8D4C8',     // Soft beige
  chart1: '#E8E0F0',     // Very light lavender
  chart2: '#F0E8D4',     // Light cream
}

/**
 * Yellowish Macaroons (same softness as purple)
 */
const YELLOW_MACAROON: MacaroonColors = {
  primary: '#F5E6A6',    // Soft lemon (from original!)
  secondary: '#F5D6B8',  // Soft cream
  tertiary: '#F5EBC6',   // Pale yellow
  accent: '#D0A6F5',     // Soft lavender (complementary)
  chart1: '#F5F0D0',     // Very light yellow
  chart2: '#E0C6F5',     // Light purple
}

/**
 * Detect color family from hex color
 */
function detectColorFamily(hex: string): 'purple' | 'blue' | 'green' | 'grey' | 'yellow' {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  // Calculate which color is dominant
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  
  // Check if it's greyscale
  if (diff < 30) {
    return 'grey'
  }
  
  // Determine color family
  if (r > g && r > b) {
    // Red family
    if (g > b * 1.3) {
      return 'yellow' // More yellow/orange
    }
    return 'purple' // Could be red or purple, default to purple
  } else if (g > r && g > b) {
    // Green family
    if (b > r * 1.2) {
      return 'blue' // Cyan/teal - closer to blue
    }
    return 'green'
  } else if (b > r && b > g) {
    // Blue family
    if (r > g * 1.2) {
      return 'purple' // Purple/violet
    }
    return 'blue'
  }
  
  // Default fallback
  return 'purple'
}

/**
 * Get macaroon colors based on theme primary color
 * 
 * @param primaryColor - Hex color from organization theme (e.g., '#10B981')
 * @returns MacaroonColors object with soft, premium palette
 */
export function getMacaroonColors(primaryColor: string): MacaroonColors {
  const family = detectColorFamily(primaryColor)
  
  switch (family) {
    case 'blue':
      return BLUE_MACAROON
    case 'green':
      return GREEN_MACAROON
    case 'grey':
      return GREY_MACAROON
    case 'yellow':
      return YELLOW_MACAROON
    case 'purple':
    default:
      return PURPLE_MACAROON
  }
}

/**
 * Get all chart colors as array (useful for recharts)
 */
export function getChartColors(primaryColor: string): string[] {
  const colors = getMacaroonColors(primaryColor)
  return [
    colors.primary,
    colors.secondary,
    colors.tertiary,
    colors.accent,
    colors.chart1,
    colors.chart2,
  ]
}

