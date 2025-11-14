/**
 * RFQ Notification Email Template (Merchant/Product Owner)
 * 
 * Sent to product owners when someone submits an RFQ for their product
 * This template is structured to support different industries in the future
 */

import { BaseEmailTemplate } from '../base'

export interface RfqNotificationEmailData {
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
  industryCode?: string // For future industry-specific customization
}

export function createRfqNotificationEmail(
  data: RfqNotificationEmailData
): { html: string; text: string; subject: string } {
  const { productName, rfq, productUrl, dashboardUrl, industryCode } = data
  const { name, email, company, phone, message, quantity, targetDate } = rfq

  // Industry-specific customization (extendable for future industries)
  const industryConfig = getIndustryConfig(industryCode)

  const { html, text } = BaseEmailTemplate({
    title: 'New Request for Quote',
    preheader: `${name} from ${company} submitted an RFQ for ${productName}`,
    children: `
      <p style="font-size: 16px; margin: 0 0 20px 0; line-height: 1.6; color: #333333;">You have received a new request for quote for your product:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333333; line-height: 1.4;">${productName}</p>
      </div>

      <p style="font-size: 16px; margin: 20px 0 10px 0; line-height: 1.6; color: #333333; font-weight: 600;">Request Details:</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e0e0e0;">
        <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Name:</strong> ${name}</p>
        <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Email:</strong> <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
        <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Company:</strong> ${company}</p>
        ${phone ? `<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Phone:</strong> <a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a></p>` : ''}
        ${quantity ? `<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Quantity:</strong> ${quantity}</p>` : ''}
        ${targetDate ? `<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #333333;"><strong style="color: #333333;">Target Date:</strong> ${targetDate}</p>` : ''}
      </div>

      ${message ? `
      <p style="font-size: 16px; margin: 20px 0 10px 0; line-height: 1.6; color: #333333; font-weight: 600;">Message:</p>
      <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin: 10px 0 20px 0; border: 1px solid #e0e0e0;">
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333333; white-space: pre-wrap;">${message}</p>
      </div>
      ` : ''}

      <p style="font-size: 14px; margin: 20px 0 10px 0; line-height: 1.6; color: #666666;">You can view and manage this RFQ in your dashboard, or view the product page directly.</p>
    `.trim(),
    ctaButton: {
      text: 'View in Dashboard',
      url: dashboardUrl,
    },
    footerText: `You can also view the product page: ${productUrl}`,
  })

  return {
    html,
    text,
    subject: `New RFQ: ${name} from ${company} - ${productName}`,
  }
}

/**
 * Get industry-specific configuration for email templates
 * This allows for future customization per industry
 */
function getIndustryConfig(industryCode?: string): {
  subjectPrefix?: string
  customFields?: string[]
  templateVariations?: Record<string, any>
} {
  // Default configuration
  const defaultConfig = {
    subjectPrefix: 'New RFQ',
    customFields: [],
    templateVariations: {},
  }

  // Industry-specific overrides (extendable)
  const industryConfigs: Record<string, typeof defaultConfig> = {
    // Example for future industries:
    // food_supplement: {
    //   subjectPrefix: 'New Supplement Inquiry',
    //   customFields: ['certifications', 'regulatory_compliance'],
    // },
    // chemicals: {
    //   subjectPrefix: 'New Chemical Inquiry',
    //   customFields: ['safety_data', 'msds'],
    // },
  }

  if (!industryCode) {
    return defaultConfig
  }

  return industryConfigs[industryCode] || defaultConfig
}

