// Smartlead Lead Categories
// Standard categories used by Smartlead for categorizing leads in campaigns

export interface LeadCategory {
  id: number
  name: string
  description?: string
  color: string
}

export const LEAD_CATEGORIES: LeadCategory[] = [
  {
    id: 1,
    name: 'Interested',
    description: 'Lead has shown interest in the product or service',
    color: '#10b981', // green-500
  },
  {
    id: 2,
    name: 'Meeting Request',
    description: 'Lead has requested a meeting or call',
    color: '#3b82f6', // blue-500
  },
  {
    id: 3,
    name: 'Not Interested',
    description: 'Lead has indicated they are not interested',
    color: '#ef4444', // red-500
  },
  {
    id: 4,
    name: 'Do Not Contact',
    description: 'Lead should not be contacted further',
    color: '#dc2626', // red-600
  },
  {
    id: 5,
    name: 'Information Request',
    description: 'Lead has requested more information',
    color: '#f59e0b', // amber-500
  },
  {
    id: 6,
    name: 'Out Of Office',
    description: 'Lead is currently out of office',
    color: '#6b7280', // gray-500
  },
  {
    id: 7,
    name: 'Wrong Person',
    description: 'Contacted person is not the right contact',
    color: '#9ca3af', // gray-400
  },
] as const

// Helper to get category by ID
export function getLeadCategoryById(id: number): LeadCategory | undefined {
  return LEAD_CATEGORIES.find((category) => category.id === id)
}

// Helper to get category by name
export function getLeadCategoryByName(name: string): LeadCategory | undefined {
  return LEAD_CATEGORIES.find(
    (category) => category.name.toLowerCase() === name.toLowerCase()
  )
}

// Map of category IDs to categories for quick lookup
export const LEAD_CATEGORIES_BY_ID: Record<number, LeadCategory> =
  LEAD_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.id] = category
      return acc
    },
    {} as Record<number, LeadCategory>
  )

// Map of category names to categories for quick lookup
export const LEAD_CATEGORIES_BY_NAME: Record<string, LeadCategory> =
  LEAD_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.name.toLowerCase()] = category
      return acc
    },
    {} as Record<string, LeadCategory>
  )

