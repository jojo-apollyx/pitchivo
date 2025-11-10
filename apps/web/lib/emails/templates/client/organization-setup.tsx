/**
 * Organization Setup Email Template (Client)
 * 
 * Sent when organization setup is completed
 */

import { BaseEmailTemplate } from '../base'

export interface OrganizationSetupEmailData {
  userName: string
  companyName: string
}

export function createOrganizationSetupEmail(
  data: OrganizationSetupEmailData
): { html: string; text: string; subject: string } {
  const { userName, companyName } = data

  const { html, text } = BaseEmailTemplate({
    title: 'Workspace Ready',
    preheader: `Your ${companyName} workspace is ready to use`,
    children: `
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">Hi ${userName},</p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        Great news. Your ${companyName} workspace has been successfully set up and is ready to use.
      </p>
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
        You can now start inviting team members and managing your organization. All users with the same email domain will automatically join your workspace.
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
    subject: `${companyName} workspace is ready`,
  }
}

