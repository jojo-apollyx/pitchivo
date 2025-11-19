'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, CheckCircle, Eye, MousePointerClick, XCircle, AlertCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EmailEvent {
  event_id: string
  event_type: string
  event_timestamp: string
  metadata: {
    device_used?: string
    user_agent?: string
    link?: string
    reason?: string
    ip?: string
    [key: string]: any
  }
}

interface ScheduledEmail {
  scheduled_email_id: string
  campaign_id: string
  recipient_email: string
  recipient_name?: string
  recipient_company?: string
  subject: string
  status: string
  scheduled_time: string
  sent_at?: string
  brevo_message_id?: string
  brevo_status?: string
}

interface EmailEventHistoryProps {
  scheduledEmailId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EVENT_ICONS: Record<string, any> = {
  sent: Mail,
  delivered: CheckCircle,
  opened: Eye,
  unique_opened: Eye,
  first_opening: Eye,
  clicked: MousePointerClick,
  hard_bounced: XCircle,
  soft_bounced: AlertCircle,
  blocked: XCircle,
  error: XCircle,
  complaint: AlertCircle,
  unsubscribed: XCircle,
  deferred: Clock,
}

const EVENT_COLORS: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  opened: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  unique_opened: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  first_opening: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  clicked: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  hard_bounced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  soft_bounced: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  complaint: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  unsubscribed: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  deferred: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
}

const EVENT_LABELS: Record<string, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  opened: 'Opened',
  unique_opened: 'Unique Open',
  first_opening: 'First Open',
  clicked: 'Clicked',
  hard_bounced: 'Hard Bounced',
  soft_bounced: 'Soft Bounced',
  blocked: 'Blocked',
  error: 'Error',
  complaint: 'Spam Report',
  unsubscribed: 'Unsubscribed',
  deferred: 'Deferred',
}

export function EmailEventHistory({ scheduledEmailId, open, onOpenChange }: EmailEventHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [scheduledEmail, setScheduledEmail] = useState<ScheduledEmail | null>(null)
  const [events, setEvents] = useState<EmailEvent[]>([])

  useEffect(() => {
    if (open && scheduledEmailId) {
      loadEventHistory()
    }
  }, [scheduledEmailId, open])

  async function loadEventHistory() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/campaigns/email-events/${scheduledEmailId}`)
      if (!response.ok) {
        throw new Error('Failed to load event history')
      }
      
      const data = await response.json()
      setScheduledEmail(data.scheduledEmail)
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error loading event history:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatEventTime(timestamp: string) {
    const date = new Date(timestamp)
    return {
      absolute: date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Event History</DialogTitle>
          <DialogDescription>
            Timeline of all events for this email
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Details */}
            {scheduledEmail && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{scheduledEmail.recipient_email}</h3>
                    <p className="text-sm text-muted-foreground">
                      {scheduledEmail.recipient_name && `${scheduledEmail.recipient_name} • `}
                      {scheduledEmail.recipient_company}
                    </p>
                  </div>
                  <Badge 
                    variant={scheduledEmail.status === 'sent' ? 'default' : 'secondary'}
                  >
                    {scheduledEmail.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Subject:</strong> {scheduledEmail.subject}
                </div>
                {scheduledEmail.brevo_message_id && (
                  <div className="text-xs text-muted-foreground font-mono">
                    Message ID: {scheduledEmail.brevo_message_id}
                  </div>
                )}
              </div>
            )}

            {/* Event Timeline */}
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No events recorded yet.</p>
                <p className="text-sm mt-2">Events will appear here once the email is sent and tracked by Brevo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Event Timeline ({events.length})
                </h4>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {/* Events */}
                  <div className="space-y-6">
                    {events.map((event, index) => {
                      const Icon = EVENT_ICONS[event.event_type] || Clock
                      const colorClass = EVENT_COLORS[event.event_type] || 'bg-gray-100 text-gray-700'
                      const label = EVENT_LABELS[event.event_type] || event.event_type
                      const time = formatEventTime(event.event_timestamp)

                      return (
                        <div key={event.event_id} className="relative pl-14">
                          {/* Event icon */}
                          <div className={`absolute left-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          {/* Event content */}
                          <div className="bg-card border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold">{label}</h5>
                                <p className="text-sm text-muted-foreground">{time.relative}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {time.absolute}
                            </div>

                            {/* Event metadata */}
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-3 space-y-1">
                                {event.metadata.device_used && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Device:</span>{' '}
                                    <span className="font-medium">{event.metadata.device_used}</span>
                                  </div>
                                )}
                                {event.metadata.link && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Link:</span>{' '}
                                    <a 
                                      href={event.metadata.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline break-all"
                                    >
                                      {event.metadata.link}
                                    </a>
                                  </div>
                                )}
                                {event.metadata.reason && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Reason:</span>{' '}
                                    <span className="font-medium">{event.metadata.reason}</span>
                                  </div>
                                )}
                                {event.metadata.ip && (
                                  <div className="text-sm text-muted-foreground">
                                    IP: {event.metadata.ip}
                                  </div>
                                )}
                                {event.metadata.user_agent && (
                                  <div className="text-xs text-muted-foreground truncate" title={event.metadata.user_agent}>
                                    User Agent: {event.metadata.user_agent}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

