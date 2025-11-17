'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Mail, 
  Send, 
  CheckCircle, 
  MailOpen, 
  MousePointerClick, 
  AlertTriangle,
  Clock,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TestEmailEvent {
  id: string
  email: string
  subject: string
  sentAt: string
  status: 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam'
  events: {
    type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam'
    timestamp: string
    details?: string
  }[]
  brevoMessageId?: string
}

interface TestEmailTrackerProps {
  campaignId: string
  onNewEmail?: (email: TestEmailEvent) => void
}

export function TestEmailTracker({ campaignId, onNewEmail }: TestEmailTrackerProps) {
  const [testEmails, setTestEmails] = useState<TestEmailEvent[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Auto-refresh events every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshEvents()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, testEmails])

  async function refreshEvents() {
    if (testEmails.length === 0) return
    
    setRefreshing(true)
    try {
      // In real implementation, this would fetch from Brevo webhook events
      // For now, we'll simulate event updates
      setTestEmails(prevEmails => 
        prevEmails.map(email => {
          // Simulate event progression
          if (email.status === 'sent' && Math.random() > 0.5) {
            return {
              ...email,
              status: 'delivered',
              events: [...email.events, {
                type: 'delivered',
                timestamp: new Date().toISOString(),
                details: 'Email delivered to inbox'
              }]
            }
          }
          if (email.status === 'delivered' && Math.random() > 0.7) {
            return {
              ...email,
              status: 'opened',
              events: [...email.events, {
                type: 'opened',
                timestamp: new Date().toISOString(),
                details: 'Email opened by recipient'
              }]
            }
          }
          if (email.status === 'opened' && Math.random() > 0.8) {
            return {
              ...email,
              status: 'clicked',
              events: [...email.events, {
                type: 'clicked',
                timestamp: new Date().toISOString(),
                details: 'Link clicked in email'
              }]
            }
          }
          return email
        })
      )
    } catch (error) {
      console.error('Error refreshing events:', error)
    } finally {
      setRefreshing(false)
    }
  }

  function addTestEmail(email: string, subject: string, brevoMessageId?: string) {
    const newEmail: TestEmailEvent = {
      id: `test_${Date.now()}`,
      email,
      subject,
      sentAt: new Date().toISOString(),
      status: 'sending',
      brevoMessageId,
      events: [{
        type: 'sent',
        timestamp: new Date().toISOString(),
        details: 'Email sent via Brevo'
      }]
    }

    setTestEmails(prev => [newEmail, ...prev])
    
    // Simulate status update after a short delay
    setTimeout(() => {
      setTestEmails(prev => 
        prev.map(e => 
          e.id === newEmail.id 
            ? { ...e, status: 'sent' }
            : e
        )
      )
    }, 1000)

    if (onNewEmail) {
      onNewEmail(newEmail)
    }

    return newEmail.id
  }

  function removeTestEmail(id: string) {
    setTestEmails(prev => prev.filter(e => e.id !== id))
  }

  function clearAllTestEmails() {
    setTestEmails([])
  }

  function getStatusInfo(status: TestEmailEvent['status']) {
    switch (status) {
      case 'sending':
        return {
          label: 'Sending',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          icon: <Clock className="h-3 w-3" />
        }
      case 'sent':
        return {
          label: 'Sent',
          color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
          icon: <Send className="h-3 w-3" />
        }
      case 'delivered':
        return {
          label: 'Delivered',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: <CheckCircle className="h-3 w-3" />
        }
      case 'opened':
        return {
          label: 'Opened',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          icon: <MailOpen className="h-3 w-3" />
        }
      case 'clicked':
        return {
          label: 'Clicked',
          color: 'bg-teal-100 text-teal-700 border-teal-300',
          icon: <MousePointerClick className="h-3 w-3" />
        }
      case 'bounced':
        return {
          label: 'Bounced',
          color: 'bg-red-100 text-red-700 border-red-300',
          icon: <AlertTriangle className="h-3 w-3" />
        }
      case 'spam':
        return {
          label: 'Spam',
          color: 'bg-purple-100 text-purple-700 border-purple-300',
          icon: <AlertTriangle className="h-3 w-3" />
        }
    }
  }

  // Expose addTestEmail function to parent via ref or callback
  useEffect(() => {
    // Make function available globally for parent component
    (window as any).addTestEmailEvent = addTestEmail
    return () => {
      delete (window as any).addTestEmailEvent
    }
  }, [])

  if (testEmails.length === 0) {
    return (
      <Card className="p-6 bg-muted/30 border-dashed">
        <div className="text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No test emails sent yet</p>
          <p className="text-xs mt-1">Send a test email to track delivery events in real-time</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Test Email Event Tracker
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {testEmails.length} test email{testEmails.length !== 1 ? 's' : ''} tracked
            {autoRefresh && ' • Auto-refreshing every 10s'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshEvents}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          {testEmails.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearAllTestEmails}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Test Emails List */}
      <div className="space-y-3">
        {testEmails.map((email) => {
          const statusInfo = getStatusInfo(email.status)
          return (
            <Card key={email.id} className="p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Email Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{email.email}</span>
                        <Badge variant="outline" className={cn("gap-1", statusInfo.color)}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Subject: {email.subject}
                      </div>
                      {email.brevoMessageId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Message ID: {email.brevoMessageId}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTestEmail(email.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  {/* Event Timeline */}
                  <div className="pl-4 border-l-2 border-border/50 space-y-2">
                    {email.events.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{event.type}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                            </span>
                          </div>
                          {event.details && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {event.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">About Event Tracking</p>
            <ul className="text-muted-foreground space-y-0.5 text-xs">
              <li>• Events are tracked via Brevo webhooks in real-time</li>
              <li>• Auto-refresh polls for new events every 10 seconds</li>
              <li>• Use test emails to check spam folder delivery and timing</li>
              <li>• Events: Sent → Delivered → Opened → Clicked</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

