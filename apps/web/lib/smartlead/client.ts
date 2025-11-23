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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Add API key as query parameter
      const url = new URL(`${this.baseUrl}${endpoint}`);
      url.searchParams.append('api_key', this.apiKey);

      // Log request details (mask API key in logs)
      const logUrl = url.toString().replace(/api_key=[^&]+/, 'api_key=***');
      console.log(`[Smartlead API] ============================================`);
      console.log(`[Smartlead API] 🚀 REQUEST [${requestId}]`);
      console.log(`[Smartlead API] Method: ${method}`);
      console.log(`[Smartlead API] Endpoint: ${endpoint}`);
      console.log(`[Smartlead API] URL: ${logUrl}`);
      console.log(`[Smartlead API] Timestamp: ${new Date().toISOString()}`);
      
      if (requestBody) {
        try {
          const bodyObj = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
          console.log(`[Smartlead API] Request body:`, JSON.stringify(bodyObj, null, 2));
        } catch {
          console.log(`[Smartlead API] Request body (raw):`, requestBody.substring(0, 1000));
        }
      }
      console.log(`[Smartlead API] ============================================`);

      const startTime = Date.now();
      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      const duration = Date.now() - startTime;

      // Log response status and headers
      console.log(`[Smartlead API] ============================================`);
      console.log(`[Smartlead API] 📥 RESPONSE [${requestId}]`);
      console.log(`[Smartlead API] Status: ${response.status} ${response.statusText}`);
      console.log(`[Smartlead API] Duration: ${duration}ms`);
      console.log(`[Smartlead API] Response headers:`, Object.fromEntries(response.headers.entries()));

      // Get raw response text first
      const responseText = await response.text();
      const responsePreview = responseText.length > 1000 
        ? responseText.substring(0, 1000) + '... (truncated)'
        : responseText;
      console.log(`[Smartlead API] Response body (raw, ${responseText.length} chars):`, responsePreview);

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        console.error(`[Smartlead API] ❌ Expected JSON but received: ${contentType}`);
        console.error(`[Smartlead API] Full response body:`, responseText);
        console.log(`[Smartlead API] ============================================`);
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
        console.log(`[Smartlead API] Parsed JSON successfully`);
      } catch (parseError) {
        console.error(`[Smartlead API] ❌ Failed to parse JSON response:`, parseError);
        console.error(`[Smartlead API] Response text that failed to parse:`, responseText);
        console.log(`[Smartlead API] ============================================`);
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
        console.error(`[Smartlead API] ❌ API returned error:`, JSON.stringify(data, null, 2));
        console.log(`[Smartlead API] ============================================`);
        return {
          success: false,
          error: {
            error: 'API Error',
            message: data.message || data.error || 'Unknown error occurred',
            status_code: response.status,
          },
        };
      }

      console.log(`[Smartlead API] ✅ Success:`, JSON.stringify(data, null, 2).substring(0, 2000));
      console.log(`[Smartlead API] ============================================`);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`[Smartlead API] ============================================`);
      console.error(`[Smartlead API] ❌ Network/Request error [${requestId}]:`, {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      console.log(`[Smartlead API] ============================================`);
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

    const result = await this.request<{ 
      ok: boolean; 
      id: number; 
      name: string; 
      created_at: string;
      status?: string; // Smartlead may return status in response
    }>('/campaigns/create', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Transform Smartlead response to our format
    if (result.success && result.data) {
      // Use status from API response if available, otherwise default to DRAFT
      // Smartlead API returns "DRAFTED" for new campaigns, but our type uses "DRAFT"
      const rawStatus = (result.data.status || 'DRAFTED').toUpperCase();
      const status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'STOPPED' = 
        rawStatus === 'DRAFTED' ? 'DRAFT' : 
        (rawStatus as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'STOPPED');
      
      return {
        success: true,
        data: {
          id: result.data.id,
          name: result.data.name,
          status,
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
   * Stop a campaign
   * 
   * @param campaignId Smartlead campaign ID
   * 
   * API Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
   * Endpoint: POST /api/v1/campaigns/{campaign_id}/status
   */
  async stopCampaign(campaignId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'STOPPED' }),
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
    console.log(`[Smartlead Client] addLead called:`, {
      campaignId,
      lead_email: lead.email,
      lead_first_name: lead.first_name,
      lead_last_name: lead.last_name,
      lead_company: lead.company_name,
    });

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

    // Smartlead API requires lead_list array and settings object
    const requestBody = {
      lead_list: [smartleadLead],
      settings: {
        ignore_global_block_list: false,
        ignore_unsubscribe_list: false,
        ignore_duplicate_leads_in_other_campaign: false,
      },
    };

    const result = await this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    console.log(`[Smartlead Client] addLead result:`, {
      success: result.success,
      error: result.error,
    });

    return result;
  }

  /**
   * Add multiple leads to a campaign
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/leads
   * Supports bulk adding via lead_list array (max 100 leads per request)
   * 
   * @param campaignId Smartlead campaign ID
   * @param leads Array of leads to add
   */
  async addLeads(campaignId: string, leads: AddLeadData[]): Promise<SmartleadApiResponse<{ added: number }>> {
    console.log(`[Smartlead Client] addLeads called:`, {
      campaignId,
      leads_count: leads.length,
      sample_emails: leads.slice(0, 3).map(l => l.email),
    });

    // Smartlead supports bulk adding via lead_list array (max 100 leads)
    // If more than 100, we'll need to batch them
    const MAX_LEADS_PER_REQUEST = 100;
    
    if (leads.length > MAX_LEADS_PER_REQUEST) {
      console.log(`[Smartlead Client] Batching ${leads.length} leads into chunks of ${MAX_LEADS_PER_REQUEST}`);
      // Batch leads into chunks of 100
      let totalAdded = 0;
      const errors: string[] = [];
      const totalBatches = Math.ceil(leads.length / MAX_LEADS_PER_REQUEST);
      
      for (let i = 0; i < leads.length; i += MAX_LEADS_PER_REQUEST) {
        const batch = leads.slice(i, i + MAX_LEADS_PER_REQUEST);
        const batchNumber = Math.floor(i / MAX_LEADS_PER_REQUEST) + 1;
        console.log(`[Smartlead Client] Processing batch ${batchNumber}/${totalBatches} (${batch.length} leads)`);
        
        const result = await this.addLeadsBatch(campaignId, batch);
        
        if (result.success && result.data) {
          totalAdded += result.data.added || batch.length;
          console.log(`[Smartlead Client] Batch ${batchNumber} succeeded: ${result.data.added || batch.length} leads added`);
        } else {
          const errorMsg = `Batch ${batchNumber}: ${result.error?.message || 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`[Smartlead Client] Batch ${batchNumber} failed:`, result.error);
        }
        
        // Respect rate limit between batches
        if (i + MAX_LEADS_PER_REQUEST < leads.length) {
          console.log(`[Smartlead Client] Waiting 200ms before next batch (rate limit)`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`[Smartlead Client] addLeads batch processing complete:`, {
        total_leads: leads.length,
        total_added: totalAdded,
        errors_count: errors.length,
      });
      
      if (errors.length > 0) {
        return {
          success: false,
          error: {
            error: 'Partial Failure',
            message: `Added ${totalAdded}/${leads.length} leads. Errors: ${errors.join('; ')}`,
            status_code: 207,
          },
        };
      }
      
      return {
        success: true,
        data: { added: totalAdded },
      };
    }
    
    // Single batch request
    console.log(`[Smartlead Client] Adding ${leads.length} leads in single batch`);
    const result = await this.addLeadsBatch(campaignId, leads);
    console.log(`[Smartlead Client] addLeads result:`, {
      success: result.success,
      added: result.data?.added,
      error: result.error,
    });
    return result;
  }

  /**
   * Internal method to add a batch of leads (up to 100)
   */
  private async addLeadsBatch(campaignId: string, leads: AddLeadData[]): Promise<SmartleadApiResponse<{ added: number }>> {
    console.log(`[Smartlead Client] addLeadsBatch:`, {
      campaignId,
      batch_size: leads.length,
    });

    const smartleadLeads = leads.map(lead => ({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email,
      company_name: lead.company_name || '',
      custom_fields: lead.custom_fields || {},
      phone_number: (lead as any).phone_number,
      website: (lead as any).website,
      location: (lead as any).location,
      linkedin_profile: (lead as any).linkedin_profile,
      company_url: (lead as any).company_url,
    }));

    const requestBody = {
      lead_list: smartleadLeads,
      settings: {
        ignore_global_block_list: false,
        ignore_unsubscribe_list: false,
        ignore_duplicate_leads_in_other_campaign: false,
      },
    };

    const result = await this.request<{ 
      ok: boolean;
      upload_count?: number;
      total_leads?: number;
      already_added_to_campaign?: number;
      duplicate_count?: number;
      invalid_email_count?: number;
      unsubscribed_leads?: number;
    }>(`/campaigns/${campaignId}/leads`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (result.success && result.data) {
      const added = result.data.upload_count || result.data.total_leads || leads.length;
      console.log(`[Smartlead Client] addLeadsBatch success:`, {
        added,
        upload_count: result.data.upload_count,
        total_leads: result.data.total_leads,
        already_added: result.data.already_added_to_campaign,
        duplicates: result.data.duplicate_count,
        invalid: result.data.invalid_email_count,
        unsubscribed: result.data.unsubscribed_leads,
      });
      return {
        success: true,
        data: { added },
      };
    }

    console.error(`[Smartlead Client] addLeadsBatch failed:`, result.error);
    // Return error response with proper type
    return {
      success: false,
      error: result.error || {
        error: 'Unknown Error',
        message: 'Failed to add leads',
        status_code: 500,
      },
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
  ): Promise<SmartleadApiResponse<{ data: any[]; total_leads: number; offset: number; limit: number }>> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;

    // Build endpoint with pagination query parameters
    // The request method will add the API key automatically
    const endpoint = `/campaigns/${campaignId}/leads?offset=${offset}&limit=${limit}`;

    // Smartlead returns: { total_leads, offset, limit, data: [...] }
    const result = await this.request<{
      total_leads: number | string;
      offset: number;
      limit: number;
      data: Array<{
        campaign_lead_map_id: number;
        status: string;
        lead: any;
      }>;
    }>(endpoint, {
      method: 'GET',
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          data: result.data.data || [],
          total_leads: typeof result.data.total_leads === 'string' 
            ? parseInt(result.data.total_leads, 10) 
            : result.data.total_leads || 0,
          offset: result.data.offset || offset,
          limit: result.data.limit || limit,
        },
      };
    }

    return result as SmartleadApiResponse<{ data: any[]; total_leads: number; offset: number; limit: number }>;
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
   * Pause a lead in a campaign
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/leads/{lead_id}/pause
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadId Lead ID
   */
  async pauseLead(campaignId: string, leadId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads/${leadId}/pause`, {
      method: 'POST',
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Resume a paused lead in a campaign
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/leads/{lead_id}/resume
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadId Lead ID
   * @param delayDays Optional delay in days before resuming (default: 0)
   */
  async resumeLead(campaignId: string, leadId: string, delayDays?: number): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads/${leadId}/resume`, {
      method: 'POST',
      body: JSON.stringify({ resume_lead_with_delay_days: delayDays || 0 }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Unsubscribe a lead from a campaign
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/leads/{lead_id}/unsubscribe
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadId Lead ID
   */
  async unsubscribeLead(campaignId: string, leadId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads/${leadId}/unsubscribe`, {
      method: 'POST',
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Unsubscribe a lead globally from all campaigns
   * 
   * API Reference: POST /api/v1/leads/{lead_id}/unsubscribe
   * 
   * @param leadId Lead ID
   */
  async unsubscribeLeadGlobally(leadId: string): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/leads/${leadId}/unsubscribe`, {
      method: 'POST',
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Update lead information
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/leads/{lead_id}
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadId Lead ID
   * @param updates Lead fields to update
   */
  async updateLead(
    campaignId: string,
    leadId: string,
    updates: {
      first_name?: string;
      last_name?: string;
      company_name?: string;
      phone_number?: string;
      website?: string;
      location?: string;
      custom_fields?: Record<string, any>;
      linkedin_profile?: string;
      company_url?: string;
    }
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads/${leadId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Get lead by email address
   * 
   * API Reference: GET /api/v1/leads/?email={email}
   * 
   * @param email Lead email address
   */
  async getLeadByEmail(email: string): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/leads/?email=${encodeURIComponent(email)}`);
  }

  /**
   * Get all campaigns a lead is part of
   * 
   * API Reference: GET /api/v1/leads/{lead_id}/campaigns
   * 
   * @param leadId Lead ID
   */
  async getLeadCampaigns(leadId: string): Promise<SmartleadApiResponse<any[]>> {
    return this.request<any[]>(`/leads/${leadId}/campaigns`);
  }

  /**
   * Update lead category
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/leads/{lead_id}/category
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadId Lead ID
   * @param categoryId Category ID
   * @param pauseLead Whether to pause the lead
   */
  async updateLeadCategory(
    campaignId: string,
    leadId: string,
    categoryId: number,
    pauseLead: boolean = false
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/leads/${leadId}/category`, {
      method: 'POST',
      body: JSON.stringify({ category_id: categoryId, pause_lead: pauseLead }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Add domains to global block list
   * 
   * API Reference: POST /api/v1/leads/add-domain-block-list
   * 
   * @param domains Array of domains or emails to block
   * @param clientId Optional client ID
   */
  async addDomainToBlockList(domains: string[], clientId?: number): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/leads/add-domain-block-list`, {
      method: 'POST',
      body: JSON.stringify({ domain_block_list: domains, client_id: clientId || null }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Export campaign leads to CSV
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/leads-export
   * Returns CSV data as text
   * 
   * @param campaignId Smartlead campaign ID
   */
  async exportCampaignLeads(campaignId: string): Promise<SmartleadApiResponse<string>> {
    // This endpoint returns CSV, not JSON
    const url = new URL(`${this.baseUrl}/campaigns/${campaignId}/leads-export`);
    url.searchParams.append('api_key', this.apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        return {
          success: false,
          error: {
            error: 'Export Failed',
            message: 'Failed to export campaign leads',
            status_code: response.status,
          },
        };
      }

      const csvData = await response.text();
      return {
        success: true,
        data: csvData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to export leads',
          status_code: 500,
        },
      };
    }
  }

  /**
   * Get all lead categories
   * 
   * API Reference: GET /api/v1/leads/fetch-categories
   * 
   * Returns predefined categories:
   * - Interested
   * - Meeting Request
   * - Not Interested
   * - Do Not Contact
   * - Information Request
   * - Out Of Office
   * - Wrong Person
   */
  async getAllCategories(): Promise<SmartleadApiResponse<Array<{ id: number; name: string }>>> {
    return this.request<Array<{ id: number; name: string }>>(`/leads/fetch-categories`);
  }

  /**
   * Get lead message history
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/leads/{lead_id}/message-history
   * 
   * @param campaignId Smartlead campaign ID
   * @param leadId Lead ID
   */
  async getLeadMessageHistory(campaignId: string, leadId: string): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/campaigns/${campaignId}/leads/${leadId}/message-history`);
  }

  /**
   * Reply to an email thread
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/reply-email-thread
   * 
   * @param campaignId Smartlead campaign ID
   * @param replyData Reply data including email stats ID and body
   */
  async replyToEmailThread(
    campaignId: string,
    replyData: {
      email_stats_id: string;
      email_body: string;
      reply_message_id: string;
      reply_email_time: string;
      reply_email_body: string;
      cc?: string;
      bcc?: string;
      add_signature?: boolean;
    }
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/reply-email-thread`, {
      method: 'POST',
      body: JSON.stringify(replyData),
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
   * Get all email accounts
   * 
   * API Reference: GET /api/v1/email-accounts/?offset={offset}&limit={limit}
   * 
   * @param options Pagination options
   */
  async getAllEmailAccounts(options?: { offset?: number; limit?: number }): Promise<SmartleadApiResponse<any[]>> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100; // Max 100 per API docs
    return this.request<any[]>(`/email-accounts/?offset=${offset}&limit=${limit}`);
  }

  /**
   * Get email account by ID
   * 
   * API Reference: GET /api/v1/email-accounts/{account_id}
   * 
   * @param accountId Email account ID
   */
  async getEmailAccountById(accountId: number): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/email-accounts/${accountId}`);
  }

  /**
   * Create or update email account
   * 
   * API Reference: POST /api/v1/email-accounts/save
   * 
   * @param accountData Email account data (set id to null to create new)
   */
  async saveEmailAccount(accountData: {
    id?: number | null;
    from_name: string;
    from_email: string;
    user_name: string;
    password: string;
    smtp_host: string;
    smtp_port: number;
    imap_host: string;
    imap_port: number;
    max_email_per_day: number;
    warmup_enabled: boolean;
    client_id?: number | null;
  }): Promise<SmartleadApiResponse<{ ok: boolean; message: string; emailAccountId: number; warmupKey: string }>> {
    return this.request<{ ok: boolean; message: string; emailAccountId: number; warmupKey: string }>(`/email-accounts/save`, {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  /**
   * Update email account settings
   * 
   * API Reference: POST /api/v1/email-accounts/{email_account_id}
   * 
   * @param accountId Email account ID
   * @param settings Settings to update
   */
  async updateEmailAccountSettings(
    accountId: number,
    settings: {
      max_email_per_day?: number;
      custom_tracking_url?: string;
      bcc?: string;
      signature?: string;
      time_to_wait_in_mins?: number;
    }
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/email-accounts/${accountId}`, {
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
   * Update warmup settings for email account
   * 
   * API Reference: POST /api/v1/email-accounts/{email_account_id}/warmup
   * 
   * @param accountId Email account ID
   * @param warmupSettings Warmup configuration
   */
  async updateWarmupSettings(
    accountId: number,
    warmupSettings: {
      warmup_enabled: boolean;
      total_warmup_per_day?: number;
      daily_rampup?: number;
      reply_rate_percentage?: number;
      warmup_key_id?: string;
    }
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/email-accounts/${accountId}/warmup`, {
      method: 'POST',
      body: JSON.stringify(warmupSettings),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Get warmup stats for last 7 days
   * 
   * API Reference: GET /api/v1/email-accounts/{email_account_id}/warmup-stats
   * 
   * @param accountId Email account ID
   */
  async getWarmupStats(accountId: number): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/email-accounts/${accountId}/warmup-stats`);
  }

  /**
   * Add email accounts to campaign
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/email-accounts
   * 
   * @param campaignId Smartlead campaign ID
   * @param emailAccountIds Array of email account IDs to add
   */
  async addEmailAccountsToCampaign(
    campaignId: string,
    emailAccountIds: number[]
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/email-accounts`, {
      method: 'POST',
      body: JSON.stringify({ email_account_ids: emailAccountIds }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Remove email accounts from campaign
   * 
   * API Reference: DELETE /api/v1/campaigns/{campaign_id}/email-accounts
   * 
   * @param campaignId Smartlead campaign ID
   * @param emailAccountIds Array of email account IDs to remove
   */
  async removeEmailAccountsFromCampaign(
    campaignId: string,
    emailAccountIds: number[]
  ): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/campaigns/${campaignId}/email-accounts`, {
      method: 'DELETE',
      body: JSON.stringify({ email_account_ids: emailAccountIds }),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Get campaign email accounts
   * 
   * API Reference: GET /api/v1/campaigns/{campaign_id}/email-accounts
   * 
   * @param campaignId Smartlead campaign ID
   */
  async getCampaignEmailAccounts(campaignId: string): Promise<SmartleadApiResponse<any[]>> {
    return this.request<any[]>(`/campaigns/${campaignId}/email-accounts`);
  }

  /**
   * Bulk reconnect failed email accounts
   * 
   * API Reference: POST /api/v1/email-accounts/reconnect-failed-email-accounts
   * Note: Rate limited to 3 times per 24 hours
   */
  async bulkReconnectFailedAccounts(): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/email-accounts/reconnect-failed-email-accounts`, {
      method: 'POST',
      body: JSON.stringify({}),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
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
  /**
   * Fetch Inbox Replies from Master Inbox
   * 
   * API Reference: POST /api/v1/master-inbox/inbox-replies?fetch_message_history=true
   * Official Docs: https://api.smartlead.ai/reference/fetch-inbox-replies
   * 
   * @param options Request options including filters, pagination, and sorting
   */
  async fetchInboxReplies(options: {
    offset?: number;
    limit?: number;
    fetch_message_history?: boolean;
    filters?: {
      search?: string;
      leadCategories?: {
        unassigned?: boolean;
        isAssigned?: boolean;
        categoryIdsNotIn?: number[];
        categoryIdsIn?: number[];
      };
      emailStatus?: string[];
      campaignId?: number[];
      emailAccountId?: number[];
      campaignTeamMemberId?: number[];
      campaignTagId?: number[];
      campaignClientId?: number[];
      replyTimeBetween?: [string, string];
    };
    sortBy?: string;
  } = {}): Promise<SmartleadApiResponse<any>> {
    // Build endpoint with query parameter
    // The request method will append api_key, so we include query params in the endpoint
    const endpoint = `/master-inbox/inbox-replies${options.fetch_message_history !== false ? '?fetch_message_history=true' : ''}`;
    
    // Build request body according to API spec
    const requestBody: any = {
      offset: options.offset || 0,
      limit: options.limit || 20,
    };
    
    if (options.filters) {
      requestBody.filters = options.filters;
    }
    
    if (options.sortBy) {
      requestBody.sortBy = options.sortBy;
    }
    
    return this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Reply to a lead from Master Inbox
   * 
   * API Reference: POST /api/v1/campaigns/{campaign_id}/reply-email-thread
   * Official Docs: https://api.smartlead.ai/reference/reply-to-lead-from-master-inbox-via-api
   * 
   * Note: This endpoint requires campaign_id in the path, not in the body
   */
  async replyToLeadFromMasterInbox(data: {
    campaign_id: number | string;
    email_stats_id: string;
    email_body: string;
    reply_message_id: string;
    reply_email_time: string;
    reply_email_body: string;
    cc?: string;
    bcc?: string;
    add_signature?: boolean;
    attachments?: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
    }>;
  }): Promise<SmartleadApiResponse<void>> {
    const { campaign_id, ...requestBody } = data;
    
    return this.request<{ ok: boolean }>(`/campaigns/${campaign_id}/reply-email-thread`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Fetch Unread Replies from Master Inbox
   * 
   * API Reference: POST /api/v1/master-inbox/unread-replies
   * Official Docs: https://api.smartlead.ai/reference/fetch-unread-replies
   */
  async fetchUnreadReplies(options: {
    offset?: number;
    limit?: number;
    fetch_message_history?: boolean;
  } = {}): Promise<SmartleadApiResponse<any>> {
    const endpoint = `/master-inbox/unread-replies${options.fetch_message_history !== false ? '?fetch_message_history=true' : ''}`;
    
    const requestBody: any = {
      offset: options.offset || 0,
      limit: options.limit || 20,
    };
    
    return this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Mark message as read/unread
   * 
   * API Reference: PATCH /api/v1/master-inbox/read-status
   */
  async updateReadStatus(data: {
    lead_id: string;
    email_stats_id: string;
    is_read: boolean;
  }): Promise<SmartleadApiResponse<void>> {
    return this.request<{ ok: boolean }>(`/master-inbox/read-status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(result => {
      if (result.success) {
        return { success: true } as SmartleadApiResponse<void>;
      }
      return result as SmartleadApiResponse<void>;
    });
  }

  /**
   * Fetch lead message history for Master Inbox
   * Note: This might be different from campaign message history
   */
  async getMasterInboxLead(leadId: string): Promise<SmartleadApiResponse<any>> {
    return this.request<any>(`/master-inbox/lead/${leadId}`);
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

