'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EMAIL_EVENT_DEFINITIONS, getEventCategoryColor, type EmailEventType } from '@/lib/constants/email-events'

interface EmailStatusBadgeProps {
  eventType: EmailEventType
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmailStatusBadge({ 
  eventType, 
  showIcon = true, 
  size = 'md',
  className = '' 
}: EmailStatusBadgeProps) {
  const definition = EMAIL_EVENT_DEFINITIONS[eventType]
  
  if (!definition) {
    return <Badge variant="outline" className={className}>Unknown</Badge>
  }

  const colorClass = getEventCategoryColor(definition.category)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${colorClass} ${sizeClasses[size]} cursor-help transition-all hover:scale-105 ${className}`}
          >
            {showIcon && <span className="mr-1">{definition.icon}</span>}
            {definition.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <span>{definition.icon}</span>
              {definition.label}
            </p>
            <p className="text-xs text-muted-foreground">{definition.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Component to show multiple status badges in a group
interface EmailStatusGroupProps {
  events: Array<{
    eventType: EmailEventType
    timestamp?: string
    count?: number
  }>
  maxVisible?: number
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function EmailStatusGroup({ 
  events, 
  maxVisible = 5,
  showIcon = true,
  size = 'sm'
}: EmailStatusGroupProps) {
  const visibleEvents = events.slice(0, maxVisible)
  const hiddenCount = Math.max(0, events.length - maxVisible)

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleEvents.map((event, idx) => (
        <div key={`${event.eventType}-${idx}`} className="relative">
          <EmailStatusBadge 
            eventType={event.eventType} 
            showIcon={showIcon}
            size={size}
          />
          {event.count && event.count > 1 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {event.count}
            </span>
          )}
        </div>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className={`${size === 'sm' ? 'text-xs' : 'text-sm'} bg-muted`}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  )
}

