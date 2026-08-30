import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import landingBackgroundPng from '../../assets/landing-background.png'
import landingBackgroundWebp from '../../assets/landing-background.webp'

const FADE_MS = 400
const SCROLL_REVEAL_THRESHOLD = 80

/** Navy → deep blue → warm gold placeholder matching the hero palette */
const PLACEHOLDER_GRADIENT =
  'bg-gradient-to-br from-[#091326] via-[#0F1E3C] to-[#3d3018]'

interface LandingHeroBackdropProps {
  /** Lift above AppLayout page content so the hero shows when scrolled down */
  stackAboveContent?: boolean
  /** Smooth fade-in when auth opens from below the hero */
  authReveal?: boolean
  /** Hide while scrolled past hero — keeps image mounted for fast auth open */
  obscured?: boolean
}

/** Fixed full-viewport hero — identical crop on landing and auth routes */
export function LandingHeroBackdrop({
  stackAboveContent = false,
  authReveal = false,
  obscured = false,
}: LandingHeroBackdropProps) {
  const shouldReduceMotion = useReducedMotion()
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [revealVisible, setRevealVisible] = useState(!authReveal)

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [])

  useLayoutEffect(() => {
    if (!authReveal) {
      setRevealVisible(true)
      return
    }
    setRevealVisible(false)
    const frame = requestAnimationFrame(() => setRevealVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [authReveal])

  const imageOpacity = imageLoaded && revealVisible ? 1 : 0
  const transition = shouldReduceMotion ? 'none' : `opacity ${FADE_MS}ms ease-out`

  return (
    <div
      className={`pointer-events-none fixed inset-0 ${stackAboveContent ? 'z-[50]' : 'z-0'} ${
        obscured ? 'invisible' : ''
      }`}
      aria-hidden
    >
      <div className={`absolute inset-0 overflow-hidden ${PLACEHOLDER_GRADIENT}`}>
        <picture>
          <source srcSet={landingBackgroundWebp} type="image/webp" />
          <img
            ref={imgRef}
            src={landingBackgroundPng}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ opacity: imageOpacity, transition }}
          />
        </picture>
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10"
          style={{ opacity: imageOpacity, transition }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20"
          style={{ opacity: imageOpacity, transition }}
        />
      </div>
    </div>
  )
}

export { SCROLL_REVEAL_THRESHOLD }
