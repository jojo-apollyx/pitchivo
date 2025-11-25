/**
 * NeverBounce enrichment provider
 */

import { createClient } from '@supabase/supabase-js';

const NEVERBOUNCE_BASE_URL = 'https://api.neverbounce.com/v4';

/**
 * Enrich with NeverBounce
 */
export async function enrichWithNeverBounce(
  apiKey: string,
  stepName: string,
  entityType: 'organization' | 'contact' | 'item',
  entityId: string,
  config: any
): Promise<any> {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (stepName === 'validate_email') {
    // Get contact email
    const { data: contact, error } = await supabase
      .from('leads_contacts')
      .select('email')
      .eq('id', entityId)
      .single();

    if (error || !contact || !contact.email) {
      throw new Error('Contact not found or missing email');
    }

    // Call NeverBounce single email check
    const endpoint = config.endpoint || '/single/check';
    const url = `${NEVERBOUNCE_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        email: contact.email,
        credit_info: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`NeverBounce API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    // Map NeverBounce result to our email_status
    const resultMap: Record<string, string> = {
      'valid': 'valid',
      'invalid': 'invalid',
      'disposable': 'risky',
      'catchall': 'risky',
      'unknown': 'unknown',
    };

    const emailStatus = resultMap[data.result] || 'unknown';

    // Transform response
    return {
      email: data.email,
      email_status: emailStatus,
      result: data.result,
      flags: data.flags || [],
      suggested_correction: data.suggested_correction,
      credits_info: data.credits_info,
      execution_time: data.execution_time,
    };
  }

  throw new Error(`Unknown step name: ${stepName}`);
}

