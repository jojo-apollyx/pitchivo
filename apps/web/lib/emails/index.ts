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

// Re-export template creators for external use
export { createWaitlistConfirmationEmail } from './templates/client/waitlist-confirmation'
export { createWelcomeEmail } from './templates/client/welcome'
export { createOrganizationSetupEmail } from './templates/client/organization-setup'
export { createInvitationEmail } from './templates/client/invitation'
export { createWaitlistAdminNotificationEmail } from './templates/admin/waitlist-notification'

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
 */
export async function sendWaitlistConfirmationEmail(data: {
  to: string
  fullName: string
  company: string
}): Promise<SendEmailResponse> {
  const template = createWaitlistConfirmationEmail({
    fullName: data.fullName,
    company: data.company,
  })

  return sendEmailWithDefaults({
    to: data.to,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })
}

/**
 * Send welcome email (client)
 */
export async function sendWelcomeEmail(data: {
  to: string
  userName: string
  companyName?: string
}): Promise<SendEmailResponse> {
  const template = createWelcomeEmail({
    userName: data.userName,
    companyName: data.companyName,
  })

  return sendEmailWithDefaults({
    to: data.to,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })
}

/**
 * Send organization setup email (client)
 */
export async function sendOrganizationSetupEmail(data: {
  to: string
  userName: string
  companyName: string
}): Promise<SendEmailResponse> {
  const template = createOrganizationSetupEmail({
    userName: data.userName,
    companyName: data.companyName,
  })

  return sendEmailWithDefaults({
    to: data.to,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })
}

/**
 * Send invitation email (client)
 * Note: Users sign in using magic links on the landing page, not a separate signup page
 */
export async function sendInvitationEmail(data: {
  to: string
  fullName: string
  company: string
}): Promise<SendEmailResponse> {
  const template = createInvitationEmail({
    fullName: data.fullName,
    company: data.company,
  })

  console.log('📧 Sending invitation email:', {
    to: data.to,
    fullName: data.fullName,
    company: data.company,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com',
    timestamp: new Date().toISOString(),
  })

  const result = await sendEmailWithDefaults({
    to: data.to,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })

  if (result.success) {
    console.log('✅ Invitation email sent successfully:', {
      to: data.to,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    })
  } else {
    console.error('❌ Failed to send invitation email:', {
      to: data.to,
      error: result.error,
      timestamp: new Date().toISOString(),
    })
  }

  return result
}

/**
 * Send waitlist admin notification email (admin)
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
  const template = createWaitlistAdminNotificationEmail({
    waitlistEntry: data.waitlistEntry,
  })

  return sendEmailWithDefaults({
    to: data.adminEmails,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })
}

// Export subdomain utilities for promotional emails
export { getEmailSubdomain, getPromotionalSenderEmail } from './config'

