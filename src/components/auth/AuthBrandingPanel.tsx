import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const TRANSITION_EASE = [0.4, 0, 0.2, 1] as const
const FADE_IN_DURATION = 0.3
const FADE_IN_DELAY = 0.45
const FADE_OUT_DURATION = 0.2

interface AuthBrandingPanelProps {
  eyebrow: string
  title: string
  description: string
  footer: ReactNode
  onHome: () => void
  visible: boolean
  enterDelay?: number
}

/** Text overlays on the shared fixed hero backdrop — no image layer here */
export function AuthBrandingPanel({
  eyebrow,
  title,
  description,
  footer,
  onHome,
  visible,
  enterDelay = FADE_IN_DELAY,
}: AuthBrandingPanelProps) {
  const shouldReduceMotion = useReducedMotion()

  const fadeTransition = {
    duration: shouldReduceMotion ? 0 : visible ? FADE_IN_DURATION : FADE_OUT_DURATION,
    delay: shouldReduceMotion ? 0 : visible ? enterDelay : 0,
    ease: TRANSITION_EASE,
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-between p-8 text-white xl:p-16">
      <motion.div
        className="relative z-10"
        initial={false}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={fadeTransition}
        style={{ pointerEvents: visible ? 'auto' : 'none' }}
      >
        <button
          type="button"
          onClick={onHome}
          className="inline-flex font-display text-2xl font-extrabold tracking-tight text-white transition-opacity hover:opacity-90 sm:text-3xl"
        >
          Harborlight
        </button>
      </motion.div>

      <motion.div
        className="relative z-10 my-8 lg:my-auto"
        initial={false}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={fadeTransition}
        style={{ pointerEvents: visible ? 'auto' : 'none' }}
      >
        <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          {eyebrow}
        </span>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-base">
          {description}
        </p>
      </motion.div>

      <motion.div
        className="relative z-10"
        initial={false}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={fadeTransition}
        style={{ pointerEvents: visible ? 'auto' : 'none' }}
      >
        {footer}
      </motion.div>
    </div>
  )
}
