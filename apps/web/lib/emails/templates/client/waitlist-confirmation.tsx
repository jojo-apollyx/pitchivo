/**
 * Waitlist Confirmation Email Template (Client)
 * 
 * Sent to users when they join the waitlist
 */

import { BaseEmailTemplate } from '../base'

export interface WaitlistConfirmationEmailData {
  fullName: string
  company: string
}

export function createWaitlistConfirmationEmail(
  data: WaitlistConfirmationEmailData
): { html: string; text: string; subject: string } {
  const { fullName, company } = data

  const { html, text } = BaseEmailTemplate({
    title: "You're on the list",
    preheader: `Thank you for joining the Pitchivo waitlist for ${company}`,
    children: `
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">Hi ${fullName},</p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        Thank you for joining the Pitchivo waitlist. We've received your request for ${company} and will notify you as soon as your account is approved.
      </p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        We're excited to have you on board and will be in touch soon.
      </p>
    `.trim(),
    footerText: "If you have any questions, please reply to this email and we'll be happy to help.",
  })

  return {
    html,
    text,
    subject: "You're on the Pitchivo waitlist",
  }
}

