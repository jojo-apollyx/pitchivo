/**
 * Waitlist Admin Notification Email Template (Admin)
 * 
 * Sent to admin users when someone joins the waitlist
 */

import { BaseEmailTemplate } from '../base'

export interface WaitlistAdminNotificationEmailData {
  waitlistEntry: {
    email: string
    fullName: string
    company: string
    role?: string
    note?: string
  }
}

export function createWaitlistAdminNotificationEmail(
  data: WaitlistAdminNotificationEmailData
): { html: string; text: string; subject: string } {
  const { waitlistEntry } = data
  const { email, fullName, company, role, note } = waitlistEntry
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'}/admin/waitlist`

  const { html, text } = BaseEmailTemplate({
    title: 'New Waitlist Entry',
    preheader: `${fullName} from ${company} joined the waitlist`,
    children: `
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">A new person has joined the waitlist:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Name:</strong> ${fullName}</p>
        <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Email:</strong> <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
        <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Company:</strong> ${company}</p>
        ${role ? `<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Role:</strong> ${role}</p>` : ''}
        ${note ? `<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Note:</strong> ${note}</p>` : ''}
      </div>
    `.trim(),
    ctaButton: {
      text: 'View Waitlist',
      url: adminUrl,
    },
  })

  return {
    html,
    text,
    subject: `New Waitlist Entry: ${fullName} from ${company}`,
  }
}

