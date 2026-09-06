import { Quote } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { StarRating } from '../ui/StarRating'
import { LANDING_SECTIONS } from '../../constants/landing'
import { SectionHeading } from './SectionHeading'

const testimonials = [
  {
    quote:
      'The rate I saw online was the rate I paid — no awkward surprises at check-in. The room was quiet, the desk team was warm, and I slept better than I have in months.',
    rating: 5,
    name: 'Elena M.',
    city: 'Portland, OR',
  },
  {
    quote:
      'I booked on my phone during a layover and had a confirmation before my flight landed. Check-in took two minutes and the lobby felt genuinely calm, not staged.',
    rating: 5,
    name: 'James T.',
    city: 'Chicago, IL',
  },
  {
    quote:
      'Harborlight feels like a place that knows what it is — a single property with real people behind the counter. Breakfast was simple and good; the pool was empty at dawn.',
    rating: 4,
    name: 'Priya K.',
    city: 'Austin, TX',
  },
]

export function TestimonialsSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      id={LANDING_SECTIONS.testimonials}
      className="scroll-mt-20 bg-surface-tint py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Guest Voices"
          title="What travelers say about Harborlight"
          description="Placeholder testimonials for this portfolio demo — written for illustration, not pulled from live bookings."
        />
        <motion.div
          className="mt-12 grid gap-6 md:grid-cols-3"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {testimonials.map((item) => (
            <motion.blockquote
              key={item.name}
              className="flex h-full flex-col rounded-xl border border-neutral-100 bg-white p-6 shadow-card transition-shadow hover:shadow-md"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
            >
              <Quote className="h-8 w-8 text-accent/40" aria-hidden />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">{item.quote}</p>
              <div className="mt-5 border-t border-neutral-100 pt-4">
                <StarRating value={item.rating} size="sm" />
                <footer className="mt-2 text-sm font-semibold text-primary">
                  {item.name}
                  <span className="font-normal text-neutral-500"> · {item.city}</span>
                </footer>
              </div>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
