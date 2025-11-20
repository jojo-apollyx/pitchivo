/**
 * Smartlead API Type Definitions
 * Based on Smartlead API documentation: https://api.smartlead.ai
 */

export interface SmartleadCampaign {
  id: string | number;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'STOPPED';
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  name: string;
  client_id?: string;
  settings?: {
    timezone?: string;
    track_settings?: {
      open_tracking?: boolean;
      click_tracking?: boolean;
    };
  };
}

export interface SmartleadLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  custom_fields?: Record<string, string>;
}

export interface AddLeadData {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  custom_fields?: Record<string, string>;
}

export interface CampaignAnalytics {
  campaign_id: string;
  total_leads: number;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  replies_received: number;
  positive_replies: number;
  neutral_replies: number;
  negative_replies: number;
  unsubscribes: number;
}

export interface SmartleadApiError {
  error: string;
  message: string;
  status_code: number;
}

export interface SmartleadApiResponse<T> {
  success: boolean;
  data?: T;
  error?: SmartleadApiError;
}

