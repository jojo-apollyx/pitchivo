export interface User {
  id: string
  email: string
  full_name?: string
  organization_id?: string
  organization_name?: string
  organization_domain?: string
  org_role?: 'marketing' | 'sales' | 'user'
  is_pitchivo_admin: boolean
  created_at: string
  status: 'active' | 'suspended'
}

