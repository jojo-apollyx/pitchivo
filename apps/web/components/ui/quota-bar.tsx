/**
 * QuotaBar Component
 * Displays quota usage with a progress bar
 */

'use client'

import { cn } from '@/lib/utils'
import { isUnlimited, formatQuota } from '@/lib/constants/pricing'
import { Progress } from './progress'

interface QuotaBarProps {
  used: number
  total: number
  label: string
  type?: 'emails' | 'links' | 'default'
  className?: string
  showPercentage?: boolean
}

export function QuotaBar({
  used,
  total,
  label,
  type = 'default',
  className,
  showPercentage = false
}: QuotaBarProps) {
  const unlimited = isUnlimited(total)
  const percentage = unlimited ? 0 : Math.min(100, Math.round((used / total) * 100))
  const remaining = unlimited ? 'Unlimited' : Math.max(0, total - used)

  // Color based on usage - using artistic semantic colors
  const getColor = () => {
    if (unlimited) return 'bg-semantic-success'
    if (percentage >= 90) return 'bg-semantic-error'
    if (percentage >= 80) return 'bg-semantic-warning'
    return 'bg-primary-dark'
  }

  const getTextColor = () => {
    if (unlimited) return 'text-semantic-success'
    if (percentage >= 90) return 'text-semantic-error'
    if (percentage >= 80) return 'text-semantic-warning'
    return 'text-primary-dark'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Usage */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn('font-medium', getTextColor())}>
          {unlimited ? (
            'Unlimited'
          ) : (
            <>
              {used.toLocaleString()} / {formatQuota(total)}
              {showPercentage && ` (${percentage}%)`}
            </>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      {!unlimited && (
        <Progress 
          value={percentage} 
          className="h-2"
          indicatorClassName={getColor()}
        />
      )}

      {/* Remaining Count */}
      {!unlimited && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {percentage >= 90 ? '⚠️ ' : percentage >= 80 ? '⚡ ' : ''}
            {typeof remaining === 'number' ? remaining.toLocaleString() : remaining} remaining
          </span>
          {percentage >= 80 && (
            <span className="text-semantic-warning font-medium">
              {percentage >= 90 ? 'Almost full' : 'Running low'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
