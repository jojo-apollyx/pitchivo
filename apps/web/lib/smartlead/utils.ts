/**
 * Smartlead Utility Functions
 * 
 * Shared utilities for Smartlead integration
 */

/**
 * Convert Smartlead campaign status to match our database schema
 * 
 * Smartlead returns uppercase statuses (e.g., "DRAFTED", "ACTIVE", "STOPPED")
 * Our database schema now matches Smartlead exactly: 'drafted', 'active', 'paused', 'completed', 'stopped'
 * 
 * Simply convert to lowercase - no mapping needed since we match Smartlead's statuses
 */
export function normalizeSmartleadStatus(smartleadStatus: string): string {
  return smartleadStatus.toLowerCase();
}

