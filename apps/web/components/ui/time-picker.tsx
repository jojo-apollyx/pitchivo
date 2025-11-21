'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TimePickerProps {
  value: string // Format: "HH:MM"
  onChange: (value: string) => void
  id?: string
  label?: string
  disabled?: boolean
  className?: string
  placeholder?: string
  'aria-label'?: string
}

export function TimePicker({
  value,
  onChange,
  id,
  label,
  disabled = false,
  className,
  placeholder = 'Select time',
  'aria-label': ariaLabel,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hours, setHours] = React.useState('09')
  const [minutes, setMinutes] = React.useState('00')
  const [period, setPeriod] = React.useState<'AM' | 'PM'>('AM')

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      const hour24 = parseInt(h || '9', 10)
      const min = m || '00'
      
      if (hour24 === 0) {
        setHours('12')
        setPeriod('AM')
      } else if (hour24 === 12) {
        setHours('12')
        setPeriod('PM')
      } else if (hour24 > 12) {
        setHours(String(hour24 - 12).padStart(2, '0'))
        setPeriod('PM')
      } else {
        setHours(String(hour24).padStart(2, '0'))
        setPeriod('AM')
      }
      setMinutes(min)
    }
  }, [value])

  const formatTime24 = (h: string, m: string, p: 'AM' | 'PM'): string => {
    let hour24 = parseInt(h, 10)
    const min = parseInt(m, 10)

    if (p === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (p === 'AM' && hour24 === 12) {
      hour24 = 0
    }

    return `${String(hour24).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  const handleTimeChange = (newHours: string, newMinutes: string, newPeriod: 'AM' | 'PM') => {
    setHours(newHours)
    setMinutes(newMinutes)
    setPeriod(newPeriod)
    const time24 = formatTime24(newHours, newMinutes, newPeriod)
    onChange(time24)
  }

  const displayValue = React.useMemo(() => {
    if (!value) return placeholder
    const [h, m] = value.split(':')
    const hour24 = parseInt(h || '0', 10)
    const min = m || '00'
    
    if (hour24 === 0) {
      return `12:${min} AM`
    } else if (hour24 === 12) {
      return `12:${min} PM`
    } else if (hour24 > 12) {
      return `${hour24 - 12}:${min} PM`
    } else {
      return `${hour24}:${min} AM`
    }
  }, [value, placeholder])

  const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal min-h-[44px] h-11',
              'bg-background border-border shadow-sm',
              'hover:bg-accent/50 hover:border-primary/50',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'transition-all duration-200',
              !value && 'text-muted-foreground'
            )}
            aria-label={ariaLabel || label || 'Select time'}
          >
            <Clock className="mr-2 h-4 w-4 opacity-50" />
            <span className="flex-1">{displayValue}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 shadow-xl border-border/50 rounded-xl overflow-hidden bg-background/95 backdrop-blur-sm"
          align="start"
        >
          <div className="p-4 bg-background">
            <div className="flex items-center gap-3">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <label 
                  htmlFor={`${id}-hours`}
                  className="text-xs font-medium text-muted-foreground mb-2"
                >
                  Hour
                </label>
                <div 
                  className="flex flex-col gap-1 max-h-[200px] overflow-y-auto overscroll-contain pr-1"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'hsl(var(--primary) / 0.2) transparent'
                  }}
                >
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      id={`${id}-hour-${hour}`}
                      type="button"
                      onClick={() => handleTimeChange(hour, minutes, period)}
                      className={cn(
                        'min-h-[44px] min-w-[60px] px-4 py-2 rounded-lg',
                        'text-sm font-medium transition-all duration-200',
                        'hover:bg-primary/10 hover:text-primary hover:scale-[1.02]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                        'active:scale-[0.98] touch-manipulation',
                        hours === hour
                          ? 'bg-primary text-primary-foreground shadow-md scale-[1.05]'
                          : 'bg-background text-foreground hover:shadow-sm'
                      )}
                    >
                      {parseInt(hour, 10)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <label 
                  htmlFor={`${id}-minutes`}
                  className="text-xs font-medium text-muted-foreground mb-2"
                >
                  Minute
                </label>
                <div 
                  className="flex flex-col gap-1 max-h-[200px] overflow-y-auto overscroll-contain pr-1"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'hsl(var(--primary) / 0.2) transparent'
                  }}
                >
                  {minuteOptions.map((minute) => (
                    <button
                      key={minute}
                      id={`${id}-minute-${minute}`}
                      type="button"
                      onClick={() => handleTimeChange(hours, minute, period)}
                      className={cn(
                        'min-h-[44px] min-w-[60px] px-4 py-2 rounded-lg',
                        'text-sm font-medium transition-all duration-200',
                        'hover:bg-primary/10 hover:text-primary hover:scale-[1.02]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                        'active:scale-[0.98] touch-manipulation',
                        minutes === minute
                          ? 'bg-primary text-primary-foreground shadow-md scale-[1.05]'
                          : 'bg-background text-foreground hover:shadow-sm'
                      )}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center">
                <label 
                  htmlFor={`${id}-period`}
                  className="text-xs font-medium text-muted-foreground mb-2"
                >
                  Period
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    id={`${id}-period-am`}
                    type="button"
                    onClick={() => handleTimeChange(hours, minutes, 'AM')}
                    className={cn(
                      'min-h-[44px] min-w-[60px] px-4 py-2 rounded-lg',
                      'text-sm font-medium transition-all duration-200',
                      'hover:bg-primary/10 hover:text-primary hover:scale-[1.02]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      'active:scale-[0.98] touch-manipulation',
                      period === 'AM'
                        ? 'bg-primary text-primary-foreground shadow-md scale-[1.05]'
                        : 'bg-background text-foreground border border-border hover:shadow-sm'
                    )}
                  >
                    AM
                  </button>
                  <button
                    id={`${id}-period-pm`}
                    type="button"
                    onClick={() => handleTimeChange(hours, minutes, 'PM')}
                    className={cn(
                      'min-h-[44px] min-w-[60px] px-4 py-2 rounded-lg',
                      'text-sm font-medium transition-all duration-200',
                      'hover:bg-primary/10 hover:text-primary hover:scale-[1.02]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      'active:scale-[0.98] touch-manipulation',
                      period === 'PM'
                        ? 'bg-primary text-primary-foreground shadow-md scale-[1.05]'
                        : 'bg-background text-foreground border border-border hover:shadow-sm'
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick time buttons */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '9:00 AM', hours: '09', minutes: '00', period: 'AM' as const },
                  { label: '12:00 PM', hours: '12', minutes: '00', period: 'PM' as const },
                  { label: '5:00 PM', hours: '05', minutes: '00', period: 'PM' as const },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    id={`${id}-preset-${preset.label.replace(/\s/g, '-').toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      handleTimeChange(preset.hours, preset.minutes, preset.period)
                      setOpen(false)
                    }}
                    className={cn(
                      'min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium',
                      'bg-background border border-border text-foreground',
                      'hover:bg-primary/10 hover:text-primary hover:border-primary/50',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      'transition-all duration-200 touch-manipulation'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

