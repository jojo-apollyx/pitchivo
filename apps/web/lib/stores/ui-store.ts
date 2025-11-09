import { create } from 'zustand'

interface DialogState {
  open: boolean
  data: any
}

interface UIState {
  // Dialog states
  dialogs: Record<string, DialogState>
  openDialog: (key: string, data?: any) => void
  closeDialog: (key: string) => void
  isDialogOpen: (key: string) => boolean
  getDialogData: (key: string) => any

  // Loading states
  loading: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void
  isLoading: (key: string) => boolean

  // Toast notifications (complement to sonner)
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  removeNotification: (id: string) => void
}

/**
 * Zustand store for UI state management
 * Handles dialogs, loading states, and notifications
 */
export const useUIStore = create<UIState>((set, get) => ({
  dialogs: {},
  loading: {},
  notifications: [],

  openDialog: (key: string, data?: any) => {
    set((state) => ({
      dialogs: {
        ...state.dialogs,
        [key]: { open: true, data: data || null },
      },
    }))
  },

  closeDialog: (key: string) => {
    set((state) => ({
      dialogs: {
        ...state.dialogs,
        [key]: { open: false, data: null },
      },
    }))
  },

  isDialogOpen: (key: string) => {
    return get().dialogs[key]?.open || false
  },

  getDialogData: (key: string) => {
    return get().dialogs[key]?.data || null
  },

  setLoading: (key: string, value: boolean) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value,
      },
    }))
  },

  isLoading: (key: string) => {
    return get().loading[key] || false
  },

  addNotification: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(id)
    }, 5000)
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },
}))

