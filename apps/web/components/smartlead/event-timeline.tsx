'use client'

import { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Mail, 
  MailCheck, 
  MousePointerClick, 
  MessageSquare, 
  XCircle, 
  UserX, 
  MailOpen,
  Send,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SmartleadEvent {
  event_id: string
  campaign_id: string
  lead_id: string | null
  smartlead_campaign_id: string
  lead_email: string
  event_type: string
  event_timestamp: string
  metadata: Record<string, any>
  created_at: string
}

interface SmartleadEventTimelineProps {
  campaignId: string
  isAdmin?: boolean
  compact?: boolean
  limit?: number
}

const EVENT_CONFIG = {
  sent: {
    icon: Send,
    label: 'Email Sent',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Email successfully sent'
  },
  delivered: {
    icon: MailCheck,
    label: 'Delivered',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    description: 'Email delivered to inbox'
  },
  opened: {
    icon: MailOpen,
    label: 'Opened',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Lead opened the email'
  },
  clicked: {
    icon: MousePointerClick,
    label: 'Link Clicked',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    description: 'Lead clicked a link'
  },
  replied: {
    icon: MessageSquare,
    label: 'Replied',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Lead replied to email'
  },
  bounced: {
    icon: XCircle,
    label: 'Bounced',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    description: 'Email bounced'
  },
  unsubscribed: {
    icon: UserX,
    label: 'Unsubscribed',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    description: 'Lead unsubscribed'
  },
  category_updated: {
    icon: AlertCircle,
    label: 'Category Updated',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    description: 'Lead category changed'
  },
}

export function SmartleadEventTimeline({ 
  campaignId, 
  isAdmin = false, 
  compact = false,
  limit = 50
}: SmartleadEventTimelineProps) {
  const [events, setEvents] = useState<SmartleadEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [searchEmail, setSearchEmail] = useState('')
  const [filteredEvents, setFilteredEvents] = useState<SmartleadEvent[]>([])

  useEffect(() => {
    loadEvents()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadEvents, 30000)
    return () => clearInterval(interval)
  }, [campaignId])

  useEffect(() => {
    // Apply filters
    let filtered = events

    if (selectedEventType !== 'all') {
      filtered = filtered.filter(e => e.event_type === selectedEventType)
    }

    if (searchEmail) {
      filtered = filtered.filter(e => 
        e.lead_email.toLowerCase().includes(searchEmail.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }, [events, selectedEventType, searchEmail])

  async function loadEvents() {
    try {
      const url = `/api/campaigns/${campaignId}/smartlead-events?limit=${limit}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()
      setEvents(data.events || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error loading smartlead events:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleExpanded(eventId: string) {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  function getEventConfig(eventType: string) {
    return EVENT_CONFIG[eventType as keyof typeof EVENT_CONFIG] || {
      icon: Mail,
      label: eventType,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-950/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      description: eventType
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No email events yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Events will appear here as your campaign progresses
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {!compact && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events ({events.length})</SelectItem>
              {Object.entries(stats).map(([type, count]) => (
                <SelectItem key={type} value={type}>
                  {EVENT_CONFIG[type as keyof typeof EVENT_CONFIG]?.label || type} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {filteredEvents.map((event, index) => {
          const config = getEventConfig(event.event_type)
          const Icon = config.icon
          const isExpanded = expandedEvents.has(event.event_id)
          const hasMetadata = Object.keys(event.metadata || {}).length > 0

          return (
            <Card
              key={event.event_id}
              className={`relative transition-all duration-200 hover:shadow-md ${
                compact ? 'p-3' : 'p-4'
              } ${config.borderColor} border-l-4`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`${config.bgColor} p-2 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{config.label}</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {event.lead_email}
                        </Badge>
                      </div>
                      
                      {!compact && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {config.description}
                        </p>
                      )}

                      {/* Additional info */}
                      {!compact && event.metadata?.subject && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{event.metadata.subject}"
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                            {formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true })}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(event.event_timestamp), 'PPpp')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Metadata (expandable) */}
                  {!compact && hasMetadata && (
                    <div className="mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(event.event_id)}
                        className="h-7 text-xs gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Show Details
                          </>
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
                          {event.metadata.link && (
                            <div>
                              <span className="font-medium">Link Clicked:</span>
                              <a
                                href={event.metadata.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {event.metadata.link}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          
                          {event.metadata.reply_text && (
                            <div>
                              <span className="font-medium">Reply:</span>
                              <p className="mt-1 p-2 bg-background rounded border text-sm whitespace-pre-wrap">
                                {event.metadata.reply_text}
                              </p>
                            </div>
                          )}
                          
                          {event.metadata.bounce_reason && (
                            <div>
                              <span className="font-medium">Bounce Reason:</span>
                              <span className="ml-2 text-destructive">{event.metadata.bounce_reason}</span>
                            </div>
                          )}

                          {event.metadata.bounce_type && (
                            <div>
                              <span className="font-medium">Bounce Type:</span>
                              <Badge variant={event.metadata.bounce_type === 'hard' ? 'destructive' : 'secondary'} className="ml-2">
                                {event.metadata.bounce_type}
                              </Badge>
                            </div>
                          )}

                          {event.metadata.sequence_number && (
                            <div>
                              <span className="font-medium">Sequence:</span>
                              <span className="ml-2">Step {event.metadata.sequence_number}</span>
                            </div>
                          )}

                          {event.metadata.user_agent && isAdmin && (
                            <div>
                              <span className="font-medium">User Agent:</span>
                              <span className="ml-2 text-xs font-mono">{event.metadata.user_agent}</span>
                            </div>
                          )}

                          {event.metadata.ip_address && isAdmin && (
                            <div>
                              <span className="font-medium">IP Address:</span>
                              <span className="ml-2 font-mono">{event.metadata.ip_address}</span>
                            </div>
                          )}

                          {event.metadata.device_used && (
                            <div>
                              <span className="font-medium">Device:</span>
                              <Badge variant="outline" className="ml-2">
                                {event.metadata.device_used}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Show more */}
      {filteredEvents.length === 0 && events.length > 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No events match your filters</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSelectedEventType('all')
              setSearchEmail('')
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </Card>
      )}
    </div>
  )
}

