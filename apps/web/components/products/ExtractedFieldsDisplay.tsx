'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

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
  const [editingFields, setEditingFields] = useState<Record<string, any>>({})

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
    <section className="pb-8 border-b border-border/30 mt-8">
      <h2 className="text-lg font-semibold mb-4">Additional Extracted Data</h2>
      <div className="space-y-6">
        {nonEmptyGroups.map(([groupKey, groupData]) => {
          const fields = Object.entries(groupData as Record<string, any>).filter(
            ([_, value]) => value !== null && value !== undefined && value !== ''
          )

          if (fields.length === 0) return null

          return (
            <div key={groupKey}>
              <h3 className="text-sm font-semibold mb-3">{GROUP_TITLES[groupKey] || groupKey}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(([fieldKey, fieldValue]) => {
                  const editKey = `${groupKey}.${fieldKey}`
                  const currentValue = editingFields[editKey] ?? formatValue(fieldValue)

                  return (
                    <div key={fieldKey} className="flex flex-col">
                      <label className="text-sm font-medium mb-1 whitespace-nowrap">
                        {formatFieldName(fieldKey)}
                      </label>
                      <Input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleFieldChange(groupKey, fieldKey, e.target.value)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

