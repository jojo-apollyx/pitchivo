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

export type UserProfileWithOrg = Database['public']['Views']['user_profile_with_org']['Row']
export type OrganizationMember = Database['public']['Views']['organization_members']['Row']
export type WaitlistStatusView = Database['public']['Views']['waitlist_status']['Row']

