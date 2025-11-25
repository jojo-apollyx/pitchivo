/**
 * Transform MongoDB documents to Supabase format
 */

import { MongoCompanyLead, MongoProductLead, MongoPersonLead, MongoPurchaseLead, MongoIngredient } from './types';
import { extractDomain, normalizeName } from '../shared/utils';

/**
 * Transform MongoDB company to Supabase organization
 */
export function transformCompany(mongoDoc: MongoCompanyLead) {
  return {
    name: mongoDoc.name || '',
    normalized_name: normalizeName(mongoDoc.name),
    domain: extractDomain(mongoDoc.website_url),
    location_country: mongoDoc.address?.country || null,
    location_city: mongoDoc.address?.city || null,
    location_state: mongoDoc.address?.state || null,
    business_type: determineBusinessType(mongoDoc),
    industry_categories: mongoDoc.industries || [],
    profile_data: {
      description: mongoDoc.description,
      company_type: mongoDoc.company_type,
      categories: mongoDoc.categories || [],
      phone: mongoDoc.phone,
      email: mongoDoc.email,
      established_year: mongoDoc.established_year,
      estimated_employees: mongoDoc.estimated_employees,
      annual_revenue: mongoDoc.annual_revenue,
      certifications: mongoDoc.certifications || [],
      regulatory_compliance: mongoDoc.regulatory_compliance || [],
      linkedin_url: mongoDoc.linkedin_url,
      social_media: mongoDoc.social_media || [],
      logo_url: (mongoDoc as any).logo_url,
      slug: mongoDoc.slug,
      mongo_id: mongoDoc._id.toString(),
      original_company_id: mongoDoc.metadata?.original_company_id,
    },
  };
}

/**
 * Determine business type from company data
 */
function determineBusinessType(company: MongoCompanyLead): string[] {
  const types: string[] = [];
  const companyType = company.company_type?.toLowerCase() || '';
  const description = (company.description || '').toLowerCase();
  
  if (companyType.includes('manufacturer') || description.includes('manufactur')) {
    types.push('manufacturer');
  }
  if (companyType.includes('distributor') || description.includes('distribut')) {
    types.push('distributor');
  }
  if (companyType.includes('retailer') || description.includes('retail')) {
    types.push('retailer');
  }
  if (description.includes('service') || description.includes('consult')) {
    types.push('service_provider');
  }
  if (description.includes('logistics') || description.includes('transport')) {
    types.push('logistics');
  }
  
  // Default to manufacturer if no type found
  if (types.length === 0) {
    types.push('manufacturer');
  }
  
  return types;
}

/**
 * Transform MongoDB product to Supabase market item
 */
export function transformProduct(mongoDoc: MongoProductLead | MongoIngredient) {
  const isIngredient = 'override_type' in mongoDoc 
    ? mongoDoc.override_type === 'ingredient'
    : mongoDoc.is_ingredient === true;
  
  return {
    name: mongoDoc.name || '',
    normalized_name: normalizeName(mongoDoc.name),
    category: mongoDoc.categories?.[0] || null,
    item_type: isIngredient ? 'ingredient' : 'product',
    aliases: mongoDoc.name_aliases || [],
    attributes: {
      description: mongoDoc.description,
      form: mongoDoc.form,
      concentration: mongoDoc.concentration,
      processing_method: mongoDoc.processing_method,
      grade: mongoDoc.grade,
      categories: mongoDoc.categories || [],
      applications: mongoDoc.applications || [],
      end_uses: mongoDoc.end_uses || [],
      specifications: (mongoDoc as MongoProductLead).specifications || {},
      certifications: mongoDoc.certifications || [],
      mongo_id: mongoDoc._id.toString(),
      product_id: 'product_id' in mongoDoc ? mongoDoc.product_id : undefined,
      slug: 'slug' in mongoDoc ? mongoDoc.slug : undefined,
    },
  };
}

/**
 * Transform MongoDB person to Supabase contact
 */
export function transformContact(
  mongoDoc: MongoPersonLead,
  orgId: string | null
) {
  return {
    org_id: orgId,
    first_name: mongoDoc.first_name || null,
    last_name: mongoDoc.last_name || null,
    email: mongoDoc.email || null,
    linkedin_url: mongoDoc.linkedin_url || null,
    title: mongoDoc.title || null,
    email_status: mapEmailStatus(mongoDoc.email_status),
    is_current: mongoDoc.is_active !== false,
    attributes: {
      phone: mongoDoc.phone,
      department: mongoDoc.department,
      role: mongoDoc.role,
      seniority_level: mongoDoc.seniority_level,
      twitter_url: mongoDoc.twitter_url,
      lead_source: mongoDoc.lead_source,
      source_url: mongoDoc.source_url,
      is_likely_to_engage: mongoDoc.is_likely_to_engage,
      mongo_id: mongoDoc._id.toString(),
    },
  };
}

/**
 * Map MongoDB email status to Supabase email status
 */
function mapEmailStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    'valid': 'valid',
    'invalid': 'invalid',
    'bounced': 'bounced',
    'pending': 'unknown',
  };
  
  return statusMap[status || ''] || 'unknown';
}

/**
 * Transform MongoDB purchase to Supabase signal
 */
export function transformPurchase(
  mongoDoc: MongoPurchaseLead,
  orgId: string | null,
  itemId: string | null
) {
  return {
    org_id: orgId,
    item_id: itemId,
    contact_id: null,
    interaction_type: 'purchased',
    event_date: mongoDoc.purchase_date?.$date 
      ? new Date(mongoDoc.purchase_date.$date).toISOString().split('T')[0]
      : null,
    source: 'MongoDB Migration',
    metadata: {
      product_name: mongoDoc.product_name,
      product_description: mongoDoc.product_description,
      form: mongoDoc.form,
      concentration: mongoDoc.concentration,
      concentration_unit: mongoDoc.concentration_unit,
      processing_method: mongoDoc.processing_method,
      grade: mongoDoc.grade,
      quantity: mongoDoc.quantity,
      total_amount: mongoDoc.total_amount,
      unit_price: mongoDoc.unit_price,
      unit_type: mongoDoc.unit_type,
      currency: mongoDoc.currency,
      categories: mongoDoc.categories || [],
      applications: mongoDoc.applications || [],
      end_uses: mongoDoc.end_uses || [],
    },
    raw_data: mongoDoc as any,
    is_verified: false,
  };
}

/**
 * Parse MongoDB date object
 */
export function parseMongoDate(dateObj?: { $date: string }): Date | null {
  if (!dateObj || !dateObj.$date) return null;
  return new Date(dateObj.$date);
}

