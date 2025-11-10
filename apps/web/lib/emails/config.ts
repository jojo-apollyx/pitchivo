/**
 * Email Configuration
 * 
 * IMPORTANT: Spam Prevention First Principle
 * 
 * All email configurations prioritize avoiding spam filters:
 * 1. Use proper sender name and email (NOT noreply - use team@domain)
 * 2. Ensure proper SPF, DKIM, DMARC records are set up
 * 3. Maintain good text-to-HTML ratio (at least 30% text)
 * 4. Avoid spam trigger words and excessive punctuation
 * 5. Include proper unsubscribe mechanisms
 * 6. Use proper email headers
 * 7. Include physical address (CAN-SPAM requirement)
 */

// Default sender configuration
// IMPORTANT: Use "team@" instead of "noreply@" to improve deliverability
// "noreply" addresses are often flagged as spam by email providers
export const EMAIL_CONFIG = {
  // Default sender email - should be team@yourdomain.com
  // This must match the verified sender in Brevo
  defaultSenderEmail: process.env.BREVO_SENDER_EMAIL || 'team@pitchivo.com',
  defaultSenderName: process.env.BREVO_SENDER_NAME || 'Pitchivo Team',
  
  // Reply-to email (users can reply to this)
  defaultReplyTo: process.env.EMAIL_REPLY_TO || 'support@pitchivo.com',
  defaultReplyToName: process.env.EMAIL_REPLY_TO_NAME || 'Pitchivo Support',
  
  // Site URL for links in emails
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com',
  
  // Email subdomains for promotional emails
  // These subdomains are authenticated in Brevo and can be used for different email types
  emailSubdomains: {
    // For news and announcements
    news: 'news.pitchivo.com',
    // For product updates and feature releases
    updates: 'updates.pitchivo.com',
    // For informational emails
    info: 'info.pitchivo.com',
    // For general marketing emails
    mail: 'mail.pitchivo.com',
  },
  
  // Physical address (required by CAN-SPAM Act)
  // Update this with your actual business address
  physicalAddress: {
    company: 'Pitchivo',
    address: '4539 N 22ND ST, STE N',
    city: 'PHOENIX',
    state: 'AZ',
    zip: '85016',
    country: 'United States',
  },
  
  // Spam prevention settings
  spamPrevention: {
    // Minimum text-to-HTML ratio (0.3 = 30% text content)
    minTextToHtmlRatio: 0.3,
    
    // Maximum number of links per email
    maxLinks: 5,
    
    // Avoid these words in subject lines (common spam triggers)
    spamTriggerWords: [
      'free', 'guarantee', 'no risk', 'act now', 'limited time',
      'urgent', 'click here', 'buy now', 'winner', 'congratulations',
      'cash', 'prize', 'winner', 'selected', 'winner',
    ],
  },
} as const

/**
 * Get sender configuration with spam-prevention defaults
 */
export function getSenderConfig(overrides?: {
  email?: string
  name?: string
}): {
  email: string
  name: string
} {
  return {
    email: overrides?.email || EMAIL_CONFIG.defaultSenderEmail,
    name: overrides?.name || EMAIL_CONFIG.defaultSenderName,
  }
}

/**
 * Get reply-to configuration
 */
export function getReplyToConfig(overrides?: {
  email?: string
  name?: string
}): {
  email: string
  name: string
} {
  return {
    email: overrides?.email || EMAIL_CONFIG.defaultReplyTo,
    name: overrides?.name || EMAIL_CONFIG.defaultReplyToName,
  }
}

/**
 * Format physical address for email footer (CAN-SPAM requirement)
 */
export function getPhysicalAddressFooter(): string {
  const { company, address, city, state, zip, country } = EMAIL_CONFIG.physicalAddress
  return `${company}\n${address}\n${city}, ${state} ${zip}\n${country}`
}

/**
 * Get email subdomain configuration
 * Use different subdomains for different email types to improve deliverability
 */
export function getEmailSubdomain(type: 'news' | 'updates' | 'info' | 'mail'): string {
  return EMAIL_CONFIG.emailSubdomains[type]
}

/**
 * Get sender email for promotional emails using subdomains
 * Example: team@news.pitchivo.com
 */
export function getPromotionalSenderEmail(
  subdomainType: 'news' | 'updates' | 'info' | 'mail',
  localPart: string = 'team'
): string {
  const subdomain = getEmailSubdomain(subdomainType)
  return `${localPart}@${subdomain}`
}

