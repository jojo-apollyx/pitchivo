export interface BlockedDomain {
  id: string
  domain: string
  status: 'blocked' | 'whitelisted' | 'allowed'
  is_public_domain?: boolean
  reason?: string
  created_at: string
  updated_at: string
}

