import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

/** True once zustand persist has finished rehydrating auth from storage. */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? true,
  )

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useAuthStore.persist.hasHydrated())
    return unsub
  }, [])

  return hydrated
}
