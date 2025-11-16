'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { EmailStatusBadge } from '@/components/email/email-status-badge'
import { 
  EMAIL_EVENT_TYPES,
  EMAIL_EVENT_DEFINITIONS,
  getAllEvents,
  type EmailEventType 
} from '@/lib/constants/email-events'

interface EmailEventStatsProps {
  campaignId: string
  isAdmin?: boolean
}

interface EventStats {
  [key: string]: number
}

export function EmailEventStats({ campaignId, isAdmin = false }: EmailEventStatsProps) {
  const [stats, setStats] = useState<EventStats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [campaignId])

  async function loadStats() {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/email-stats`)
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error loading email stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading email statistics...</div>
  }

  const events = isAdmin ? getAllEvents() : getUserVisibleEventsWithStats(stats)
  const eventsWithStats = events.filter(eventType => stats[eventType] > 0)

  if (eventsWithStats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No email events recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {eventsWithStats.map((eventType) => {
          const count = stats[eventType] || 0
          const definition = EMAIL_EVENT_DEFINITIONS[eventType]
          
          return (
            <Card 
              key={eventType} 
              className="p-4 hover:shadow-md transition-shadow cursor-help"
            >
              <div className="space-y-2">
                <EmailStatusBadge eventType={eventType} size="sm" />
                <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {definition.category === 'success' && '✓ Good'}
                  {definition.category === 'warning' && '⚠ Warning'}
                  {definition.category === 'error' && '✗ Issue'}
                  {definition.category === 'info' && 'ℹ Info'}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Success Rate</div>
            <div className="text-lg font-semibold text-green-600">
              {calculateSuccessRate(stats)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Engagement Rate</div>
            <div className="text-lg font-semibold text-blue-600">
              {calculateEngagementRate(stats)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Bounce Rate</div>
            <div className="text-lg font-semibold text-yellow-600">
              {calculateBounceRate(stats)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Issue Rate</div>
            <div className="text-lg font-semibold text-red-600">
              {calculateIssueRate(stats)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getUserVisibleEventsWithStats(stats: EventStats): EmailEventType[] {
  return Object.entries(EMAIL_EVENT_DEFINITIONS)
    .filter(([type, def]) => def.isCommonForUser && stats[type] > 0)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([type]) => type as EmailEventType)
}

function calculateSuccessRate(stats: EventStats): number {
  const delivered = stats[EMAIL_EVENT_TYPES.DELIVERED] || 0
  const sent = stats[EMAIL_EVENT_TYPES.SENT] || 0
  if (sent === 0) return 0
  return Math.round((delivered / sent) * 100)
}

function calculateEngagementRate(stats: EventStats): number {
  const opened = stats[EMAIL_EVENT_TYPES.OPENED] || stats[EMAIL_EVENT_TYPES.UNIQUE_OPENED] || 0
  const delivered = stats[EMAIL_EVENT_TYPES.DELIVERED] || 0
  if (delivered === 0) return 0
  return Math.round((opened / delivered) * 100)
}

function calculateBounceRate(stats: EventStats): number {
  const softBounced = stats[EMAIL_EVENT_TYPES.SOFT_BOUNCED] || 0
  const hardBounced = stats[EMAIL_EVENT_TYPES.HARD_BOUNCED] || 0
  const sent = stats[EMAIL_EVENT_TYPES.SENT] || 0
  if (sent === 0) return 0
  return Math.round(((softBounced + hardBounced) / sent) * 100)
}

function calculateIssueRate(stats: EventStats): number {
  const complaints = stats[EMAIL_EVENT_TYPES.COMPLAINT] || 0
  const blocked = stats[EMAIL_EVENT_TYPES.BLOCKED] || 0
  const invalid = stats[EMAIL_EVENT_TYPES.INVALID] || 0
  const delivered = stats[EMAIL_EVENT_TYPES.DELIVERED] || 0
  if (delivered === 0) return 0
  return Math.round(((complaints + blocked + invalid) / delivered) * 100)
}

