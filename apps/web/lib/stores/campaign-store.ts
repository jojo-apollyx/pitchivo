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
  senderHealth: 'healthy' | 'warming_up' | 'caution' | 'poor'
  priorityLocations?: string[]
  
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
}

const DEFAULT_DRAFT: CampaignDraft = {
  dataSourceId: 'pitchville_curated',
  buyerCount: 2450,
  totalContacts: 8932,
  emailCount: 500,
  durationDays: 4,
  senderEmail: 'news@{org}.pitchivo.com',
  senderHealth: 'healthy',
  currentStep: 1
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  draft: DEFAULT_DRAFT,
  
  setDraft: (updates) =>
    set((state) => ({
      draft: { ...state.draft, ...updates }
    })),
  
  resetDraft: () =>
    set({ draft: DEFAULT_DRAFT }),
  
  nextStep: () =>
    set((state) => ({
      draft: { ...state.draft, currentStep: Math.min(state.draft.currentStep + 1, 4) }
    })),
  
  prevStep: () =>
    set((state) => ({
      draft: { ...state.draft, currentStep: Math.max(state.draft.currentStep - 1, 1) }
    })),
  
  goToStep: (step) =>
    set((state) => ({
      draft: { ...state.draft, currentStep: step }
    }))
}))

