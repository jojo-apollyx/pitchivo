/**
 * Base Email Template
 * 
 * This is the base template for all emails with spam-prevention best practices:
 * - Proper HTML structure
 * - Inline CSS (better email client compatibility)
 * - Text version included
 * - Physical address footer (CAN-SPAM requirement)
 * - Proper meta tags
 */

import { EMAIL_CONFIG, getPhysicalAddressFooter } from '../config'

export interface BaseEmailTemplateProps {
  title: string
  preheader?: string
  children: string
  ctaButton?: {
    text: string
    url: string
  }
  footerText?: string
}

/**
 * Base email template with spam-prevention best practices
 */
export function BaseEmailTemplate({
  title,
  preheader,
  children,
  ctaButton,
  footerText,
}: BaseEmailTemplateProps): { html: string; text: string } {
  const physicalAddress = getPhysicalAddressFooter()
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!-- Preheader text (shown in email preview) -->
  ${preheader ? `<div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6; color: #333333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; line-height: 1.2;">${title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; background-color: #ffffff;">
              ${children}
              
              ${ctaButton ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 30px 0 20px 0;">
                    <a href="${ctaButton.url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; line-height: 1.5;">${ctaButton.text}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
              ${footerText ? `<p style="font-size: 14px; color: #666666; margin: 0 0 10px 0; line-height: 1.5;">${footerText}</p>` : ''}
              <p style="font-size: 12px; color: #999999; margin: 10px 0 0 0; line-height: 1.5;">
                Best regards,<br>
                <strong>The Pitchivo Team</strong>
              </p>
              <p style="font-size: 11px; color: #999999; margin: 20px 0 0 0; line-height: 1.5; white-space: pre-line;">
                ${physicalAddress}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Create text version (important for spam prevention)
  const text = `
${title}

${preheader ? `${preheader}\n\n` : ''}${children}

${ctaButton ? `\n${ctaButton.text}: ${ctaButton.url}\n` : ''}

${footerText ? `${footerText}\n\n` : ''}Best regards,
The Pitchivo Team

${physicalAddress}
  `.trim()

  return { html, text }
}

