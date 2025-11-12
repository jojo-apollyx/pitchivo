'use client'

import * as React from 'react'
import { Check, X, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SearchableMultiSelectProps {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  maxHeight?: string
  className?: string
}

export function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Search...',
  maxHeight = 'max-h-64',
  className,
}: SearchableMultiSelectProps) {
  const [search, setSearch] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== option))
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      <Label className="text-foreground">{label}</Label>
      
      {/* Selected Items Display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-border/30 rounded-lg bg-muted/30">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="text-xs pr-1 gap-1"
            >
              <span className="truncate max-w-[200px]">{item}</span>
              <button
                type="button"
                onClick={(e) => removeOption(item, e)}
                className="hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search and Select Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full h-11 px-3 rounded-xl border border-input bg-background',
            'flex items-center justify-between text-sm',
            'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'text-muted-foreground'
          )}
        >
          <span>
            {selected.length > 0
              ? `${selected.length} selected`
              : `Select ${label.toLowerCase()}...`}
          </span>
          <Search className="h-4 w-4 opacity-50" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-xl border border-border bg-background shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className={cn('overflow-y-auto p-1', maxHeight)}>
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleOption(option)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors',
                        isSelected && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-4 h-4 rounded border',
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-input'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="flex-1 truncate">{option}</span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer with selected count */}
            {selected.length > 0 && (
              <div className="p-2 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  {selected.length} item{selected.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

