'use client'

import { useState, useEffect } from 'react'
import { InboxSidebar } from './inbox-sidebar'
import { MessageList } from './message-list'
import { MessageDetail } from './message-detail'
import { InboxThread, InboxMessage } from './types'
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

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThreadId && selectedThread && !selectedThread.is_read) {
      // Only mark as read if there are actually unread messages
      const hasUnreadReplies = selectedThread.messages.some(m => m.type === 'REPLY' && !m.is_read)
      if (hasUnreadReplies) {
        markThreadAsRead(selectedThread)
      }
    }
  }, [selectedThreadId]) // Only depend on selectedThreadId to avoid re-running when thread updates

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

  async function markThreadAsRead(thread: InboxThread) {
    // Find unread REPLY messages
    const unreadReplies = thread.messages
      .filter(m => m.type === 'REPLY' && !m.is_read)
    
    if (unreadReplies.length === 0) return

    // Note: Smartlead API doesn't have an endpoint to mark messages as read.
    // The read status from Smartlead (has_new_unread_email) will be updated 
    // when Smartlead processes the view, which will be reflected on the next API refresh.
    // Refresh after a delay to sync with Smartlead's state
    setTimeout(() => {
      fetchThreads()
    }, 2000)
  }

  function groupMessagesByLead(messages: any[]): InboxThread[] {
    const threadsMap = new Map<string, InboxThread>()
    
    if (!Array.isArray(messages)) return []

    // Helper function to extract domain from email
    function getEmailDomain(email: string): string {
      if (!email || !email.includes('@')) return email || 'unknown'
      return email.split('@')[1]?.toLowerCase() || email
    }

    // Helper function to generate thread key - group by company domain
    function getThreadKey(msg: any): string {
      const email = msg.email || msg.lead_email || ''
      const domain = getEmailDomain(email)
      
      // Group by domain (company) + campaign_id to keep campaigns separate
      // If client_id is set, also include it to separate clients
      const campaignId = msg.campaign_id || '0'
      const clientId = msg.client_id ? `_client_${msg.client_id}` : ''
      
      return `${domain}_campaign_${campaignId}${clientId}`
    }

    messages.forEach(msg => {
      const threadKey = getThreadKey(msg)
      const leadEmail = msg.email || msg.lead_email || ''
      const leadId = msg.lead_id || leadEmail
      const companyDomain = getEmailDomain(leadEmail)
      
      if (!threadsMap.has(threadKey)) {
        // Use the most recent lead's info for the thread header
        threadsMap.set(threadKey, {
          lead_id: threadKey, // Use threadKey as the unique identifier
          lead: {
            id: threadKey,
            first_name: msg.first_name || '',
            last_name: msg.last_name || '',
            email: leadEmail,
            company_name: companyDomain, // Use domain as company name
            campaign_id: parseInt(msg.campaign_id) || 0,
            client_id: msg.client_id || null
          },
          messages: [],
          last_message_at: msg.time || msg.received_at || new Date().toISOString(),
          is_read: true, // Will be updated based on unread messages
          unread_count: 0 // Will be updated based on unread messages
        })
      }
      const thread = threadsMap.get(threadKey)!
      
      // Check if message already exists (avoid duplicates)
      const messageExists = thread.messages.some(m => 
        m.id === msg.message_id || 
        (m.email_stats_id === msg.email_stats_id && m.received_at === (msg.time || msg.received_at))
      )
      
      if (!messageExists) {
        // Store original lead info in the message for display
        const messageLead = {
          id: leadId,
          first_name: msg.first_name || '',
          last_name: msg.last_name || '',
          email: leadEmail,
          company_name: getEmailDomain(leadEmail),
          campaign_id: parseInt(msg.campaign_id) || 0,
          client_id: msg.client_id || null
        }
        
        thread.messages.push({
          id: msg.message_id || msg.email_stats_id || `msg-${Date.now()}`,
          lead_id: threadKey, // Use threadKey to keep messages in same thread
          email_stats_id: msg.email_stats_id || msg.stats_id || '',
          campaign_id: parseInt(msg.campaign_id) || 0,
          subject: msg.subject || '',
          email_body: msg.email_body || '',
          received_at: msg.time || msg.received_at || new Date().toISOString(),
          is_read: msg.is_read !== false,
          type: (msg.type || 'REPLY') as 'SENT' | 'REPLY',
          lead: messageLead // Store individual lead info for each message
        })
        
        // Update thread lead info to show the most recent lead
        if (new Date(msg.time || msg.received_at || thread.last_message_at) >= new Date(thread.last_message_at)) {
          thread.lead = {
            ...thread.lead,
            first_name: msg.first_name || thread.lead.first_name,
            last_name: msg.last_name || thread.lead.last_name,
            email: leadEmail || thread.lead.email
          }
        }
        
        // Update thread metadata based on latest message
        const messageTime = new Date(msg.time || msg.received_at || thread.last_message_at)
        const threadTime = new Date(thread.last_message_at)
        if (messageTime > threadTime) {
          thread.last_message_at = msg.time || msg.received_at || thread.last_message_at
        }
      }
    })

    // After grouping all messages, determine thread read status
    threadsMap.forEach((thread) => {
      const unreadReplies = thread.messages.filter(m => m.type === 'REPLY' && !m.is_read)
      thread.unread_count = unreadReplies.length
      thread.is_read = unreadReplies.length === 0
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
          onSentMessage={(body) => {
            // Optimistically add sent message to the selected thread
            if (selectedThreadId) {
              setThreads(prevThreads => {
                return prevThreads.map(thread => {
                  if (thread.lead_id === selectedThreadId) {
                    const newMessage: InboxMessage = {
                      id: `optimistic-${Date.now()}`,
                      lead_id: thread.lead_id,
                      email_stats_id: thread.messages.find(m => m.type === 'SENT')?.email_stats_id || '',
                      campaign_id: thread.lead.campaign_id,
                      subject: thread.messages[thread.messages.length - 1]?.subject || '',
                      email_body: body,
                      received_at: new Date().toISOString(),
                      is_read: true,
                      type: 'SENT' as const,
                      lead: thread.lead
                    }
                    return {
                      ...thread,
                      messages: [...thread.messages, newMessage],
                      last_message_at: newMessage.received_at
                    }
                  }
                  return thread
                })
              })
            }
          }}
        />
      </div>
    </div>
  )
}

