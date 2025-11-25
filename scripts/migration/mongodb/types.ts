/**
 * MongoDB-specific types for migration
 */

import { ObjectId } from 'mongodb';

/**
 * MongoDB Company Lead document structure
 */
export interface MongoCompanyLead {
  _id: ObjectId;
  name: string;
  slug?: string;
  website_url?: string;
  description?: string;
  company_type?: string;
  categories?: string[];
  industries?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    raw_address?: string;
  };
  phone?: string;
  email?: string;
  established_year?: number;
  estimated_employees?: number;
  annual_revenue?: number | null;
  certifications?: string[];
  regulatory_compliance?: string[];
  linkedin_url?: string;
  social_media?: string[];
  products?: MongoProduct[];
  key_contacts?: MongoKeyContact[];
  lead_source?: string;
  source_url?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: { $date: string };
  updated_at?: { $date: string };
  last_scraped_at?: { $date: string } | null;
  persons?: Array<{ $ref: string; $id: { $oid: string } }>;
  products_detailed?: any[];
}

/**
 * MongoDB Product Lead document structure
 */
export interface MongoProductLead {
  _id: ObjectId;
  name: string;
  description?: string;
  company?: {
    $ref: string;
    $id: { $oid: string };
  };
  ingredient?: {
    $ref: string;
    $id: { $oid: string };
  };
  ingredient_base_name?: string;
  form?: string | null;
  concentration?: string | null;
  processing_method?: string | null;
  grade?: string;
  name_aliases?: string[];
  categories?: string[];
  applications?: string[];
  end_uses?: string[];
  specifications?: Record<string, any>;
  certifications?: string[];
  pricing_info?: any;
  availability_regions?: string[];
  is_ingredient?: boolean;
  is_finished_product?: boolean;
  analyzed_ingredients?: string[];
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: { $date: string };
  updated_at?: { $date: string };
  last_updated_from_source?: { $date: string } | null;
}

/**
 * MongoDB Person Lead document structure
 */
export interface MongoPersonLead {
  _id: ObjectId;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  role?: string;
  seniority_level?: string;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  company?: {
    $ref: string;
    $id: { $oid: string };
  };
  lead_source?: string;
  source_url?: string;
  is_likely_to_engage?: boolean | null;
  email_status?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: { $date: string };
  updated_at?: { $date: string };
  last_contacted_at?: { $date: string } | null;
}

/**
 * MongoDB Purchase Lead document structure
 */
export interface MongoPurchaseLead {
  _id: ObjectId;
  buyer_company?: {
    $ref: string;
    $id: { $oid: string };
  };
  ingredient_base_name?: string;
  product_name?: string;
  product_description?: string;
  categories?: string[];
  applications?: string[];
  end_uses?: string[];
  form?: string;
  concentration?: string;
  concentration_unit?: string;
  processing_method?: string;
  grade?: string | null;
  name_aliases?: string[];
  product_source?: string;
  product_variant?: string;
  purchase_date?: { $date: string };
  quantity?: number | null;
  total_amount?: number | null;
  unit_price?: number | null;
  unit_type?: string | null;
  currency?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: { $date: string };
  updated_at?: { $date: string };
}

/**
 * MongoDB Ingredient document structure
 */
export interface MongoIngredient {
  _id: ObjectId;
  product_id?: number;
  name: string;
  description?: string;
  slug?: string;
  banner_url?: string;
  logo_url?: string;
  product_image_urls?: string[];
  number_of_suppliers?: number;
  categories?: string[];
  tags?: string[];
  status?: string;
  documents?: any[];
  created_at?: { $date: string };
  updated_at?: { $date: string };
  created_by?: string | null;
  last_indexed_at?: { $date: string };
  override_type?: string;
}

/**
 * Helper types
 */
export interface MongoProduct {
  name: string;
  description?: string;
  ingredient_base_name?: string;
  form?: string | null;
  concentration?: string | null;
  processing_method?: string | null;
  grade?: string;
  name_alias?: string;
  product_certifications?: string[];
  categories?: string[];
  applications?: string[];
  metadata?: Record<string, any>;
}

export interface MongoKeyContact {
  name: string;
  position?: string;
  email?: string;
  phone?: string | null;
  linkedin_url?: string | null;
  department?: string | null;
}

/**
 * ID mapping for MongoDB to Supabase
 */
export interface IdMapping {
  mongoId: string;
  supabaseId: string;
}

