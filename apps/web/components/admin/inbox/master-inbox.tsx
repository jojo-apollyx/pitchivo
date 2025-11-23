'use client'

import { useState, useEffect } from 'react'
import { InboxSidebar } from './inbox-sidebar'
import { MessageList } from './message-list'
import { MessageDetail } from './message-detail'
import { InboxThread } from './types'
import { toast } from 'sonner'

export function MasterInbox() {
  const [threads, setThreads] = useState<InboxThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  const selectedThread = threads.find(t => t.lead_id === selectedThreadId) || null

  useEffect(() => {
    fetchThreads()
  }, [filter, selectedClientId])

  async function fetchThreads() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'UNREAD') params.append('status', 'UNREAD')
      if (selectedClientId) params.append('client_id', selectedClientId.toString())
      
      const response = await fetch(`/api/admin/inbox?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch inbox')
      
      const data = await response.json()
      // Transform API response to InboxThread[] format
      // This mock transformation assumes API returns flat messages list for now
      // You'll need to adapt this based on actual API response structure
      const transformedThreads = groupMessagesByLead(data)
      setThreads(transformedThreads)
    } catch (error) {
      console.error('Error fetching inbox:', error)
      toast.error('Failed to load inbox')
    } finally {
      setIsLoading(false)
    }
  }

  function groupMessagesByLead(messages: any[]): InboxThread[] {
    const threadsMap = new Map<string, InboxThread>()
    
    if (!Array.isArray(messages)) return []

    messages.forEach(msg => {
      const leadId = msg.lead_id || msg.lead_email // Fallback to email if no lead_id
      if (!threadsMap.has(leadId)) {
        threadsMap.set(leadId, {
          lead_id: leadId,
          lead: {
            id: leadId,
            first_name: msg.first_name || '',
            last_name: msg.last_name || '',
            email: msg.email || msg.lead_email || '',
            company_name: msg.company_name || null,
            campaign_id: parseInt(msg.campaign_id) || 0,
            client_id: msg.client_id || null
          },
          messages: [],
          last_message_at: msg.time || msg.received_at || new Date().toISOString(),
          is_read: msg.is_read !== false, // Default to read if not specified
          unread_count: msg.is_read === false ? 1 : 0
        })
      }
      const thread = threadsMap.get(leadId)!
      
      // Check if message already exists (avoid duplicates)
      const messageExists = thread.messages.some(m => 
        m.id === msg.message_id || 
        (m.stats_id === msg.stats_id && m.received_at === (msg.time || msg.received_at))
      )
      
      if (!messageExists) {
        thread.messages.push({
          id: msg.message_id || msg.stats_id || `msg-${Date.now()}`,
          lead_id: leadId,
          email_stats_id: msg.email_stats_id || msg.stats_id,
          stats_id: msg.stats_id, // Add stats_id for compatibility
          campaign_id: parseInt(msg.campaign_id) || 0,
          subject: msg.subject || '',
          email_body: msg.email_body || '',
          received_at: msg.time || msg.received_at || new Date().toISOString(),
          time: msg.time || msg.received_at, // Add time alias
          is_read: msg.is_read !== false,
          type: msg.type || 'REPLY',
          message_id: msg.message_id, // Add message_id
          lead: thread.lead
        })
        
        // Update thread metadata based on latest message
        const messageTime = new Date(msg.time || msg.received_at || thread.last_message_at)
        const threadTime = new Date(thread.last_message_at)
        if (messageTime > threadTime) {
          thread.last_message_at = msg.time || msg.received_at || thread.last_message_at
        }
        
        // Update unread count
        if (msg.is_read === false && msg.type === 'REPLY') {
          thread.unread_count = Math.max(thread.unread_count, 1)
          thread.is_read = false
        }
      }
    })

    return Array.from(threadsMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-background rounded-lg border shadow-sm overflow-hidden">
      <div className="w-64 border-r bg-muted/10">
        <InboxSidebar 
          currentFilter={filter} 
          onFilterChange={setFilter}
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
        />
      </div>
      <div className="w-80 border-r bg-background">
        <MessageList 
          threads={threads} 
          selectedThreadId={selectedThreadId} 
          onSelectThread={setSelectedThreadId}
          isLoading={isLoading}
        />
      </div>
      <div className="flex-1 bg-background">
        <MessageDetail 
          thread={selectedThread} 
          onRefresh={fetchThreads}
        />
      </div>
    </div>
  )
}

