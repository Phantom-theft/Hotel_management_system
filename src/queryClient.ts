import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Drop all cached queries when the signed-in user changes or signs out. */
export function clearSessionCache() {
  queryClient.clear()
}
