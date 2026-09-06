import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const TRANSITION_EASE = [0.4, 0, 0.2, 1] as const
const TRANSITION_DURATION = 0.7

function useIsLgUp() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsLg(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isLg
}

interface AuthSlidePanelProps {
  isOpen: boolean
  skipEnterAnimation?: boolean
  onEnterComplete?: () => void
  onExitComplete?: () => void
  onClose: () => void
  children: ReactNode
}

export function AuthSlidePanel({
  isOpen,
  skipEnterAnimation = false,
  onEnterComplete,
  onExitComplete,
  onClose,
  children,
}: AuthSlidePanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const isLg = useIsLgUp()
  const wasOpen = useRef(isOpen)

  // skipEnterAnimation only affects the mount initial state (e.g. panel already open).
  // Never shorten transition duration mid-flight — that caused a snap when markOpen() ran.
  const instantTransition = shouldReduceMotion

  const desktopVariants = {
    closed: { width: '0%', y: '0%' },
    open: { width: '50%', y: '0%' },
  }

  const mobileVariants = {
    closed: { width: '100%', y: '100%' },
    open: { width: '100%', y: '0%' },
  }

  const variants = isLg ? desktopVariants : mobileVariants

  useEffect(() => {
    if (shouldReduceMotion && isOpen) {
      onEnterComplete?.()
    }
  }, [shouldReduceMotion, isOpen, onEnterComplete])

  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      if (shouldReduceMotion) {
        onExitComplete?.()
      }
    }
    wasOpen.current = isOpen
  }, [isOpen, shouldReduceMotion, onExitComplete])

  return (
    <motion.div
      className="fixed right-0 top-0 bottom-0 z-[60] h-[100dvh] overflow-hidden bg-white shadow-2xl shadow-black/20 lg:h-dvh lg:border-l lg:border-neutral-200/80"
      initial={shouldReduceMotion || skipEnterAnimation ? 'open' : 'closed'}
      animate={isOpen ? 'open' : 'closed'}
      variants={variants}
      transition={{
        duration: instantTransition ? 0 : TRANSITION_DURATION,
        ease: TRANSITION_EASE,
      }}
      onAnimationComplete={(definition) => {
        if (definition === 'open' && isOpen) onEnterComplete?.()
        if (definition === 'closed' && !isOpen) onExitComplete?.()
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-white lg:w-[50vw] lg:min-w-[50vw]">
        <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-neutral-600 backdrop-blur-sm transition-all hover:bg-neutral-100 hover:text-primary hover:shadow-sm"
            aria-label="Close and return to home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={onClose}
              className="mb-8 inline-block font-display text-xl font-extrabold tracking-tight text-primary lg:hidden"
            >
              Harborlight
            </button>
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
