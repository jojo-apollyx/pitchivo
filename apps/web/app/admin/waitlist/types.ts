export interface WaitlistEntry {
  id: string
  email: string
  full_name: string
  company: string
  role?: string
  note?: string
  status: 'pending' | 'approved' | 'rejected' | 'invited'
  created_at: string
}

