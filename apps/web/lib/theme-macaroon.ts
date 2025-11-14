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
 * Detect color family from hex color based on overall feeling
 */
function detectColorFamily(hex: string): 'purple' | 'blue' | 'green' | 'grey' | 'yellow' {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  // Calculate HSL for better color family detection
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const diff = max - min
  
  const lightness = (max + min) / 2
  const saturation = diff === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1))
  
  // Low saturation = grey
  if (saturation < 0.2) {
    return 'grey'
  }
  
  // Calculate hue
  let hue = 0
  if (diff !== 0) {
    if (max === rNorm) {
      hue = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6
    } else if (max === gNorm) {
      hue = ((bNorm - rNorm) / diff + 2) / 6
    } else {
      hue = ((rNorm - gNorm) / diff + 4) / 6
    }
  }
  
  // Convert hue to degrees
  const hueDeg = hue * 360
  
  // Map hue ranges to color families (based on color wheel feeling)
  if (hueDeg >= 45 && hueDeg < 150) {
    // Green/Yellow-Green range
    return hueDeg < 75 ? 'yellow' : 'green'
  } else if (hueDeg >= 150 && hueDeg < 260) {
    // Cyan/Blue range - Ocean Energy is here!
    return 'blue'
  } else if (hueDeg >= 260 && hueDeg < 330) {
    // Purple/Violet range
    return 'purple'
  } else {
    // Red/Orange range (0-45, 330-360)
    return hueDeg < 25 || hueDeg >= 345 ? 'purple' : 'yellow'
  }
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

