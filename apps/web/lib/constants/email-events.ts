// Brevo Email Event Types and Definitions

export const EMAIL_EVENT_TYPES = {
  // Primary events
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  
  // Bounce events
  SOFT_BOUNCED: 'soft_bounced',
  HARD_BOUNCED: 'hard_bounced',
  BLOCKED: 'blocked',
  INVALID: 'invalid',
  
  // Engagement events
  UNIQUE_OPENED: 'unique_opened',
  FIRST_OPENING: 'first_opening',
  LOADED_BY_PROXY: 'loaded_by_proxy',
  
  // Negative events
  COMPLAINT: 'complaint',
  UNSUBSCRIBED: 'unsubscribed',
  
  // System events
  DEFERRED: 'deferred',
  ERROR: 'error',
} as const

export type EmailEventType = typeof EMAIL_EVENT_TYPES[keyof typeof EMAIL_EVENT_TYPES]

export interface EmailEventDefinition {
  label: string
  description: string
  category: 'success' | 'warning' | 'error' | 'info'
  icon: string
  isCommonForUser: boolean // Show to regular users
  priority: number // Higher = more important
}

export const EMAIL_EVENT_DEFINITIONS: Record<EmailEventType, EmailEventDefinition> = {
  // Primary events (show to users)
  [EMAIL_EVENT_TYPES.SENT]: {
    label: 'Sent',
    description: 'Email was successfully sent from the server and accepted by the receiving server.',
    category: 'info',
    icon: '📤',
    isCommonForUser: true,
    priority: 10
  },
  
  [EMAIL_EVENT_TYPES.DELIVERED]: {
    label: 'Delivered',
    description: 'Email was successfully delivered to the recipient\'s mail server and accepted for delivery to their inbox.',
    category: 'success',
    icon: '✅',
    isCommonForUser: true,
    priority: 20
  },
  
  [EMAIL_EVENT_TYPES.OPENED]: {
    label: 'Opened',
    description: 'Recipient opened the email. This is tracked when images are loaded in the email.',
    category: 'success',
    icon: '👁️',
    isCommonForUser: true,
    priority: 30
  },
  
  [EMAIL_EVENT_TYPES.CLICKED]: {
    label: 'Clicked',
    description: 'Recipient clicked on a link in the email, showing strong engagement.',
    category: 'success',
    icon: '🖱️',
    isCommonForUser: true,
    priority: 40
  },
  
  // Bounce events (show important ones to users)
  [EMAIL_EVENT_TYPES.SOFT_BOUNCED]: {
    label: 'Soft Bounced',
    description: 'Email temporarily bounced due to a temporary issue (e.g., full mailbox, server temporarily unavailable). Will retry delivery.',
    category: 'warning',
    icon: '⚠️',
    isCommonForUser: false,
    priority: 50
  },
  
  [EMAIL_EVENT_TYPES.HARD_BOUNCED]: {
    label: 'Hard Bounced',
    description: 'Email permanently bounced because the email address doesn\'t exist or the domain is invalid. Email will not be retried.',
    category: 'error',
    icon: '❌',
    isCommonForUser: true,
    priority: 60
  },
  
  [EMAIL_EVENT_TYPES.BLOCKED]: {
    label: 'Blocked',
    description: 'Email was blocked by the recipient\'s email provider or spam filter. May indicate sender reputation issues.',
    category: 'error',
    icon: '🚫',
    isCommonForUser: true,
    priority: 55
  },
  
  [EMAIL_EVENT_TYPES.INVALID]: {
    label: 'Invalid Email',
    description: 'Email address is malformed or invalid. Check the email format.',
    category: 'error',
    icon: '⚠️',
    isCommonForUser: false,
    priority: 52
  },
  
  // Engagement events (admin only - detailed tracking)
  [EMAIL_EVENT_TYPES.UNIQUE_OPENED]: {
    label: 'Unique Opened',
    description: 'First time this recipient opened the email. Subsequent opens are not counted as unique.',
    category: 'info',
    icon: '🎯',
    isCommonForUser: false,
    priority: 31
  },
  
  [EMAIL_EVENT_TYPES.FIRST_OPENING]: {
    label: 'First Opening',
    description: 'The very first time the email was opened by this recipient. Used for engagement timing analysis.',
    category: 'info',
    icon: '🥇',
    isCommonForUser: false,
    priority: 32
  },
  
  [EMAIL_EVENT_TYPES.LOADED_BY_PROXY]: {
    label: 'Loaded by Proxy',
    description: 'Email was loaded by a privacy proxy (e.g., Apple Mail Privacy Protection) which may not reflect actual user engagement.',
    category: 'info',
    icon: '🔒',
    isCommonForUser: false,
    priority: 25
  },
  
  // Negative events (show to users)
  [EMAIL_EVENT_TYPES.COMPLAINT]: {
    label: 'Spam Complaint',
    description: 'Recipient marked the email as spam. This seriously affects sender reputation and should be avoided.',
    category: 'error',
    icon: '🚨',
    isCommonForUser: true,
    priority: 70
  },
  
  [EMAIL_EVENT_TYPES.UNSUBSCRIBED]: {
    label: 'Unsubscribed',
    description: 'Recipient clicked the unsubscribe link. They should not receive future emails.',
    category: 'warning',
    icon: '📭',
    isCommonForUser: true,
    priority: 65
  },
  
  // System events (admin only)
  [EMAIL_EVENT_TYPES.DEFERRED]: {
    label: 'Deferred',
    description: 'Email delivery was temporarily delayed by the receiving server. Brevo will continue attempting delivery.',
    category: 'warning',
    icon: '⏳',
    isCommonForUser: false,
    priority: 15
  },
  
  [EMAIL_EVENT_TYPES.ERROR]: {
    label: 'Error',
    description: 'An error occurred during email processing or delivery. Check error details for specific information.',
    category: 'error',
    icon: '❗',
    isCommonForUser: false,
    priority: 58
  },
}

