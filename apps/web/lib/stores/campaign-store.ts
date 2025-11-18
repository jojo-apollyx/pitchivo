import { create } from 'zustand'

export interface CampaignDraft {
  // Step 1: Product Selection
  productId?: string
  productName?: string
  productIndustry?: string
  productTags?: string[]
  attachedFilesCount?: number
  
  // Step 2: Audience
  dataSourceId: string
  buyerCount: number
  totalContacts: number
  sampleBuyers?: { company: string; contacts: number }[]
  
  // Step 3: Sending Configuration
  emailCount: number
  durationDays: number
  startDate?: Date
  senderEmail: string
  senderSubdomains: string[]
  senderHealth: 'healthy' | 'warming_up' | 'caution' | 'poor'
  priorityLocations?: string[]
  
  // Test data flag
  isTest?: boolean
  
  // Metadata
  currentStep: number
}

interface CampaignStore {
  draft: CampaignDraft
  setDraft: (updates: Partial<CampaignDraft>) => void
  resetDraft: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  initializeFromStorage: () => void
}

const DEFAULT_DRAFT: CampaignDraft = {
  dataSourceId: 'pitchville_curated',
  buyerCount: 2450,
  totalContacts: 8932,
  emailCount: 500,
  durationDays: 4,
  senderEmail: 'news@{org}.pitchivo.com',
  senderSubdomains: ['news', 'updates', 'info', 'alerts'], // All 4 subdomains selected by default
  senderHealth: 'healthy',
  isTest: false,
  currentStep: 1
}

const STORAGE_KEY = 'pitchivo-campaign-draft'

// Helper to serialize draft for storage (Date -> string)
function serializeDraft(draft: CampaignDraft): string {
  const serializable = {
    ...draft,
    startDate: draft.startDate ? draft.startDate.toISOString() : undefined
  }
  return JSON.stringify(serializable)
}

// Helper to deserialize draft from storage (string -> Date)
function deserializeDraft(stored: string): CampaignDraft {
  const parsed = JSON.parse(stored)
  return {
    ...parsed,
    startDate: parsed.startDate ? new Date(parsed.startDate) : undefined
  }
}

export const useCampaignStore = create<CampaignStore>((set, get) => {
  // Initialize from localStorage if available
  let initialDraft = DEFAULT_DRAFT
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        initialDraft = deserializeDraft(stored)
      } catch (e) {
        console.error('Failed to load campaign draft from storage:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  return {
    draft: initialDraft,
    
    setDraft: (updates) => {
      set((state) => {
        const newDraft = { ...state.draft, ...updates }
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, serializeDraft(newDraft))
          } catch (e) {
            console.error('Failed to save campaign draft to storage:', e)
          }
        }
        return { draft: newDraft }
      })
    },
    
    resetDraft: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      set({ draft: DEFAULT_DRAFT })
    },
    
    nextStep: () => {
      set((state) => {
        const newDraft = { ...state.draft, currentStep: Math.min(state.draft.currentStep + 1, 4) }
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, serializeDraft(newDraft))
          } catch (e) {
            console.error('Failed to save campaign draft to storage:', e)
          }
        }
        return { draft: newDraft }
      })
    },
    
    prevStep: () => {
      set((state) => {
        const newDraft = { ...state.draft, currentStep: Math.max(state.draft.currentStep - 1, 1) }
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, serializeDraft(newDraft))
          } catch (e) {
            console.error('Failed to save campaign draft to storage:', e)
          }
        }
        return { draft: newDraft }
      })
    },
    
    goToStep: (step) => {
      set((state) => {
        const newDraft = { ...state.draft, currentStep: step }
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, serializeDraft(newDraft))
          } catch (e) {
            console.error('Failed to save campaign draft to storage:', e)
          }
        }
        return { draft: newDraft }
      })
    },

    initializeFromStorage: () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const draft = deserializeDraft(stored)
            set({ draft })
          } catch (e) {
            console.error('Failed to load campaign draft from storage:', e)
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      }
    }
  }
})

