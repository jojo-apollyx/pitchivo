/**
 * Preview Mode Selector
 * Clear tabs to switch between different access level previews
 */

'use client'

import { cn } from '@/lib/utils'
import { ACCESS_LEVEL_CONFIG, type AccessLevel } from '@/lib/constants/access-levels'

interface PreviewModeSelectorProps {
  value: AccessLevel | 'none'
  onChange: (value: AccessLevel | 'none') => void
}

const MODES = [
  { value: 'none' as const, label: 'Edit', icon: '✏️', description: 'Configure permissions' },
  { value: 'public' as const, ...ACCESS_LEVEL_CONFIG.public },
  { value: 'after_click' as const, ...ACCESS_LEVEL_CONFIG.after_click },
  { value: 'after_rfq' as const, ...ACCESS_LEVEL_CONFIG.after_rfq },
]

export function PreviewModeSelector({ value, onChange }: PreviewModeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Preview As:</p>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(mode => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              'p-3 rounded-lg border text-left transition-all hover:border-primary/50',
              value === mode.value
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card hover:bg-muted/50'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{mode.icon}</span>
              <span className="text-sm font-semibold">
                {mode.value === 'none' ? mode.label : mode.shortLabel}
              </span>
            </div>
            <p
              className={cn(
                'text-xs',
                value === mode.value ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}
            >
              {mode.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

