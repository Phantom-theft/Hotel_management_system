import { useEffect, useState } from 'react'
import type { LandingSectionId } from '../constants/landing'

export function useLandingScrollSpy(sectionIds: LandingSectionId[], enabled: boolean) {
  const [activeId, setActiveId] = useState<LandingSectionId | null>(null)

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      setActiveId(null)
      return
    }

    const visible = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.intersectionRatio)
        }

        let bestId: string | null = null
        let bestRatio = 0
        for (const id of sectionIds) {
          const ratio = visible.get(id) ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }

        if (bestRatio > 0 && bestId) {
          setActiveId(bestId as LandingSectionId)
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [enabled, sectionIds])

  return activeId
}
