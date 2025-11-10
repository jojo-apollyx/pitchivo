/**
 * Invitation Email Template (Client)
 * 
 * Sent to waitlist users when they're invited to join
 * Users sign in using magic links on the landing page
 */

import { BaseEmailTemplate } from '../base'

export interface InvitationEmailData {
  fullName: string
  company: string
}

export function createInvitationEmail(
  data: InvitationEmailData
): { html: string; text: string; subject: string } {
  const { fullName, company } = data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'

  const { html, text } = BaseEmailTemplate({
    title: "You're Invited",
    preheader: `Your request for ${company} has been approved`,
    children: `
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">Hi ${fullName},</p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        Great news. Your request for ${company} has been approved. You're now invited to join Pitchivo.
      </p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        To get started, visit our website and sign in using your email address. We'll send you a magic link to access your account.
      </p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        Visit <a href="${siteUrl}" style="color: #667eea; text-decoration: none;">${siteUrl}</a> and enter your email to receive your sign-in link.
      </p>
    `.trim(),
    ctaButton: {
      text: 'Go to Pitchivo',
      url: siteUrl,
    },
    footerText: `Visit ${siteUrl} and enter your email address to receive your magic link sign-in.`,
  })

  return {
    html,
    text,
    subject: "You're invited to join Pitchivo",
  }
}

