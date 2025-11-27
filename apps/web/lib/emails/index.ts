/**
 * Email Module
 * 
 * Main entry point for sending emails
 * All emails use spam-prevention best practices
 */

import { sendEmail, type SendEmailOptions, type SendEmailResponse } from '../email'
import { 
  getSenderConfig, 
  getReplyToConfig, 
  getEmailSubdomain, 
  getPromotionalSenderEmail 
} from './config'
import { validateEmailContent, createSafeSubjectLine } from './utils'

// Client email templates
import { createWaitlistConfirmationEmail } from './templates/client/waitlist-confirmation'
import { createWelcomeEmail } from './templates/client/welcome'
import { createOrganizationSetupEmail } from './templates/client/organization-setup'
import { createInvitationEmail } from './templates/client/invitation'

// Admin email templates
import { createWaitlistAdminNotificationEmail } from './templates/admin/waitlist-notification'

// Merchant/Product Owner email templates
import { createRfqNotificationEmail } from './templates/merchant/rfq-notification'

// Re-export template creators for external use
export { createWaitlistConfirmationEmail } from './templates/client/waitlist-confirmation'
export { createWelcomeEmail } from './templates/client/welcome'
export { createOrganizationSetupEmail } from './templates/client/organization-setup'
export { createInvitationEmail } from './templates/client/invitation'
export { createWaitlistAdminNotificationEmail } from './templates/admin/waitlist-notification'
export { createRfqNotificationEmail } from './templates/merchant/rfq-notification'

/**
 * Send email with spam-prevention validation and defaults
 */
export async function sendEmailWithDefaults(
  options: Omit<SendEmailOptions, 'sender' | 'replyTo'> & {
    sender?: { email?: string; name?: string }
    replyTo?: { email?: string; name?: string }
  }
): Promise<SendEmailResponse> {
  // Get sender and reply-to configs
  const sender = getSenderConfig(options.sender)
  const replyTo = getReplyToConfig(options.replyTo)

  // Create safe subject line
  const safeSubject = createSafeSubjectLine(options.subject)

  // Validate email content (warnings only, don't block)
  if (options.htmlContent && options.textContent) {
    const warnings = validateEmailContent({
      subject: safeSubject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
    })
    
    if (warnings.length > 0) {
      console.warn('📧 Email validation warnings:', warnings)
    }
  }

  // Send email with proper sender and reply-to
  return sendEmail({
    ...options,
    subject: safeSubject,
    sender: {
      email: sender.email,
      name: sender.name,
    },
    replyTo: {
      email: replyTo.email,
      name: replyTo.name,
    },
  })
}

/**
 * Send waitlist confirmation email (client)
 * Uses API route for proper tracking
 */
export async function sendWaitlistConfirmationEmail(data: {
  to: string
  fullName: string
  company: string
}): Promise<SendEmailResponse> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
  
  try {
    const response = await fetch(`${baseUrl}/api/emails/waitlist-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send waitlist confirmation email',
      }
    }

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send waitlist confirmation email',
    }
  }
}

/**
 * Send welcome email (client)
 * Uses API route for proper tracking
 */
export async function sendWelcomeEmail(data: {
  to: string
  userName: string
  companyName?: string
}): Promise<SendEmailResponse> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
  
  try {
    const response = await fetch(`${baseUrl}/api/emails/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send welcome email',
      }
    }

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email',
    }
  }
}

/**
 * Send organization setup email (client)
 * Uses API route for proper tracking
 */
export async function sendOrganizationSetupEmail(data: {
  to: string
  userName: string
  companyName: string
}): Promise<SendEmailResponse> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
  
  try {
    const response = await fetch(`${baseUrl}/api/emails/organization-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send organization setup email',
      }
    }

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send organization setup email',
    }
  }
}

/**
 * Send invitation email (client)
 * Note: Users sign in using magic links on the landing page, not a separate signup page
 * 
 * This now uses the API route to ensure proper tracking and webhook matching.
 */
export async function sendInvitationEmail(data: {
  to: string
  fullName: string
  company: string
}): Promise<SendEmailResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables are not set')
    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  console.log('📧 Sending invitation email:', {
    to: data.to,
    fullName: data.fullName,
    company: data.company,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com',
    timestamp: new Date().toISOString(),
  })

  try {
    // Get the base URL for API calls
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
    
    // Call API route for sending invitation emails with tracking
    const response = await fetch(`${baseUrl}/api/emails/invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        to: data.to,
        fullName: data.fullName,
        company: data.company,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to send invitation email:', result.error)
      return {
        success: false,
        error: result.error || 'Failed to send invitation email',
      }
    }

    console.log('✅ Invitation email sent successfully:', {
      to: data.to,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error('❌ Error sending invitation email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invitation email',
    }
  }
}

/**
 * Send waitlist admin notification email (admin)
 * Uses API route for proper tracking
 */
export async function sendWaitlistAdminNotification(data: {
  adminEmails: string | string[]
  waitlistEntry: {
    email: string
    fullName: string
    company: string
    role?: string
    note?: string
  }
}): Promise<SendEmailResponse> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
  
  try {
    const response = await fetch(`${baseUrl}/api/emails/waitlist-admin-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send waitlist admin notification email',
      }
    }

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send waitlist admin notification email',
    }
  }
}

/**
 * Send RFQ notification email to product owners
 * Note: This is typically called from server-side API routes, so it uses sendTrackedEmail directly
 */
export async function sendRfqNotificationEmail(data: {
  to: string | string[]
  productName: string
  rfq: {
    name: string
    email: string
    company: string
    phone?: string
    message: string
    quantity?: string
    targetDate?: string
  }
  productUrl: string
  dashboardUrl: string
  industryCode?: string
}): Promise<SendEmailResponse> {
  const template = createRfqNotificationEmail({
    productName: data.productName,
    rfq: data.rfq,
    productUrl: data.productUrl,
    dashboardUrl: data.dashboardUrl,
    industryCode: data.industryCode,
  })

  // Use tracked email service for proper tracking
  // This function is called from server-side API routes, so we can use sendTrackedEmail directly
  const { sendTrackedEmail } = await import('./tracking')
  
  // Handle multiple recipients
  const recipients = Array.isArray(data.to) ? data.to : [data.to]
  const results = await Promise.all(
    recipients.map(recipient =>
      sendTrackedEmail({
        to: recipient,
        subject: template.subject,
        htmlContent: template.html,
        textContent: template.text,
        emailType: 'rfq_notification',
        recipientName: recipient.split('@')[0],
      })
    )
  )

  // Return success if at least one email was sent successfully
  const success = results.some(r => r.success)
  const firstResult = results[0]

  return {
    success,
    messageId: firstResult?.messageId,
    error: success ? undefined : firstResult?.error || 'Failed to send RFQ notification email',
  }
}

// Export subdomain utilities for promotional emails
export { getEmailSubdomain, getPromotionalSenderEmail } from './config'

// Note: Organization utilities are NOT exported here because they use server-side Supabase client
// Import them directly from './utils/organization' in server-side code only (API routes, server components)

