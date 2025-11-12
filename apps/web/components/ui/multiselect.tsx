"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface MultiselectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function Multiselect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiselectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option]
    onChange(newValue)
  }

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== option))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 text-left font-normal",
            !value.length && "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.map((option) => (
                <span
                  key={option}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded"
                >
                  {option}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option, e)}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {options.map((option) => (
            <div
              key={option}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
              onClick={() => handleToggle(option)}
            >
              <Checkbox
                checked={value.includes(option)}
                onCheckedChange={() => handleToggle(option)}
              />
              <label className="flex-1 text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </div>
        {value.length > 0 && (
          <div className="border-t mt-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

