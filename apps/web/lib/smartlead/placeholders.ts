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
 * HTML-escape a string to prevent XSS and broken HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * URL-encode a string for use in href attributes
 */
function encodeUrl(url: string): string {
  try {
    // Use encodeURI to preserve valid URL structure, but encode special chars
    return encodeURI(url);
  } catch {
    // Fallback to encodeURIComponent if URL is malformed
    return encodeURIComponent(url);
  }
}

/**
 * Replace placeholders in text with actual values
 * @param text - The text to process
 * @param context - Placeholder values
 * @param isHtml - Whether the text is HTML content (default: false). When true, product_url will be wrapped in anchor tags for Smartlead tracking, and text values will be HTML-escaped.
 */
export function replacePlaceholders(
  text: string,
  context: PlaceholderContext,
  isHtml: boolean = false
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
    if (!value) return; // Skip empty values
    
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    
    // Special handling for product_url in HTML content
    if (placeholder === '{{product_url}}' && isHtml) {
      // Check if placeholder is already inside an anchor tag
      // Pattern matches: <a href="{{product_url}}"> or <a ...>{{product_url}}</a>
      const alreadyInAnchorPattern = /<a\s+[^>]*href\s*=\s*["'][^"']*\{\{product_url\}\}[^"']*["'][^>]*>|<\s*a\s+[^>]*>\s*\{\{product_url\}\}\s*<\/a>/i;
      
      const isAlreadyInAnchor = alreadyInAnchorPattern.test(result);
      console.log('[Placeholder Replacement] Processing {{product_url}}:', {
        isHtml,
        isAlreadyInAnchor,
        placeholderFound: regex.test(result),
        value: value?.substring(0, 50),
      });
      
      if (isAlreadyInAnchor) {
        // Already in an anchor tag, just replace the placeholder
        // URL-encode first, then HTML-escape for safe use in href attribute
        const encodedUrl = encodeUrl(value);
        const htmlEscapedUrl = escapeHtml(encodedUrl);
        result = result.replace(regex, htmlEscapedUrl);
        console.log('[Placeholder Replacement] Replaced {{product_url}} in existing anchor tag');
      } else {
        // Not in an anchor tag - wrap it in one for Smartlead tracking
        // URL-encode for href attribute, then HTML-escape for safe HTML
        // HTML-escape the link text separately
        const encodedUrl = encodeUrl(value);
        const htmlEscapedHref = escapeHtml(encodedUrl);
        const htmlEscapedText = escapeHtml(value);
        
        // Wrap the URL in an anchor tag so Smartlead can track it
        const wrappedValue = `<a href="${htmlEscapedHref}">${htmlEscapedText}</a>`;
        const beforeReplace = result.substring(0, 200);
        result = result.replace(regex, wrappedValue);
        const afterReplace = result.substring(0, 200);
        
        console.log('[Placeholder Replacement] Wrapped {{product_url}} in anchor tag:', {
          before: beforeReplace,
          after: afterReplace,
          wrappedValue: wrappedValue.substring(0, 100),
        });
      }
    } else if (isHtml) {
      // For HTML content, escape text placeholders to prevent XSS and broken HTML
      const escapedValue = escapeHtml(value);
      result = result.replace(regex, escapedValue);
    } else {
      // Plain text replacement (no escaping needed)
      result = result.replace(regex, value);
    }
  });

  return result;
}

/**
 * Replace placeholders in both subject and email body
 * Email body is treated as HTML to ensure product_url is wrapped in anchor tags for Smartlead tracking
 */