// Helper to get events for user view (common events only)
export function getUserVisibleEvents(): EmailEventType[] {
  return Object.entries(EMAIL_EVENT_DEFINITIONS)
    .filter(([_, def]) => def.isCommonForUser)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([type]) => type as EmailEventType)
}

// Helper to get all events for admin view
export function getAllEvents(): EmailEventType[] {
  return Object.entries(EMAIL_EVENT_DEFINITIONS)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([type]) => type as EmailEventType)
}

// Map Brevo webhook event names to our event types
export const BREVO_EVENT_MAP: Record<string, EmailEventType> = {
  'request': EMAIL_EVENT_TYPES.SENT,
  'delivered': EMAIL_EVENT_TYPES.DELIVERED,
  'opened': EMAIL_EVENT_TYPES.OPENED,
  'click': EMAIL_EVENT_TYPES.CLICKED,
  'clicks': EMAIL_EVENT_TYPES.CLICKED,
  'soft_bounce': EMAIL_EVENT_TYPES.SOFT_BOUNCED,
  'hard_bounce': EMAIL_EVENT_TYPES.HARD_BOUNCED,
  'blocked': EMAIL_EVENT_TYPES.BLOCKED,
  'invalid_email': EMAIL_EVENT_TYPES.INVALID,
  'unique_opened': EMAIL_EVENT_TYPES.UNIQUE_OPENED,
  'first_open': EMAIL_EVENT_TYPES.FIRST_OPENING,
  'proxy': EMAIL_EVENT_TYPES.LOADED_BY_PROXY,
  'complaint': EMAIL_EVENT_TYPES.COMPLAINT,
  'spam': EMAIL_EVENT_TYPES.COMPLAINT,
  'unsubscribe': EMAIL_EVENT_TYPES.UNSUBSCRIBED,
  'unsubscribed': EMAIL_EVENT_TYPES.UNSUBSCRIBED,
  'deferred': EMAIL_EVENT_TYPES.DEFERRED,
  'error': EMAIL_EVENT_TYPES.ERROR,
}

// Get color classes for each category
export function getEventCategoryColor(category: EmailEventDefinition['category']): string {
  switch (category) {
    case 'success':
      return 'bg-green-100 text-green-700 border-green-300'
    case 'warning':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'error':
      return 'bg-red-100 text-red-700 border-red-300'
    case 'info':
      return 'bg-blue-100 text-blue-700 border-blue-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

