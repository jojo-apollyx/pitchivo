/**
 * Access Level Constants
 * User-friendly names and descriptions for access control
 */

export type AccessLevel = 'public' | 'after_click' | 'after_rfq'

export const ACCESS_LEVEL_CONFIG = {
  public: {
    id: 'public' as const,
    userLabel: 'Basic Info',
    shortLabel: 'Basic',
    icon: '👀',
    color: 'blue',
    description: 'See basic product details only',
    tooltip: 'Visible to all visitors browsing your product catalog',
    example: 'Like window shopping - see the basics, need to engage for more',
  },
  after_click: {
    id: 'after_click' as const,
    userLabel: 'More Details',
    shortLabel: 'More',
    icon: '🔗',
    color: 'purple',
    description: 'See pricing, specs, and more info',
    tooltip: 'Visible to recipients of your email campaigns, social posts, QR codes, etc.',
    example: 'See pricing, MOQ, and can submit quote requests',
  },
  after_rfq: {
    id: 'after_rfq' as const,
    userLabel: 'Complete Access',
    shortLabel: 'All',
    icon: '✅',
    color: 'green',
    description: 'See everything + download files',
    tooltip: 'Automatically granted after submitting an RFQ (Request for Quote)',
    example: 'See everything including internal specs and download files',
  },
} as const

export const ACCESS_LEVEL_ORDER: AccessLevel[] = ['public', 'after_click', 'after_rfq']

/**
 * Get user-friendly label for access level
 */
export function getAccessLevelLabel(level: AccessLevel, short: boolean = false): string {
  return short 
    ? ACCESS_LEVEL_CONFIG[level].shortLabel
    : ACCESS_LEVEL_CONFIG[level].userLabel
}

/**
 * Get description for access level
 */
export function getAccessLevelDescription(level: AccessLevel): string {
  return ACCESS_LEVEL_CONFIG[level].description
}

/**
 * Get icon for access level
 */
export function getAccessLevelIcon(level: AccessLevel): string {
  return ACCESS_LEVEL_CONFIG[level].icon
}

/**
 * Channel presets with recommended settings
 */
export interface ChannelPreset {
  id: string
  name: string
  icon: string
  accessLevel: AccessLevel
  expiresInDays: number
  description: string
  category: 'marketing' | 'event' | 'social'
}

export const CHANNEL_PRESETS: ChannelPreset[] = [
  {
    id: 'email_campaign',
    name: 'Email Campaign',
    icon: '📧',
    accessLevel: 'after_click',
    expiresInDays: 90,
    description: 'For email marketing campaigns',
    category: 'marketing',
  },
  {
    id: 'linkedin_post',
    name: 'LinkedIn Post',
    icon: '💼',
    accessLevel: 'after_click',
    expiresInDays: 90,
    description: 'Share on LinkedIn',
    category: 'social',
  },
  {
    id: 'trade_show_qr',
    name: 'Trade Show QR',
    icon: '🎪',
    accessLevel: 'after_click',
    expiresInDays: 14,
    description: 'QR code for events/expos',
    category: 'event',
  },
  {
    id: 'twitter_post',
    name: 'Twitter/X Post',
    icon: '🐦',
    accessLevel: 'after_click',
    expiresInDays: 90,
    description: 'Share on Twitter/X',
    category: 'social',
  },
  {
    id: 'facebook_post',
    name: 'Facebook Post',
    icon: '📘',
    accessLevel: 'after_click',
    expiresInDays: 90,
    description: 'Share on Facebook',
    category: 'social',
  },
  {
    id: 'partner_link',
    name: 'Partner/Distributor',
    icon: '🤝',
    accessLevel: 'after_click',
    expiresInDays: 365,
    description: 'Long-term partner access',
    category: 'marketing',
  },
]

