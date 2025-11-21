'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Mail, 
  Search, 
  RefreshCw, 
  Eye,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  AlertCircle,
  Ban,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface EmailEvent {
  event_id: string
  message_id: string
  recipient_email: string
  subject: string
  event_type: string
  event_date: string
  metadata: any
  created_at: string
}

interface EmailWithEvents {
  message_id: string
  recipient_email: string
  subject: string
  sent_at: string
  events: EmailEvent[]
  latest_event: string
}

export function BrevoEmailHistory() {
  const [emails, setEmails] = useState<EmailWithEvents[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<EmailWithEvents | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    loadEmailHistory()
  }, [])

  async function loadEmailHistory() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/brevo/history')
      if (!response.ok) throw new Error('Failed to load email history')
      
      const data = await response.json()
      setEmails(data.emails || [])
    } catch (error) {
      console.error('Error loading email history:', error)
      toast.error('Failed to load email history')
    } finally {
      setLoading(false)
    }
  }

  function handleViewDetails(email: EmailWithEvents) {
    setSelectedEmail(email)
    setDetailsOpen(true)
  }

  const filteredEmails = emails.filter(email => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      email.recipient_email.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.message_id.toLowerCase().includes(query)
    )
  })

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'opened':
      case 'open':
        return <Mail className="h-4 w-4 text-blue-600" />
      case 'clicked':
      case 'click':
        return <MousePointerClick className="h-4 w-4 text-purple-600" />
      case 'bounced':
      case 'hard_bounce':
      case 'soft_bounce':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'spam':
      case 'complaint':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'unsubscribed':
        return <Ban className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Delivered</Badge>
      case 'opened':
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Opened</Badge>
      case 'clicked':
      case 'click':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300">Clicked</Badge>
      case 'bounced':
      case 'hard_bounce':
      case 'soft_bounce':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Bounced</Badge>
      case 'spam':
      case 'complaint':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Spam</Badge>
      case 'unsubscribed':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Unsubscribed</Badge>
      default:
        return <Badge variant="outline">{eventType}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading email history...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Delivery History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track all emails sent via Brevo with delivery events
          </p>
        </div>
        <Button onClick={loadEmailHistory} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by recipient, subject, or message ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No emails match your search' : 'No emails sent yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmails.map((email) => (
            <div
              key={email.message_id}
              className="bg-card rounded-lg border border-border/30 hover:border-primary/30 transition-all p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold truncate">{email.subject}</span>
                    {getEventBadge(email.latest_event)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>To: <span className="font-mono">{email.recipient_email}</span></div>
                    <div>Sent: {format(new Date(email.sent_at), 'PPp')}</div>
                    <div className="text-xs">Message ID: {email.message_id}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(email)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Delivery Details</DialogTitle>
            <DialogDescription>
              Complete event timeline for this email
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-6">
              {/* Email Info */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Subject:</span>
                  <p className="font-semibold">{selectedEmail.subject}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Recipient:</span>
                  <p className="font-mono text-sm">{selectedEmail.recipient_email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Sent At:</span>
                  <p className="text-sm">{format(new Date(selectedEmail.sent_at), 'PPpp')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Message ID:</span>
                  <p className="font-mono text-xs">{selectedEmail.message_id}</p>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="font-semibold mb-4">Event Timeline</h4>
                {selectedEmail.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEmail.events.map((event, index) => (
                      <div
                        key={event.event_id}
                        className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border/30"
                      >
                        <div className="mt-0.5">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getEventBadge(event.event_type)}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.event_date), 'PPpp')}
                            </span>
                          </div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <details className="text-xs text-muted-foreground mt-2">
                              <summary className="cursor-pointer hover:text-foreground">
                                View metadata
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

