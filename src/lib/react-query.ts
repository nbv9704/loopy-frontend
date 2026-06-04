import { QueryClient } from '@tanstack/react-query'

/**
 * Centralized React Query client configuration
 * Extracted from App.tsx to follow Single Responsibility Principle
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