export function replacePlaceholdersInSequence(
  subject: string | null | undefined,
  emailBody: string,
  context: PlaceholderContext
): { subject: string | null; emailBody: string } {
  // Replace placeholders in email body (treat as HTML)
  let processedBody = replacePlaceholders(emailBody, context, true);
  
  // Smartlead requires email bodies to be properly formatted HTML with paragraph tags
  // This is critical for link tracking to work correctly
  // Examples from Smartlead API docs show: "<p>Email content</p>"
  
  const trimmedBody = processedBody.trim();
  
  // Check if body already starts with a block-level HTML tag
  const startsWithBlockTag = /^<(p|div|html|body|h[1-6]|ul|ol|li|blockquote)/i.test(trimmedBody);
  
  if (!startsWithBlockTag && trimmedBody) {
    // Check if the body contains HTML tags (like anchor tags) but isn't wrapped
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmedBody);
    
    if (hasHtmlTags) {
      // Body has HTML tags (like <a>) but isn't wrapped in a block element
      // Wrap the entire content in <p> tags so Smartlead can properly process it
      processedBody = `<p>${trimmedBody}</p>`;
    } else {
      // Plain text - split by lines and wrap each line in <p> tags
      processedBody = trimmedBody
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<p>${line}</p>`)
        .join('\n');
    }
  }
  
  // Debug logging to verify product_url is wrapped in anchor tag
  if (context.productUrl && processedBody.includes(context.productUrl)) {
    const hasAnchorTag = processedBody.includes('<a href') && processedBody.includes('</a>');
    console.log('[Placeholder Replacement] Product URL replacement check:', {
      productUrl: context.productUrl,
      hasAnchorTag,
      sample: processedBody.substring(0, 300),
    });
    
    if (!hasAnchorTag) {
      console.warn('[Placeholder Replacement] ⚠️ WARNING: Product URL found in email body but NOT wrapped in anchor tag!');
      console.warn('[Placeholder Replacement] This will prevent Smartlead from tracking the link.');
    }
  }
  
  return {
    // Subject is plain text, no HTML wrapping
    subject: subject ? replacePlaceholders(subject, context, false) : null,
    // Email body is HTML, wrap product_url in anchor tags for Smartlead tracking
    emailBody: processedBody,
  };
}

/**
 * Get placeholder context from campaign data
 * Creates email campaign channel token if campaign_id is provided
 */
export async function getPlaceholderContext(
  campaign: {
    campaign_id?: string;
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
    email?: string;
  },
  supabase?: any // Optional supabase client for token creation
): Promise<PlaceholderContext> {
  let productUrl: string | undefined;
  
  // Create email campaign channel token if we have campaign_id and product_id
  if (campaign.campaign_id && campaign.products?.product_id && campaign.org_id && supabase) {
    try {
      const { createAccessToken } = await import('@/lib/api/access-tokens');
      const channelId = `email_campaign_${campaign.campaign_id}`;
      const channelName = campaign.display_name || campaign.campaign_name || 'Email Campaign';
      
      // Check if token already exists
      const { data: existingToken } = await supabase
        .from('product_access_tokens')
        .select('token_id, expires_at, is_revoked')
        .eq('product_id', campaign.products.product_id)
        .eq('channel_id', channelId)
        .eq('is_revoked', false)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const existingTokenData = existingToken?.[0];
      const isTokenValid = existingTokenData && 
        (!existingTokenData.expires_at || new Date(existingTokenData.expires_at) > new Date());
      
      if (!isTokenValid) {
        // Create new token for email campaign channel
        const tokenResult = await createAccessToken(
          {
            productId: campaign.products.product_id,
            orgId: campaign.org_id,
            channelId: channelId,
            channelName: channelName,
            accessLevel: 'after_click', // Link access privilege, not merchant preview
            expiresInDays: 90,
            createdBy: campaign.created_by,
            notes: `Email campaign channel for campaign: ${campaign.campaign_id}`,
          },
          supabase
        );
        
        if (tokenResult.success && tokenResult.token) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com';
          productUrl = `${baseUrl}/products/${tokenResult.token}`;
        }
      } else {
        // Token exists but we can't retrieve plain token from hash
        // We'll need to create a new one (both will work with same access level)
        const tokenResult = await createAccessToken(
          {
            productId: campaign.products.product_id,
            orgId: campaign.org_id,
            channelId: channelId,
            channelName: channelName,
            accessLevel: 'after_click',
            expiresInDays: 90,
            createdBy: campaign.created_by,
            notes: `Email campaign channel for campaign: ${campaign.campaign_id}`,
          },
          supabase
        );
        
        if (tokenResult.success && tokenResult.token) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com';
          productUrl = `${baseUrl}/products/${tokenResult.token}`;
        }
      }
    } catch (error) {
      console.error('Error creating email campaign token:', error);
      // Fallback to direct URL if token creation fails
      productUrl = campaign.products?.product_id
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com'}/products/${campaign.products.product_id}`
        : undefined;
    }
  } else {
    // No campaign_id or supabase client - use direct product URL (fallback)
    productUrl = campaign.products?.product_id
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com'}/products/${campaign.products.product_id}`
      : undefined;
  }

  const productName = campaign.products?.product_name;
  const userOrgName = campaign.products?.organizations?.name;
  const campaignName = campaign.display_name || campaign.campaign_name;
  
  // Get user name from profile if available
  let userName: string | undefined;
  if (userProfile) {
    userName = userProfile.full_name || 
               userProfile.email?.split('@')[0] || 
               'Team';
  }

  return {
    productUrl,
    productName,
    userOrgName,
    userName,
    campaignName,
  };
}

