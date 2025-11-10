/**
 * Welcome Email Template (Client)
 * 
 * Sent to new users when they sign up
 */

import { BaseEmailTemplate } from '../base'

export interface WelcomeEmailData {
  userName: string
  companyName?: string
}

export function createWelcomeEmail(
  data: WelcomeEmailData
): { html: string; text: string; subject: string } {
  const { userName, companyName } = data
  const companyText = companyName ? ` at ${companyName}` : ''

  const { html, text } = BaseEmailTemplate({
    title: 'Welcome to Pitchivo',
    preheader: `Your account has been successfully created${companyText}`,
    children: `
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">Hi ${userName},</p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        We're excited to have you${companyText}. Your account has been successfully created and you're all set to start using Pitchivo.
      </p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        If you have any questions or need help getting started, feel free to reach out to our support team.
      </p>
    `.trim(),
    ctaButton: {
      text: 'Go to Dashboard',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'}/dashboard`,
    },
    footerText: "If you have any questions, please reply to this email and we'll be happy to help.",
  })

  return {
    html,
    text,
    subject: `Welcome to Pitchivo${companyText}`,
  }
}

