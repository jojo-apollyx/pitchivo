'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TagListFieldProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  allowCustomInput?: boolean
  quickAddOptions?: string[]
  emptyMessage?: string
  className?: string
}

export function TagListField({
  label,
  value,
  onChange,
  placeholder = 'Add item...',
  allowCustomInput = true,
  quickAddOptions = [],
  emptyMessage,
  className,
}: TagListFieldProps) {
  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const items = value || []

  const addItem = (item: string) => {
    const trimmed = item.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
    }
    setNewItem('')
    setIsAdding(false)
  }

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItem.trim()) {
      e.preventDefault()
      addItem(newItem)
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewItem('')
    }
  }

  const availableQuickOptions = quickAddOptions.filter((opt) => !items.includes(opt))

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>

      {/* Display items as badges */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-border/30 rounded-lg bg-muted/30 mb-2">
          {items.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="text-xs pr-1 gap-1 bg-background"
            >
              <span className="truncate max-w-[200px]">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new item */}
      {allowCustomInput && isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 h-9"
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={() => addItem(newItem)}
            disabled={!newItem.trim()}
            className="h-9"
          >
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setIsAdding(false)
              setNewItem('')
            }}
            className="h-9"
          >
            Cancel
          </Button>
        </div>
      ) : (
        allowCustomInput && (
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add
            </Button>
          </div>
        )
      )}

      {/* Show empty state */}
      {items.length === 0 && !isAdding && emptyMessage && (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      )}
    </div>
  )
}

