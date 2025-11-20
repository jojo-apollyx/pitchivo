/**
 * Smartlead API Client
 * 
 * This client provides methods to interact with the Smartlead API
 * for campaign creation, management, lead management, and analytics.
 * 
 * Official Documentation: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
 * Base URL: https://server.smartlead.ai/api/v1
 * Authentication: API key as query parameter (?api_key=yourApiKey)
 * Rate Limit: 10 requests per 2 seconds
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

  constructor(apiKey: string, baseUrl: string = 'https://server.smartlead.ai/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Make authenticated request to Smartlead API
   * Authentication: API key as query parameter (not header)
   * Reference: https://api.smartlead.ai/reference/authentication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SmartleadApiResponse<T>> {
    const method = options.method || 'GET';
    const requestBody = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined;
    
    try {
      // Add API key as query parameter
      const url = new URL(`${this.baseUrl}${endpoint}`);
      url.searchParams.append('api_key', this.apiKey);

      // Log request details (mask API key in logs)
      const logUrl = url.toString().replace(/api_key=[^&]+/, 'api_key=***');
      console.log(`[Smartlead API] ${method} ${logUrl}`);
      if (requestBody) {
        console.log(`[Smartlead API] Request body:`, requestBody);
      }

      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Log response status and headers
      console.log(`[Smartlead API] Response status: ${response.status} ${response.statusText}`);
      console.log(`[Smartlead API] Response headers:`, Object.fromEntries(response.headers.entries()));

      // Get raw response text first
      const responseText = await response.text();
      console.log(`[Smartlead API] Response body (raw):`, responseText.substring(0, 1000)); // Log first 1000 chars

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        console.error(`[Smartlead API] Expected JSON but received: ${contentType}`);
        console.error(`[Smartlead API] Full response body:`, responseText);
        return {
          success: false,
          error: {
            error: 'Invalid Response Format',
            message: `Expected JSON but received ${contentType}. Response: ${responseText.substring(0, 500)}`,
            status_code: response.status,
          },
        };
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Smartlead API] Failed to parse JSON response:`, parseError);
        console.error(`[Smartlead API] Response text that failed to parse:`, responseText);
        return {
          success: false,
          error: {
            error: 'JSON Parse Error',
            message: `Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response: ${responseText.substring(0, 500)}`,
            status_code: response.status,
          },
        };
      }

      if (!response.ok) {
        console.error(`[Smartlead API] API returned error:`, data);
        return {
          success: false,
          error: {
            error: 'API Error',
            message: data.message || data.error || 'Unknown error occurred',
            status_code: response.status,
          },
        };
      }

      console.log(`[Smartlead API] Success:`, JSON.stringify(data).substring(0, 500));
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`[Smartlead API] Network/Request error:`, error);
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
   * 
   * API Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
   * Endpoint: POST /api/v1/campaigns/create
   */
  async createCampaign(data: CreateCampaignData): Promise<SmartleadApiResponse<SmartleadCampaign>> {
    // Smartlead API expects: { "name": "...", "client_id": ... }
    const requestBody = {
      name: data.name,
      client_id: data.client_id || null,
    };

    const result = await this.request<{ ok: boolean; id: number; name: string; created_at: string }>('/campaigns/create', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Transform Smartlead response to our format
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          id: result.data.id,
          name: result.data.name,
          status: 'DRAFT' as const, // New campaigns start as DRAFT
          created_at: result.data.created_at,
          updated_at: result.data.created_at,
        },
      };
    }

    return {
      success: false,
      error: result.error,
    };
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
   * 
   * API Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
   * Endpoint: POST /api/v1/campaigns/{campaign_id}/status
   */
  async pauseCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'PAUSED' }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Resume a paused campaign
   * 
   * @param campaignId Smartlead campaign ID
   * 
   * API Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
   * Endpoint: POST /api/v1/campaigns/{campaign_id}/status
   */
  async resumeCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'START' }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Delete a campaign
   * 
   * API Reference: DELETE /api/v1/campaigns/{campaign_id}
   * Response: { "ok": true }
   * 
   * @param campaignId Smartlead campaign ID
   */
  async deleteCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}`, {
      method: 'DELETE',
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Update campaign schedule
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/schedule
   * 
   * @param campaignId Smartlead campaign ID
   * @param schedule Schedule configuration
   */
  async updateCampaignSchedule(
    campaignId: string,
    schedule: {
      timezone: string;
      days_of_the_week: number[]; // 0-6 where 0=Sunday
      start_hour: string; // "HH:MM"
      end_hour: string; // "HH:MM"
      min_time_btw_emails: number; // Minutes
      max_new_leads_per_day: number;
      schedule_start_time?: string; // ISO 8601
    }
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Update campaign settings
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/settings
   * 
   * @param campaignId Smartlead campaign ID
   * @param settings Campaign settings
   */
  async updateCampaignSettings(
    campaignId: string,
    settings: {
      track_settings?: string[]; // DONT_TRACK_EMAIL_OPEN, DONT_TRACK_LINK_CLICK, DONT_TRACK_REPLY_TO_AN_EMAIL
      stop_lead_settings?: string; // REPLY_TO_AN_EMAIL, CLICK_ON_A_LINK, OPEN_AN_EMAIL
      unsubscribe_text?: string;
      send_as_plain_text?: boolean;
      follow_up_percentage?: number; // 0-100
      client_id?: number;
      enable_ai_esp_matching?: boolean;
    }
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Get campaign sequences
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/sequences
   * 
   * @param campaignId Smartlead campaign ID
   */
  async getCampaignSequences(campaignId: string): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/campaigns/${campaignId}/sequences`);
  }

  /**
   * Save campaign sequences
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/sequences
   * 
   * @param campaignId Smartlead campaign ID
   * @param sequences Array of sequence data
   */
  async saveCampaignSequences(
    campaignId: string,
    sequences: Array<{
      id?: number; // Include when updating existing sequence
      seq_number: number;
      seq_delay_details: { delay_in_days: number };
      subject?: string; // Empty for same-thread follow-ups
      email_body: string;
      seq_variants?: Array<{
        subject: string;
        email_body: string;
        variant_label: string; // A, B, C, etc.
      }>;
    }>
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/sequences`, {
      method: 'POST',
      body: JSON.stringify({ sequences }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Add a lead to a campaign
   * 
   * @param campaignId Smartlead campaign ID
   * @param lead Lead data to add
   * 
   * API Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
   * Endpoint: POST /api/v1/campaigns/{campaign_id}/leads
   * Response: { "ok": true }
   */
  async addLead(campaignId: string, lead: AddLeadData): Promise<SmartleadApiResponse<{ ok: boolean }>> {
    // Smartlead expects specific field names - map our format to theirs
    const smartleadLead = {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email,
      company_name: lead.company_name || '',
      custom_fields: lead.custom_fields || {},
      // Optional fields that Smartlead supports
      phone_number: (lead as any).phone_number,
      website: (lead as any).website,
      location: (lead as any).location,
      linkedin_profile: (lead as any).linkedin_profile,
      company_url: (lead as any).company_url,
    };

    const result = await this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads`, {
      method: 'POST',
      body: JSON.stringify(smartleadLead),
    });

    return result;
  }

  /**
   * Add multiple leads to a campaign
   * 
   * NOTE: Bulk endpoint is not documented in Smartlead API docs.
   * This method adds leads one by one. Consider rate limits (10 requests per 2 seconds).
   * 
   * @param campaignId Smartlead campaign ID
   * @param leads Array of leads to add
   */
  async addLeads(campaignId: string, leads: AddLeadData[]): Promise<SmartleadApiResponse<{ added: number }>> {
    // Since bulk endpoint is not documented, add leads sequentially
    // TODO: Check if Smartlead has a bulk endpoint or batch API
    let added = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      const result = await this.addLead(campaignId, lead);
      if (result.success) {
        added++;
      } else {
        errors.push(`${lead.email}: ${result.error?.message || 'Unknown error'}`);
      }
      // Respect rate limit: 10 requests per 2 seconds = 200ms between requests
      if (leads.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          error: 'Partial Failure',
          message: `Added ${added}/${leads.length} leads. Errors: ${errors.join('; ')}`,
          status_code: 207, // Multi-Status
        },
      };
    }

    return {
      success: true,
      data: { added },
    };
  }

  /**
   * Get all leads for a campaign
   * 
   * API Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
   * Endpoint: GET /api/v1/campaigns/{campaign_id}/leads?offset={number}&limit={number}
   * 
   * @param campaignId Smartlead campaign ID
   * @param options Pagination options
   * @param options.offset Offset for pagination (default: 0)
   * @param options.limit Limit for pagination (default: 100)
   * @returns List of leads in the campaign
   */
  async listLeads(
    campaignId: string,
    options?: { offset?: number; limit?: number }
  ): Promise<SmartleadApiResponse<SmartleadLead[]>> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;

    // Build endpoint with pagination query parameters
    // The request method will add the API key automatically
    const endpoint = `/campaigns/${campaignId}/leads?offset=${offset}&limit=${limit}`;

    const result = await this.request<SmartleadLead[]>(endpoint, {
      method: 'GET',
    });

    // Ensure we return an array even if API returns something else
    if (result.success && result.data) {
      return {
        success: true,
        data: Array.isArray(result.data) ? result.data : [],
      };
    }

    return result;
  }

  /**
   * Remove a lead from a campaign
   * 
   * API Reference: DELETE /api/v1/campaigns/{campaign_id}/leads/{lead_id}
   * According to the Smartlead API docs, we can delete a lead using lead_id
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadIdOrEmail Lead ID or email to remove
   */
  async removeLead(campaignId: string, leadIdOrEmail: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads/${leadIdOrEmail}`, {
      method: 'DELETE',
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Get campaign analytics and metrics
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/analytics
   * From the API docs: Returns campaign metrics including sent, opened, clicked, replied, bounced, etc.
   * 
   * @param campaignId Smartlead campaign ID
   * @returns Campaign analytics data
   */
  async getCampaignAnalytics(campaignId: string): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/campaigns/${campaignId}/analytics`);
  }

  /**
   * Get campaign analytics by date range
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/analytics-by-date
   * Query params: start_date, end_date (YYYY-MM-DD format)
   * Maximum 30-day range
   * 
   * @param campaignId Smartlead campaign ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Campaign analytics data for date range
   */
  async getCampaignAnalyticsByDate(
    campaignId: string,
    startDate: string,
    endDate: string
  ): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/campaigns/${campaignId}/analytics-by-date?start_date=${startDate}&end_date=${endDate}`);
  }

  /**
   * Get campaign statistics with filters
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/statistics
   * Query params: offset, limit, email_sequence_number, email_status
   * 
   * @param campaignId Smartlead campaign ID
   * @param options Filter options
   * @returns Detailed campaign statistics
   */
  async getCampaignStatistics(
    campaignId: string,
    options?: {
      offset?: number;
      limit?: number;
      email_sequence_number?: number;
      email_status?: 'opened' | 'clicked' | 'replied' | 'unsubscribed' | 'bounced';
    }
  ): Promise<SmartleadApiResponse<any>> {
    const params = new URLSearchParams();
    if (options?.offset !== undefined) params.append('offset', options.offset.toString());
    if (options?.limit !== undefined) params.append('limit', options.limit.toString());
    if (options?.email_sequence_number !== undefined) params.append('email_sequence_number', options.email_sequence_number.toString());
    if (options?.email_status) params.append('email_status', options.email_status);

    const queryString = params.toString();
    const endpoint = `/campaigns/${campaignId}/statistics${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any>(endpoint);
  }

  /**
   * Test API connection and authentication
   * 
   * NOTE: This endpoint is NOT documented in Smartlead API docs.
   * A simple way to test is to call GET /campaigns which should return a list.
   * 
   * @returns Success status
   */
  async testConnection(): Promise<SmartleadApiResponse<{ authenticated: boolean }>> {
    // Use GET /campaigns as a test since /auth/test is not documented
    const result = await this.request<any>('/campaigns');
    return {
      success: result.success,
      data: result.success ? { authenticated: true } : undefined,
      error: result.error,
    };
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

