/**
 * Brevo Sender Domains Configuration
 * 
 * These are the authenticated sender domains in Brevo that can be used
 * for sending emails. Each domain is configured with DKIM, SPF, and DMARC
 * records to ensure high deliverability.
 * 
 * Usage:
 * - Select a domain when sending emails via admin panel
 * - Different domains can be used for different purposes (news, updates, alerts)
 * - All domains are managed and authenticated in Brevo
 */

export const BREVO_SENDER_DOMAINS = [
  { 
    value: 'news', 
    label: 'news@pitchivo.com', 
    description: 'News and announcements',
    icon: '📰'
  },
  { 
    value: 'updates', 
    label: 'updates@pitchivo.com', 
    description: 'Product updates and features',
    icon: '🔔'
  },
  { 
    value: 'info', 
    label: 'info@pitchivo.com', 
    description: 'General information',
    icon: 'ℹ️'
  },
  { 
    value: 'alerts', 
    label: 'alerts@pitchivo.com', 
    description: 'Important alerts and notifications',
    icon: '⚠️'
  }
] as const;

export type BrevoSenderDomain = typeof BREVO_SENDER_DOMAINS[number]['value'];

/**
 * Get sender email from domain value
 */
export function getSenderEmail(domain: BrevoSenderDomain): string {
  const senderDomain = BREVO_SENDER_DOMAINS.find(d => d.value === domain);
  return senderDomain?.label || BREVO_SENDER_DOMAINS[0].label;
}

/**
 * Get sender domain info by value
 */
export function getSenderDomainInfo(domain: BrevoSenderDomain) {
  return BREVO_SENDER_DOMAINS.find(d => d.value === domain) || BREVO_SENDER_DOMAINS[0];
}

/**
 * Default sender domain
 */
export const DEFAULT_SENDER_DOMAIN: BrevoSenderDomain = 'info';

