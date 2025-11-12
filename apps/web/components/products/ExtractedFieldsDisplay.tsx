'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface GroupedData {
  basic?: Record<string, any>
  physical?: Record<string, any>
  chemical?: Record<string, any>
  microbial?: Record<string, any>
  allergen?: Record<string, any>
  compliance?: Record<string, any>
  packaging?: Record<string, any>
  supplier?: Record<string, any>
  commercial?: Record<string, any>
}

interface ExtractedFieldsDisplayProps {
  groupedData: GroupedData
  onFieldUpdate?: (group: string, field: string, value: any) => void
}

const GROUP_TITLES: Record<string, string> = {
  origin: 'Origin & Source',
  physical: 'Physical Properties',
  chemical: 'Chemical Specifications',
  microbial: 'Microbiological Data',
  nutrition: 'Nutritional Values (Per 100g)',
  allergen: 'Allergen Information',
  health_usage: 'Health Benefits & Usage',
  formulation: 'Formulation & Technical',
  quality: 'Quality Standards & Testing',
  compliance: 'Compliance & Certifications',
  packaging: 'Packaging Information',
  supplier: 'Supplier & Traceability',
  sustainability: 'Sustainability & Ethical Sourcing',
  commercial: 'Commercial & Logistics'
}

const GROUP_COLORS: Record<string, string> = {
  origin: 'bg-emerald-50 border-emerald-200',
  physical: 'bg-blue-50 border-blue-200',
  chemical: 'bg-purple-50 border-purple-200',
  microbial: 'bg-green-50 border-green-200',
  nutrition: 'bg-lime-50 border-lime-200',
  allergen: 'bg-orange-50 border-orange-200',
  health_usage: 'bg-rose-50 border-rose-200',
  formulation: 'bg-cyan-50 border-cyan-200',
  quality: 'bg-violet-50 border-violet-200',
  compliance: 'bg-indigo-50 border-indigo-200',
  packaging: 'bg-pink-50 border-pink-200',
  supplier: 'bg-teal-50 border-teal-200',
  sustainability: 'bg-green-100 border-green-300',
  commercial: 'bg-amber-50 border-amber-200'
}

function formatFieldName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim()
}

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

export function ExtractedFieldsDisplay({ groupedData, onFieldUpdate }: ExtractedFieldsDisplayProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingFields, setEditingFields] = useState<Record<string, any>>({})

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  const handleFieldChange = (group: string, field: string, value: string) => {
    const key = `${group}.${field}`
    setEditingFields(prev => ({ ...prev, [key]: value }))
    onFieldUpdate?.(group, field, value)
  }

  const nonEmptyGroups = Object.entries(groupedData)
    .filter(([key, data]) => {
      // Skip basic (already shown in primary form)
      if (key === 'basic') return false
      // Check if group has data
      return data && typeof data === 'object' && Object.keys(data).length > 0
    })

  if (nonEmptyGroups.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mt-8 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Additional Extracted Data</h3>
        <Badge variant="outline" className="ml-auto">
          {nonEmptyGroups.length} sections found
        </Badge>
      </div>

      <div className="space-y-3">
        {nonEmptyGroups.map(([groupKey, groupData]) => {
          const isExpanded = expandedGroups.has(groupKey)
          const fields = Object.entries(groupData as Record<string, any>).filter(
            ([_, value]) => value !== null && value !== undefined && value !== ''
          )

          if (fields.length === 0) return null

          return (
            <div
              key={groupKey}
              className={cn(
                'rounded-lg border-2 overflow-hidden transition-all',
                GROUP_COLORS[groupKey] || 'bg-gray-50 border-gray-200'
              )}
            >
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{GROUP_TITLES[groupKey] || groupKey}</span>
                  <Badge variant="secondary" className="text-xs">
                    {fields.length} fields
                  </Badge>
                </div>
              </button>

              {/* Group Fields */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 bg-white/50">
                  {fields.map(([fieldKey, fieldValue]) => {
                    const editKey = `${groupKey}.${fieldKey}`
                    const currentValue = editingFields[editKey] ?? formatValue(fieldValue)

                    return (
                      <div key={fieldKey} className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground/80">
                          {formatFieldName(fieldKey)}
                        </label>
                        <Input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleFieldChange(groupKey, fieldKey, e.target.value)}
                          className="bg-white"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
        <Sparkles className="h-4 w-4" />
        <span>These fields were automatically extracted from your documents</span>
      </div>
    </div>
  )
}

