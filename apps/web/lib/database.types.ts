/**
 * Database type definitions for Supabase
 * Generated from the database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      email_domain_policy: {
        Row: {
          id: string
          domain: string
          status: 'blocked' | 'whitelisted' | 'allowed'
          reason: string | null
          invited_by: string | null
          invited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          status?: 'blocked' | 'whitelisted' | 'allowed'
          reason?: string | null
          invited_by?: string | null
          invited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          status?: 'blocked' | 'whitelisted' | 'allowed'
          reason?: string | null
          invited_by?: string | null
          invited_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          email: string
          full_name: string
          company: string
          role: string | null
          note: string | null
          status: 'pending' | 'approved' | 'rejected' | 'invited'
          invited_at: string | null
          invited_by: string | null
          invitation_email_sent_at: string | null
          email_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          company: string
          role?: string | null
          note?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'invited'
          invited_at?: string | null
          invited_by?: string | null
          invitation_email_sent_at?: string | null
          email_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          company?: string
          role?: string | null
          note?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'invited'
          invited_at?: string | null
          invited_by?: string | null
          invitation_email_sent_at?: string | null
          email_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          domain: string
          name: string
          slug: string
          logo_url: string | null
          onboarding_completed_at: string | null
          settings: Json
          industry: string | null
          company_size: string | null
          description: string | null
          use_cases: string[]
          primary_color: string
          secondary_color: string
          accent_color: string
          pitchivo_domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          name: string
          slug: string
          logo_url?: string | null
          onboarding_completed_at?: string | null
          settings?: Json
          industry?: string | null
          company_size?: string | null
          description?: string | null
          use_cases?: string[]
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          pitchivo_domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          name?: string
          slug?: string
          logo_url?: string | null
          onboarding_completed_at?: string | null
          settings?: Json
          industry?: string | null
          company_size?: string | null
          description?: string | null
          use_cases?: string[]
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          pitchivo_domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_pitchivo_admin: boolean
          org_role: string | null
          organization_id: string | null
          domain: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_pitchivo_admin?: boolean
          org_role?: 'marketing' | 'sales' | 'user' | null
          organization_id?: string | null
          domain: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_pitchivo_admin?: boolean
          org_role?: 'marketing' | 'sales' | 'user' | null
          organization_id?: string | null
          domain?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      industries: {
        Row: {
          industry_code: string
          industry_name: string
          description: string | null
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          industry_code: string
          industry_name: string
          description?: string | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          industry_code?: string
          industry_name?: string
          description?: string | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_templates: {
        Row: {
          template_id: string
          industry_code: string
          template_name: string | null
          schema_json: Json
          version: string | null
          is_active: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          template_id?: string
          industry_code: string
          template_name?: string | null
          schema_json?: Json
          version?: string | null
          is_active?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          template_id?: string
          industry_code?: string
          template_name?: string | null
          schema_json?: Json
          version?: string | null
          is_active?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          product_id: string
          org_id: string
          product_name: string
          industry_code: string
          template_id: string | null
          template_version_snapshot: Json | null
          status: 'draft' | 'published'
          created_at: string
          updated_at: string
        }
        Insert: {
          product_id?: string
          org_id: string
          product_name: string
          industry_code: string
          template_id?: string | null
          template_version_snapshot?: Json | null
          status?: 'draft' | 'published'
          created_at?: string
          updated_at?: string
        }
        Update: {
          product_id?: string
          org_id?: string
          product_name?: string
          industry_code?: string
          template_id?: string | null
          template_version_snapshot?: Json | null
          status?: 'draft' | 'published'
          created_at?: string
          updated_at?: string
        }
      }
      document_extractions: {
        Row: {
          id: string
          content_hash: string
          filename: string
          file_size: number
          mime_type: string
          storage_path: string
          organization_id: string
          uploaded_by: string
          raw_extracted_data: Json | null
          file_summary: Json | null
          extracted_values: Json | null
          reviewed_values: Json | null
          user_corrections: Json | null
          analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed'
          review_status: 'pending_review' | 'reviewed'
          error_message: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          reference_count: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_hash: string
          filename: string
          file_size: number
          mime_type: string
          storage_path: string
          organization_id: string
          uploaded_by: string
          raw_extracted_data?: Json | null
          file_summary?: Json | null
          extracted_values?: Json | null
          reviewed_values?: Json | null
          user_corrections?: Json | null
          analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          review_status?: 'pending_review' | 'reviewed'
          error_message?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          reference_count?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_hash?: string
          filename?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          organization_id?: string
          uploaded_by?: string
          raw_extracted_data?: Json | null
          file_summary?: Json | null
          extracted_values?: Json | null
          reviewed_values?: Json | null
          user_corrections?: Json | null
          analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          review_status?: 'pending_review' | 'reviewed'
          error_message?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          reference_count?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_field_applications: {
        Row: {
          id: string
          product_id: string
          file_id: string
          fields_applied: string[]
          applied_by: string
          applied_at: string
        }
        Insert: {
          id?: string
          product_id: string
          file_id: string
          fields_applied?: string[]
          applied_by: string
          applied_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          file_id?: string
          fields_applied?: string[]
          applied_by?: string
          applied_at?: string
        }
      }
    }
    Views: {
      user_profile_with_org: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_pitchivo_admin: boolean
          org_role: string | null
          domain: string
          metadata: Json
          created_at: string
          updated_at: string
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          organization_logo_url: string | null
          organization_onboarding_completed_at: string | null
          organization_settings: Json | null
        }
      }
      organization_members: {
        Row: {
          organization_id: string
          organization_name: string
          organization_domain: string
          organization_onboarding_completed_at: string | null
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_pitchivo_admin: boolean
          user_role: 'marketing' | 'sales' | 'user' | null
          member_since: string
        }
      }
      waitlist_status: {
        Row: {
          id: string
          email: string
          full_name: string
          company: string
          role: string | null
          note: string | null
          status: 'pending' | 'approved' | 'rejected' | 'invited'
          invited_at: string | null
          invitation_email_sent_at: string | null
          email_sent_at: string | null
          created_at: string
          domain: string
          has_account: boolean
          is_whitelisted: boolean
          domain_policy_id: string | null
          domain_invited_by: string | null
          domain_invited_at: string | null
        }
      }
    }
    Functions: {
      extract_email_domain: {
        Args: {
          email: string
        }
        Returns: string
      }
      is_email_domain_blocked: {
        Args: {
          email: string
        }
        Returns: boolean
      }
      is_email_domain_whitelisted: {
        Args: {
          email: string
        }
        Returns: boolean
      }
      get_or_create_organization: {
        Args: {
          email: string
          company_name?: string
        }
        Returns: string
      }
      is_user_whitelisted: {
        Args: {
          email: string
        }
        Returns: boolean
      }
      can_user_login: {
        Args: {
          email: string
        }
        Returns: boolean
      }
      complete_organization_onboarding: {
        Args: {
          p_organization_id: string
        }
        Returns: boolean
      }
      get_organization_member_count: {
        Args: {
          org_id: string
        }
        Returns: number
      }
      whitelist_domain: {
        Args: {
          p_domain: string
          p_waitlist_id?: string
          p_invited_by?: string
          p_reason?: string
        }
        Returns: string
      }
      send_invitation_email: {
        Args: {
          p_waitlist_id: string
          p_invited_by?: string
        }
        Returns: string
      }
    }
  }
}

// Type helpers
export type WaitlistStatus = 'pending' | 'approved' | 'rejected' | 'invited'
export type EmailDomainStatus = 'blocked' | 'whitelisted' | 'allowed'
export type OrgRole = 'marketing' | 'sales' | 'user'

export type WaitlistEntry = Database['public']['Tables']['waitlist']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type EmailDomainPolicy = Database['public']['Tables']['email_domain_policy']['Row']
export type Industry = Database['public']['Tables']['industries']['Row']
export type ProductTemplate = Database['public']['Tables']['product_templates']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type DocumentExtraction = Database['public']['Tables']['document_extractions']['Row']
export type ProductFieldApplication = Database['public']['Tables']['product_field_applications']['Row']

export type UserProfileWithOrg = Database['public']['Views']['user_profile_with_org']['Row']
export type OrganizationMember = Database['public']['Views']['organization_members']['Row']
export type WaitlistStatusView = Database['public']['Views']['waitlist_status']['Row']

