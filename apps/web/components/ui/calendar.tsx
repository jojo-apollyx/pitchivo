'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CalendarProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  className?: string
}

export function Calendar({ value, onChange, minDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(value ? new Date(value) : new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleDateClick = (day: Date) => {
    if (minDate && day < minDate) return
    if (!isSameMonth(day, currentMonth)) return
    onChange(isSameDay(day, value || new Date()) ? undefined : day)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    const today = new Date()
    if (!minDate || today >= minDate) {
      onChange(today)
      setCurrentMonth(today)
    }
  }

  return (
    <div className={cn('p-4 bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8 hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-muted-foreground text-center py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = value && isSameDay(day, value)
          const isToday = isSameDay(day, new Date())
          const isDisabled = minDate && day < minDate
          const isOtherMonth = !isCurrentMonth

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={cn(
                'h-9 w-9 rounded-lg text-sm font-medium transition-all duration-150',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                isOtherMonth && 'text-muted-foreground/30',
                isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                isToday && !isSelected && 'bg-primary/10 text-primary font-semibold border border-primary/20',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md scale-105',
                !isSelected && !isToday && isCurrentMonth && 'text-foreground'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="w-full text-xs h-8"
          disabled={minDate && new Date() < minDate}
        >
          Today
        </Button>
      </div>
    </div>
  )
}

