import {
  BellRing,
  Coffee,
  Dumbbell,
  Headset,
  ParkingCircle,
  PawPrint,
  Waves,
  Wifi,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { LANDING_SECTIONS } from '../../constants/landing'
import { SectionHeading } from './SectionHeading'

const amenities = [
  {
    icon: Wifi,
    title: 'Free WiFi',
    description: 'Reliable high-speed internet in every room and common area.',
  },
  {
    icon: Dumbbell,
    title: 'Fitness Center',
    description: 'Compact gym with cardio and free weights, open around the clock.',
  },
  {
    icon: Coffee,
    title: 'Breakfast Included',
    description: 'Seasonal continental breakfast served in the morning room.',
  },
  {
    icon: ParkingCircle,
    title: 'Free Parking',
    description: 'On-site parking for one vehicle per reservation.',
  },
  {
    icon: Headset,
    title: '24/7 Front Desk',
    description: 'A real team on property not a call center any hour of the day.',
  },
  {
    icon: PawPrint,
    title: 'Pet Friendly',
    description: 'Selected rooms welcome well-behaved pets with prior notice.',
  },
  {
    icon: BellRing,
    title: 'Room Service',
    description: 'Evening menu delivered to your door on request.',
  },
  {
    icon: Waves,
    title: 'Pool & Spa',
    description: 'Heated indoor pool and a quiet relaxation lounge.',
  },
]

export function AmenitiesSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id={LANDING_SECTIONS.amenities} className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="What's Included"
          title="Every stay, fully equipped"
          description="Thoughtful amenities for a calm boutique stay included in your rate, not hidden behind upsells."
        />
        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {amenities.map((item) => {
            const Icon = item.icon
            return (
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
                className="rounded-xl border border-neutral-100 bg-white p-6 shadow-card transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-tint text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
