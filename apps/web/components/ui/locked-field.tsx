/**
 * LockedField Component
 * 
 * Shows a field with blur effect and lock icon when user doesn't have access
 * Displays tooltip on hover explaining how to unlock
 */

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LockedFieldProps {
  requiredLevel: 'after_click' | 'after_rfq'
  preview?: string
  className?: string
  children?: React.ReactNode
}

const accessLevelMessages = {
  after_click: {
    icon: '🔗',
    title: 'Link Access Required',
    description: 'This field is visible when you access via marketing links (email, QR code, social posts, etc.)',
    action: 'Get a marketing link to see this field',
  },
  after_rfq: {
    icon: '✅',
    title: 'Full Access Required',
    description: 'This field is only visible after submitting a Request for Quote (RFQ)',
    action: 'Submit an RFQ to unlock this field',
  },
}

export function LockedField({ 
  requiredLevel, 
  preview, 
  className,
  children 
}: LockedFieldProps) {
  const message = accessLevelMessages[requiredLevel]

  return (
    <div className={cn('relative group', className)}>
      {/* Blurred content */}
      <div className="relative">
        <div className="blur-sm select-none pointer-events-none">
          {children || (
            <span className="text-muted-foreground">
              {preview || '••••••••'}
            </span>
          )}
        </div>

        {/* Lock icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-sm">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Locked
            </span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-popover text-popover-foreground px-4 py-3 rounded-lg shadow-lg border border-border max-w-xs">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">{message.icon}</span>
            <div>
              <p className="text-sm font-semibold mb-1">{message.title}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {message.description}
              </p>
              <p className="text-xs font-medium text-primary">
                → {message.action}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Check if a field value is locked (has _locked metadata)
 */
export function isLockedField(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    value._locked === true &&
    value._required_level !== undefined
  )
}

/**
 * Get the actual value or locked metadata from a field
 */
export function getFieldValue(value: any): { 
  isLocked: boolean
  value: any
  requiredLevel?: 'after_click' | 'after_rfq'
  preview?: string
} {
  if (isLockedField(value)) {
    return {
      isLocked: true,
      value: value._preview || '',
      requiredLevel: value._required_level,
      preview: value._preview,
    }
  }

  return {
    isLocked: false,
    value: value,
  }
}

