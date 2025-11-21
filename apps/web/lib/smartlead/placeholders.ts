/**
 * Placeholder replacement utilities for Smartlead sequences
 * 
 * Supported placeholders (replaced when sequences are saved):
 * - {{product_url}} - Full URL to the product page
 * - {{product_name}} - Name of the product
 * - {{user_org_name}} - Organization name of the user/campaign owner
 * - {{org_name}} - Alias for {{user_org_name}}
 * - {{organization_name}} - Alias for {{user_org_name}}
 * - {{user_name}} - Name of the campaign creator/user
 * - {{campaign_name}} - Campaign display name
 * 
 * Smartlead native merge tags (automatically replaced by Smartlead when sending):
 * - {first_name} - Lead's first name
 * - {last_name} - Lead's last name
 * - {full_name} - Lead's full name
 * - {company_name} - Lead's company name
 * - {email} - Lead's email address
 * - {Title} - Lead's job title (from custom_fields)
 * - {custom_field_name} - Any custom field value
 */

export interface PlaceholderContext {
  productUrl?: string;
  productName?: string;
  userOrgName?: string;
  userName?: string;
  campaignName?: string;
}

/**
 * Replace placeholders in text with actual values
 */
export function replacePlaceholders(
  text: string,
  context: PlaceholderContext
): string {
  if (!text) return text;

  const placeholders: Record<string, string> = {
    '{{product_url}}': context.productUrl || '',
    '{{product_name}}': context.productName || 'Our Product',
    '{{user_org_name}}': context.userOrgName || 'Pitchivo',
    '{{org_name}}': context.userOrgName || 'Pitchivo',
    '{{organization_name}}': context.userOrgName || 'Pitchivo',
    '{{user_name}}': context.userName || 'Team',
    '{{campaign_name}}': context.campaignName || 'Campaign',
  };

  let result = text;

  // Replace each placeholder
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Replace placeholders in both subject and email body
 */
export function replacePlaceholdersInSequence(
  subject: string | null | undefined,
  emailBody: string,
  context: PlaceholderContext
): { subject: string | null; emailBody: string } {
  return {
    subject: subject ? replacePlaceholders(subject, context) : null,
    emailBody: replacePlaceholders(emailBody, context),
  };
}

// Export replacePlaceholders for use in API routes
export { replacePlaceholders };

/**
 * Get placeholder context from campaign data
 */
export async function getPlaceholderContext(
  campaign: {
    product_id?: string;
    org_id?: string;
    display_name?: string;
    campaign_name?: string;
    created_by?: string;
    products?: {
      product_id?: string;
      product_name?: string;
      organizations?: {
        name?: string;
      };
    };
  },
  userProfile?: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
  }
): Promise<PlaceholderContext> {
  const productUrl = campaign.products?.product_id
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com'}/products/${campaign.products.product_id}`
    : undefined;

  const productName = campaign.products?.product_name;
  const userOrgName = campaign.products?.organizations?.name;
  const campaignName = campaign.display_name || campaign.campaign_name;
  
  // Get user name from profile if available
  let userName: string | undefined;
  if (userProfile) {
    userName = userProfile.full_name || 
               (userProfile.first_name && userProfile.last_name 
                 ? `${userProfile.first_name} ${userProfile.last_name}` 
                 : userProfile.first_name || 
                   userProfile.email?.split('@')[0] || 
                   'Team');
  }

  return {
    productUrl,
    productName,
    userOrgName,
    userName,
    campaignName,
  };
}

