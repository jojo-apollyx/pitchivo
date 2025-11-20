/**
 * Smartlead API Client
 * 
 * This client provides methods to interact with the Smartlead API
 * for campaign creation, management, lead management, and analytics.
 * 
 * Documentation: https://docs.smartlead.ai/
 * 
 * NOTE: API endpoints and authentication method need to be updated
 * based on actual Smartlead API documentation.
 */

import type {
  SmartleadCampaign,
  CreateCampaignData,
  SmartleadLead,
  AddLeadData,
  CampaignAnalytics,
  SmartleadApiResponse,
  SmartleadApiError
} from './types';

export class SmartleadClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.smartlead.ai/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Make authenticated request to Smartlead API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SmartleadApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            error: 'API Error',
            message: data.message || 'Unknown error occurred',
            status_code: response.status,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to connect to Smartlead API',
          status_code: 500,
        },
      };
    }
  }

  /**
   * Create a new campaign in Smartlead
   * 
   * @param data Campaign creation data
   * @returns Campaign ID and details
   */
  async createCampaign(data: CreateCampaignData): Promise<SmartleadApiResponse<SmartleadCampaign>> {
    return this.request<SmartleadCampaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get campaign details by ID
   * 
   * @param campaignId Smartlead campaign ID
   * @returns Campaign details
   */
  async getCampaign(campaignId: string): Promise<SmartleadApiResponse<SmartleadCampaign>> {
    return this.request<SmartleadCampaign>(`/campaigns/${campaignId}`);
  }

  /**
   * Pause a campaign
   * 
   * @param campaignId Smartlead campaign ID
   */
  async pauseCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<void>(`/campaigns/${campaignId}/pause`, {
      method: 'POST',
    });
  }

  /**
   * Resume a paused campaign
   * 
   * @param campaignId Smartlead campaign ID
   */
  async resumeCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<void>(`/campaigns/${campaignId}/resume`, {
      method: 'POST',
    });
  }

  /**
   * Delete a campaign
   * 
   * @param campaignId Smartlead campaign ID
   */
  async deleteCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<void>(`/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get campaign analytics and metrics
   * 
   * @param campaignId Smartlead campaign ID
   * @returns Campaign analytics data
   */
  async getCampaignAnalytics(campaignId: string): Promise<SmartleadApiResponse<CampaignAnalytics>> {
    return this.request<CampaignAnalytics>(`/campaigns/${campaignId}/analytics`);
  }

  /**
   * Add a lead to a campaign
   * 
   * @param campaignId Smartlead campaign ID
   * @param lead Lead data to add
   */
  async addLead(campaignId: string, lead: AddLeadData): Promise<SmartleadApiResponse<SmartleadLead>> {
    return this.request<SmartleadLead>(`/campaigns/${campaignId}/leads`, {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  /**
   * Add multiple leads to a campaign
   * 
   * @param campaignId Smartlead campaign ID
   * @param leads Array of leads to add
   */
  async addLeads(campaignId: string, leads: AddLeadData[]): Promise<SmartleadApiResponse<{ added: number }>> {
    return this.request<{ added: number }>(`/campaigns/${campaignId}/leads/bulk`, {
      method: 'POST',
      body: JSON.stringify({ leads }),
    });
  }

  /**
   * Get all leads for a campaign
   * 
   * @param campaignId Smartlead campaign ID
   * @returns List of leads in the campaign
   */
  async listLeads(campaignId: string): Promise<SmartleadApiResponse<SmartleadLead[]>> {
    return this.request<SmartleadLead[]>(`/campaigns/${campaignId}/leads`);
  }

  /**
   * Remove a lead from a campaign
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadEmail Email of the lead to remove
   */
  async removeLead(campaignId: string, leadEmail: string): Promise<SmartleadApiResponse<void>> {
    return this.request<void>(`/campaigns/${campaignId}/leads/${encodeURIComponent(leadEmail)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Test API connection and authentication
   * 
   * @returns Success status
   */
  async testConnection(): Promise<SmartleadApiResponse<{ authenticated: boolean }>> {
    return this.request<{ authenticated: boolean }>('/auth/test');
  }
}

/**
 * Create a Smartlead client instance
 * Reads API key from environment variables
 */
export function createSmartleadClient(): SmartleadClient {
  const apiKey = process.env.SMARTLEAD_API_KEY;
  
  if (!apiKey) {
    throw new Error('SMARTLEAD_API_KEY environment variable is not set');
  }

  return new SmartleadClient(apiKey);
}

