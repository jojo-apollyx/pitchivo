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
  }, [from, to])

  const handleDateChange = (date: Date | undefined) => {
    if (selectingStart) {
      setStartDate(date)
      setEndDate(undefined)
      setSelectingStart(false)
    } else {
      if (date && startDate && date < startDate) {
        // If selected date is before start, make it the new start
        setStartDate(date)
        setEndDate(undefined)
        setSelectingStart(false)
      } else {
        setEndDate(date)
        if (date) {
          onSelect({ from: startDate, to: date })
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
    if (startDate && endDate) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    }
    if (startDate) {
      return `${format(startDate, 'MMM d')} - ...`
    }
    return 'Select date range'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-11 bg-background border-border shadow-sm hover:bg-accent',
            !startDate && !endDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {displayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg border-border/50" align="start">
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {selectingStart ? 'Select start date' : 'Select end date'}
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
          <Calendar
            value={selectingStart ? startDate : endDate}
            onChange={handleDateChange}
            minDate={selectingStart ? undefined : startDate}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

