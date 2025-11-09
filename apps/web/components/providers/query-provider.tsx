'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { makeQueryClient } from '@/lib/api/client'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance per app instance
  // This ensures each user session has its own cache
  const [client] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

