import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const TRANSITION_EASE = [0.4, 0, 0.2, 1] as const
const FADE_IN_DURATION = 0.3
const FADE_IN_DELAY = 0.45
const FADE_OUT_DURATION = 0.22

interface AuthBrandingPanelProps {
  eyebrow: string
  title: string
  description: string
  footer: ReactNode
  onHome: () => void
  enterDelay?: number
}

/** Text overlays on the shared fixed hero backdrop — no image layer here */
export function AuthBrandingPanel({
  eyebrow,
  title,
  description,
  footer,
  onHome,
  enterDelay = FADE_IN_DELAY,
}: AuthBrandingPanelProps) {
  const shouldReduceMotion = useReducedMotion()

  const enterTransition = {
    duration: shouldReduceMotion ? 0 : FADE_IN_DURATION,
    delay: shouldReduceMotion ? 0 : enterDelay,
    ease: TRANSITION_EASE,
  }

  const exitTransition = {
    duration: shouldReduceMotion ? 0 : FADE_OUT_DURATION,
    ease: TRANSITION_EASE,
  }

  return (
    <motion.div
      className="relative flex h-full w-full flex-col justify-between p-8 text-white xl:p-16"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: exitTransition }}
      transition={enterTransition}
    >
      <div className="relative z-10">
        <button
          type="button"
          onClick={onHome}
          className="inline-flex font-display text-2xl font-extrabold tracking-tight text-white transition-opacity hover:opacity-90 sm:text-3xl"
        >
          Harborlight
        </button>
      </div>

      <div className="relative z-10 my-8 lg:my-auto">
        <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          {eyebrow}
        </span>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-base">
          {description}
        </p>
      </div>

      <div className="relative z-10">{footer}</div>
    </motion.div>
  )
}
