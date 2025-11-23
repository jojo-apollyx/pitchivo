export interface InboxLead {
  id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  campaign_id: number
  client_id: number
  campaign_name?: string
  client_name?: string
}

export interface InboxMessage {
  id: string
  lead_id: string
  email_stats_id: string
  campaign_id: number
  subject: string
  email_body: string
  received_at: string // ISO string
  is_read: boolean
  type: 'SENT' | 'REPLY'
  lead: InboxLead
}

export interface InboxThread {
  lead_id: string
  lead: InboxLead
  messages: InboxMessage[]
  last_message_at: string
  is_read: boolean
  unread_count: number
}

