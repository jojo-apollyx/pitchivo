'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface DateRangePickerProps {
  from?: Date
  to?: Date
  onSelect: (range: { from: Date | undefined; to: Date | undefined } | null) => void
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [startDate, setStartDate] = React.useState<Date | undefined>(from)
  const [endDate, setEndDate] = React.useState<Date | undefined>(to)
  const [selectingStart, setSelectingStart] = React.useState(true)

  React.useEffect(() => {
    setStartDate(from)
    setEndDate(to)
    // Reset selection state if both dates are cleared
    if (!from && !to) {
      setSelectingStart(true)
    } else if (from && !to) {
      setSelectingStart(false)
    }
  }, [from, to])

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    
    // Check if both dates are already selected (from props or internal state)
    const hasBothDates = (from && to) || (startDate && endDate)
    
    // If both dates are already selected, start a new selection
    if (hasBothDates && selectingStart) {
      setStartDate(date)
      setEndDate(undefined)
      setSelectingStart(false)
      onSelect({ from: date, to: undefined })
      return
    }
    
    if (selectingStart) {
      setStartDate(date)
      setEndDate(undefined)
      setSelectingStart(false)
      // Update parent immediately with start date
      onSelect({ from: date, to: undefined })
    } else {
      const currentStart = startDate || from
      if (date && currentStart && date < currentStart) {
        // If selected date is before start, make it the new start
        setStartDate(date)
        setEndDate(undefined)
        setSelectingStart(false)
        onSelect({ from: date, to: undefined })
      } else {
        setEndDate(date)
        if (currentStart) {
          onSelect({ from: currentStart, to: date })
          setOpen(false)
        }
      }
    }
  }

  const handleReset = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectingStart(true)
    onSelect(null)
  }

  const displayText = () => {
    // Use props directly to ensure we show the actual selected values
    const displayFrom = from || startDate
    const displayTo = to || endDate
    
    if (displayFrom && displayTo) {
      return `${format(displayFrom, 'MMM d')} - ${format(displayTo, 'MMM d, yyyy')}`
    }
    if (displayFrom) {
      return `${format(displayFrom, 'MMM d')} - ...`
    }
    return 'Select date range'
  }

  // When popover opens, ensure we're in the right selection state
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Check both props and internal state to determine current selection state
      const hasStart = from || startDate
      const hasEnd = to || endDate
      const hasBoth = hasStart && hasEnd
      
      // When opening, determine the selection state:
      // - If both dates are selected, allow user to start fresh (selecting start)
      // - If only start is selected, we're selecting end
      // - If nothing is selected, we're selecting start
      if (hasBoth) {
        // Both dates selected - allow user to start a new selection
        setSelectingStart(true)
      } else if (hasStart && !hasEnd) {
        // Only start selected - continue selecting end
        setSelectingStart(false)
      } else {
        // Nothing selected - start fresh
        setSelectingStart(true)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal min-h-[44px] h-11 bg-background border-border shadow-sm hover:bg-accent/50 hover:border-primary/50 transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            (!from && !to && !startDate && !endDate) && 'text-muted-foreground',
            className
          )}
          aria-label="Select date range"
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          <span className="flex-1 text-left">{displayText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-xl border-border/50 rounded-xl bg-background/95 backdrop-blur-sm" align="start">
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              {selectingStart ? 'Select start date' : 'Select end date'}
            </div>
            {(from || to || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
              >
                Reset
              </Button>
            )}
          </div>
          {(startDate || from) && !selectingStart && (
            <div className="text-xs text-muted-foreground px-1">
              Start: {format((from || startDate)!, 'MMM d, yyyy')}
            </div>
          )}
          <Calendar
            value={selectingStart ? (startDate || from || undefined) : (endDate || to || undefined)}
            onChange={handleDateChange}
            minDate={selectingStart ? undefined : (startDate || from || undefined)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

