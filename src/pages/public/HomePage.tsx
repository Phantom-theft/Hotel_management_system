import { motion, useReducedMotion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useAuthNavigation } from '../../hooks/useAuthNavigation'
import { useLandingHashScroll } from '../../hooks/useLandingHashScroll'
import { SectionHeading } from '../../components/landing/SectionHeading'
import { AmenitiesSection } from '../../components/landing/AmenitiesSection'
import { AboutSection } from '../../components/landing/AboutSection'
import { ContactSection } from '../../components/landing/ContactSection'
import { GallerySection } from '../../components/landing/GallerySection'
import { TestimonialsSection } from '../../components/landing/TestimonialsSection'

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
    <div className="relative left-1/2 -mt-8 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {/* Hero — shared fixed backdrop renders behind; content only here */}
      <section id="hero" className="relative min-h-[100dvh] overflow-hidden">
        <motion.div
          className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:pb-20 sm:pt-28"
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
              },
            },
          }}
        >
          <motion.p
            className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/70"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            Harborlight Hotel
          </motion.p>
          <motion.h1
            className="mt-2.5 sm:mt-3 max-w-2xl font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            Find your next{' '}
            <span className="font-accent text-[1.05em] font-medium text-white">stay</span>
          </motion.h1>
          <motion.p
            className="mt-3.5 sm:mt-4 max-w-lg text-sm leading-relaxed text-neutral-200 sm:text-base lg:text-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            Calm rooms, transparent rates, and a booking flow built for a single property — reserve
            in minutes.
          </motion.p>
          {!isAuthenticated && (
            <motion.div
              className="mt-7 sm:mt-8"
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <button
                type="button"
                onClick={() => openAuth('/register')}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-neutral-100 active:scale-[0.98]"
              >
                Create account
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-neutral-100 bg-white py-8 sm:py-10">
        <motion.div
          className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:gap-6"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {trustItems.map((item) => (
            <motion.div
              key={item.label}
              className="flex items-center justify-center gap-3 py-1"
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-accent transition-transform duration-300 hover:scale-110"
                aria-hidden
              >
                {item.icon}
              </span>
              <p className="text-sm font-semibold text-primary">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Why choose us */}
      <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="Why choose us"
            title="Hospitality without the hassle"
            description="Everything you need to find a room, hold a rate, and check in with confidence."
          />
          <motion.div
            className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
            initial={shouldReduceMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {whyChoose.map((item) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
                className="rounded-xl border border-neutral-100 bg-white p-5 sm:p-6 shadow-card transition-shadow hover:shadow-md"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-tint text-lg text-accent"
                  aria-hidden
                >
                  {item.icon}
                </span>
                <h3 className="mt-4 font-display text-base sm:text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
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
