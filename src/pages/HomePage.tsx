import { motion, useReducedMotion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useAuthNavigation } from '../hooks/useAuthNavigation'
import { useLandingHashScroll } from '../hooks/useLandingHashScroll'
import { AmenitiesSection } from '../components/landing/AmenitiesSection'
import { AboutSection } from '../components/landing/AboutSection'
import { ContactSection } from '../components/landing/ContactSection'
import { GallerySection } from '../components/landing/GallerySection'
import { TestimonialsSection } from '../components/landing/TestimonialsSection'

const trustItems = [
  { label: 'Best Rate Guarantee', icon: '✓' },
  { label: '24/7 Front Desk', icon: '◷' },
  { label: 'Free Cancellation*', icon: '↺' },
]

const whyChoose = [
  {
    title: 'Clear pricing',
    body: 'Nightly rates shown upfront — no surprise fees at checkout.',
    icon: '◎',
  },
  {
    title: 'Real-time availability',
    body: 'Search live inventory so you only see rooms you can actually book.',
    icon: '▣',
  },
  {
    title: 'Secure payments',
    body: 'Card payments handled through Stripe with pending holds that expire cleanly.',
    icon: '⬡',
  },
  {
    title: 'Local hospitality',
    body: 'A single property with a front desk that knows returning guests.',
    icon: '◇',
  },
]

export function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { openAuth } = useAuthNavigation()
  const shouldReduceMotion = useReducedMotion()
  useLandingHashScroll()

  return (
    <div className="relative left-1/2 -mt-8 w-screen max-w-[100vw] -translate-x-1/2">
      {/* Hero — shared fixed backdrop renders behind; content only here */}
      <section id="hero" className="relative min-h-[100dvh] overflow-hidden">
        <motion.div
          className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:pb-20 sm:pt-28"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.35,
            ease: [0, 0, 0.2, 1],
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Harborlight Hotel
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find your next{' '}
            <span className="font-accent text-[1.05em] font-medium text-white">stay</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-200 sm:text-lg">
            Calm rooms, transparent rates, and a booking flow built for a single property — reserve
            in minutes.
          </p>
          {!isAuthenticated && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => openAuth('/register')}
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-neutral-100"
              >
                Create account
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-neutral-100 bg-white py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 justify-center sm:justify-start">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-accent"
                aria-hidden
              >
                {item.icon}
              </span>
              <p className="text-sm font-semibold text-primary">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Why choose us
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Hospitality without the hassle
            </h2>
            <p className="mt-3 text-neutral-600">
              Everything you need to find a room, hold a rate, and check in with confidence.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-neutral-100 bg-white p-6 shadow-card"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-tint text-lg text-accent"
                  aria-hidden
                >
                  {item.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AmenitiesSection />
      <GallerySection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
    </div>
  )
}
