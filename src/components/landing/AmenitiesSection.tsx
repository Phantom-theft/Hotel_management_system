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
  return (
    <section id={LANDING_SECTIONS.amenities} className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="What's Included"
          title="Every stay, fully equipped"
          description="Thoughtful amenities for a calm boutique stay included in your rate, not hidden behind upsells."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {amenities.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-xl border border-neutral-100 bg-white p-6 shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-tint text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
