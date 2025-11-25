/**
 * Hunter.io enrichment provider
 */

import { createClient } from '@supabase/supabase-js';

const HUNTER_IO_BASE_URL = 'https://api.hunter.io/v2';

/**
 * Enrich with Hunter.io
 */
export async function enrichWithHunterIO(
  apiKey: string,
  stepName: string,
  entityType: 'organization' | 'contact' | 'item',
  entityId: string,
  config: any
): Promise<any> {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (stepName === 'validate_domain' || stepName === 'enrich_company_basic') {
    // Get organization domain
    const { data: org, error } = await supabase
      .from('leads_organizations')
      .select('domain, name')
      .eq('id', entityId)
      .single();

    if (error || !org || !org.domain) {
      throw new Error('Organization not found or missing domain');
    }

    // Call Hunter.io domain search
    const endpoint = config.endpoint || '/domain-search';
    const url = `${HUNTER_IO_BASE_URL}${endpoint}?domain=${encodeURIComponent(org.domain)}&api_key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Hunter.io API error: ${errorData.errors?.[0]?.details || response.statusText}`);
    }

    const data = await response.json();

    // Transform response
    return {
      domain: data.data?.domain,
      disposable: data.data?.disposable,
      webmail: data.data?.webmail,
      pattern: data.data?.pattern,
      emails: data.data?.emails || [],
      linked_domains: data.data?.linked_domains || [],
      company: data.data?.company,
      country: data.data?.country,
      sources: data.data?.sources || [],
    };
  }

  if (stepName === 'enrich_contact_basic') {
    // Get contact email
    const { data: contact, error } = await supabase
      .from('leads_contacts')
      .select('email, org_id')
      .eq('id', entityId)
      .single();

    if (error || !contact || !contact.email) {
      throw new Error('Contact not found or missing email');
    }

    // Get organization domain
    let domain: string | null = null;
    if (contact.org_id) {
      const { data: org } = await supabase
        .from('leads_organizations')
        .select('domain')
        .eq('id', contact.org_id)
        .single();
      domain = org?.domain || null;
    }

    // Call Hunter.io email finder
    const endpoint = config.endpoint || '/email-finder';
    const params = new URLSearchParams({
      api_key: apiKey,
      email: contact.email,
    });
    if (domain) {
      params.append('domain', domain);
    }

    const url = `${HUNTER_IO_BASE_URL}${endpoint}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Hunter.io API error: ${errorData.errors?.[0]?.details || response.statusText}`);
    }

    const data = await response.json();

    // Transform response
    return {
      email: data.data?.email,
      first_name: data.data?.first_name,
      last_name: data.data?.last_name,
      full_name: data.data?.full_name,
      gender: data.data?.gender,
      country: data.data?.country,
      position: data.data?.position,
      twitter: data.data?.twitter,
      linkedin: data.data?.linkedin,
      phone_number: data.data?.phone_number,
      company: data.data?.company,
      sources: data.data?.sources || [],
      score: data.data?.score,
      verification: data.data?.verification,
    };
  }

  throw new Error(`Unknown step name: ${stepName}`);
}

