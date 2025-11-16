'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Send, XCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ScheduledEmail {
  scheduled_email_id: string
  campaign_id: string
  recipient_email: string
  recipient_company: string | null
  recipient_name: string | null
  subject: string
  content: string
  scheduled_time: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  sent_at: string | null
  error_message: string | null
  created_at: string
}

interface ScheduledEmailsViewerProps {
  campaignId: string
}

export function ScheduledEmailsViewer({ campaignId }: ScheduledEmailsViewerProps) {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all')
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    loadScheduledEmails()
  }, [campaignId, filter])

  async function loadScheduledEmails() {
    try {
      const url = filter === 'all'
        ? `/api/admin/campaigns/scheduled-emails?campaignId=${campaignId}`
        : `/api/admin/campaigns/scheduled-emails?campaignId=${campaignId}&status=${filter}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load scheduled emails')
      
      const data = await response.json()
      setScheduledEmails(data.scheduledEmails || [])
    } catch (error) {
      console.error('Error loading scheduled emails:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendNow(scheduledEmailId: string) {
    if (!confirm('Send this email immediately?')) return

    setSendingId(scheduledEmailId)
    try {
      const response = await fetch('/api/admin/campaigns/send-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledEmailId })
      })

      if (!response.ok) throw new Error('Failed to send email')

      alert('Email sent successfully!')
      await loadScheduledEmails()
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSendingId(null)
    }
  }

  async function handleCancel(scheduledEmailId: string) {
    if (!confirm('Cancel this scheduled email?')) return

    try {
      const response = await fetch('/api/admin/campaigns/scheduled-emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledEmailId,
          status: 'cancelled'
        })
      })

      if (!response.ok) throw new Error('Failed to cancel email')

      alert('Email cancelled successfully!')
      await loadScheduledEmails()
    } catch (error) {
      console.error('Error cancelling email:', error)
      alert('Failed to cancel email')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 gap-1">
          <CheckCircle className="h-3 w-3" />
          Sent
        </Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 gap-1">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredEmails = scheduledEmails

  // Group by date
  const emailsByDate = filteredEmails.reduce((acc, email) => {
    const date = format(new Date(email.scheduled_time), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(email)
    return acc
  }, {} as Record<string, ScheduledEmail[]>)

  const sortedDates = Object.keys(emailsByDate).sort()

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading scheduled emails...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Emails
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {scheduledEmails.length} email{scheduledEmails.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={filter === 'sent' ? 'default' : 'outline'}
            onClick={() => setFilter('sent')}
          >
            Sent
          </Button>
          <Button
            size="sm"
            variant={filter === 'failed' ? 'default' : 'outline'}
            onClick={() => setFilter('failed')}
          >
            Failed
          </Button>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No scheduled emails found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const emails = emailsByDate[date]
            const dateObj = new Date(date)
            
            return (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b border-border/30">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">
                    {format(dateObj, 'EEEE, MMMM d, yyyy')}
                  </h4>
                  <Badge variant="outline" className="ml-2">
                    {emails.length} email{emails.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {emails
                    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                    .map((email) => (
                      <div
                        key={email.scheduled_email_id}
                        className="bg-background/60 rounded-lg p-4 border border-border/20 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-mono text-muted-foreground">
                                {format(new Date(email.scheduled_time), 'h:mm a')}
                              </span>
                              {getStatusBadge(email.status)}
                              <span className="text-sm font-semibold">{email.recipient_email}</span>
                              {email.recipient_company && (
                                <span className="text-xs text-muted-foreground">
                                  • {email.recipient_company}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm">
                              <strong>Subject:</strong> {email.subject}
                            </div>

                            {email.error_message && (
                              <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                                <strong>Error:</strong> {email.error_message}
                              </div>
                            )}

                            {email.sent_at && (
                              <div className="text-xs text-muted-foreground">
                                Sent at {format(new Date(email.sent_at), 'h:mm a on MMM d, yyyy')}
                              </div>
                            )}
                          </div>

                          {email.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSendNow(email.scheduled_email_id)}
                                disabled={sendingId === email.scheduled_email_id}
                                className="gap-1"
                              >
                                <Send className="h-3 w-3" />
                                {sendingId === email.scheduled_email_id ? 'Sending...' : 'Send Now'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(email.scheduled_email_id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

