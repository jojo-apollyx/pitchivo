import { QueryClient } from '@tanstack/react-query'

/**
 * Create a new QueryClient instance
 * In Next.js App Router, we create a new instance per request to avoid sharing state
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

/**
 * Base API client that automatically includes impersonation context
 * All API calls go through this to ensure impersonation works
 * 
 * IMPORTANT: Uses credentials: 'include' to send cookies (including impersonate_user_id)
 * This ensures TanStack Query automatically works with impersonation
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // CRITICAL: Sends cookies (impersonation cookie) with every request
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    const errorMessage = error.error || `API error: ${response.statusText}`
    const apiError = new Error(errorMessage) as Error & { status?: number }
    apiError.status = response.status
    throw apiError
  }

  return response.json()
}

/**
 * Query keys factory for consistent cache key management
 */
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.organizations.all, 'detail', id] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    lists: () => [...queryKeys.campaigns.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.campaigns.all, 'detail', id] as const,
  },
  rfqs: {
    all: ['rfqs'] as const,
    lists: () => [...queryKeys.rfqs.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.rfqs.all, 'detail', id] as const,
  },
} as const

