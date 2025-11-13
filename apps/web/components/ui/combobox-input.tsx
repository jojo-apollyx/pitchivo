'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface ComboboxInputProps {
  value?: string
  onValueChange?: (value: string) => void
  options?: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Hybrid input component that supports both:
 * - Free text input (from AI or user typing)
 * - Selecting from predefined options via datalist
 * 
 * This allows AI to provide any text value, while giving users
 * the convenience of selecting from common options.
 */
export function ComboboxInput({
  value = '',
  onValueChange,
  options = [],
  placeholder = 'Select or type...',
  disabled = false,
  className,
}: ComboboxInputProps) {
  const listId = React.useId()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value)
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        list={options.length > 0 ? listId : undefined}
        className={cn('pr-8', className)}
      />
      {options.length > 0 && (
        <>
          <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
          <datalist id={listId}>
            {options.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </>
      )}
    </div>
  )
}

