'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TestTube2, AlertTriangle } from 'lucide-react'

interface TestDataToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  showWarning?: boolean
}

/**
 * Reusable toggle component for marking data as test data
 * Use this in product/campaign/RFQ creation and editing forms
 */
export function TestDataToggle({ value, onChange, disabled = false, showWarning = true }: TestDataToggleProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube2 className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="is-test" className="text-base font-medium cursor-pointer">
            Mark as Test Data
          </Label>
        </div>
        <Switch
          id="is-test"
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>

      {value && showWarning && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This data will be marked as test data and can be easily cleaned up by admins.
          </AlertDescription>
        </Alert>
      )}

      {!value && (
        <p className="text-xs text-muted-foreground">
          Enable this to mark as test data for easy cleanup later
        </p>
      )}
    </div>
  )
}

/**
 * Inline test data badge for displaying test status
 */
interface TestDataBadgeProps {
  isTest: boolean
  className?: string
}

export function TestDataBadge({ isTest, className = '' }: TestDataBadgeProps) {
  if (!isTest) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ${className}`}
    >
      <TestTube2 className="w-3 h-3" />
      Test Data
    </span>
  )
}

