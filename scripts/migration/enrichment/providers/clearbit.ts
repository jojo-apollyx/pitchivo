/**
 * Clearbit enrichment provider
 */

import { createClient } from '@supabase/supabase-js';

const CLEARBIT_BASE_URL = 'https://person.clearbit.com';

/**
 * Enrich with Clearbit
 */
export async function enrichWithClearbit(
  apiKey: string,
  stepName: string,
  entityType: 'organization' | 'contact' | 'item',
  entityId: string,
  config: any
): Promise<any> {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (stepName === 'enrich_company_detailed') {
    // Get organization domain
    const { data: org, error } = await supabase
      .from('leads_organizations')
      .select('domain, name')
      .eq('id', entityId)
      .single();

    if (error || !org || !org.domain) {
      throw new Error('Organization not found or missing domain');
    }

    // Call Clearbit company enrichment
    const endpoint = config.endpoint || '/v2/companies/find';
    const url = `${CLEARBIT_BASE_URL.replace('/person', '')}${endpoint}?domain=${encodeURIComponent(org.domain)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { not_found: true };
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Clearbit API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Transform response
    return {
      name: data.name,
      legal_name: data.legalName,
      domain: data.domain,
      domain_aliases: data.domainAliases || [],
      site: data.site,
      category: data.category,
      industry: data.industry,
      tags: data.tags || [],
      description: data.description,
      founded_year: data.foundedYear,
      location: data.location,
      time_zone: data.timeZone,
      utc_offset: data.utcOffset,
      logo: data.logo,
      employees: data.employees,
      employees_range: data.employeesRange,
      revenue: data.metrics?.annualRevenue,
      raised: data.metrics?.raised,
      market_cap: data.metrics?.marketCap,
      tech: data.tech || [],
      phone: data.phone,
      linkedin: data.linkedin,
      twitter: data.twitter,
      crunchbase: data.crunchbase,
      facebook: data.facebook,
      angellist: data.angellist,
      alexa: data.alexa,
      tech_categories: data.techCategories || [],
      parent_domain: data.parent?.domain,
    };
  }

  if (stepName === 'enrich_contact_detailed') {
    // Get contact email
    const { data: contact, error } = await supabase
      .from('leads_contacts')
      .select('email, org_id')
      .eq('id', entityId)
      .single();

    if (error || !contact || !contact.email) {
      throw new Error('Contact not found or missing email');
    }

    // Call Clearbit person enrichment
    const endpoint = config.endpoint || '/v2/people/find';
    const url = `${CLEARBIT_BASE_URL}${endpoint}?email=${encodeURIComponent(contact.email)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { not_found: true };
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Clearbit API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Transform response
    return {
      id: data.id,
      name: data.name,
      given_name: data.name?.givenName,
      family_name: data.name?.familyName,
      email: data.email,
      location: data.location,
      time_zone: data.timeZone,
      utc_offset: data.utcOffset,
      geo: data.geo,
      bio: data.bio,
      site: data.site,
      avatar: data.avatar,
      employment: data.employment,
      facebook: data.facebook,
      github: data.github,
      twitter: data.twitter,
      linkedin: data.linkedin,
      googleplus: data.googleplus,
      aboutme: data.aboutme,
      angellist: data.angellist,
      klout: data.klout,
      verified: data.verified,
    };
  }

  throw new Error(`Unknown step name: ${stepName}`);
}

