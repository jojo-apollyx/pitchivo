/**
 * Campaign Naming Utilities
 * 
 * Handles multi-tenant campaign naming for Smartlead integration
 * 
 * Pattern: [{Organization}] {User} - {Campaign Display Name}
 * Example: [ChemCorp] John Smith - Sodium Benzoate Campaign
 */

interface CampaignNaming {
  displayName: string;
  smartleadName: string;
}

/**
 * Generate Smartlead campaign name with organization and user context
 */
export function generateSmartleadCampaignName(
  orgName: string,
  userName: string,
  displayName: string
): string {
  // Sanitize names (remove special characters that might break Smartlead)
  const cleanOrgName = orgName.trim().replace(/[[\]]/g, '');
  const cleanUserName = userName.trim();
  const cleanDisplayName = displayName.trim();
  
  return `[${cleanOrgName}] ${cleanUserName} - ${cleanDisplayName}`;
}

/**
 * Parse Smartlead campaign name to extract components
 */
export function parseSmartleadCampaignName(smartleadName: string): {
  orgName: string | null;
  userName: string | null;
  displayName: string;
} {
  // Pattern: [OrgName] UserName - DisplayName
  const pattern = /^\[([^\]]+)\]\s+([^-]+)\s+-\s+(.+)$/;
  const match = smartleadName.match(pattern);
  
  if (match) {
    return {
      orgName: match[1].trim(),
      userName: match[2].trim(),
      displayName: match[3].trim(),
    };
  }
  
  // If pattern doesn't match, treat entire name as display name
  return {
    orgName: null,
    userName: null,
    displayName: smartleadName,
  };
}

/**
 * Get display name from either format
 */
export function getDisplayName(campaignName: string): string {
  const parsed = parseSmartleadCampaignName(campaignName);
  return parsed.displayName;
}

/**
 * Check if campaign name follows our naming convention
 */
export function isStandardNaming(campaignName: string): boolean {
  const pattern = /^\[([^\]]+)\]\s+([^-]+)\s+-\s+(.+)$/;
  return pattern.test(campaignName);
}

/**
 * Generate user display name from user profile
 */
export function getUserDisplayName(profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
}): string {
  if (profile.full_name) {
    return profile.full_name;
  }
  
  if (profile.first_name || profile.last_name) {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  }
  
  if (profile.email) {
    return profile.email.split('@')[0];
  }
  
  return 'Unknown User';
}

