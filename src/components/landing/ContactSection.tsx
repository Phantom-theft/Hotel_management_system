import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { LANDING_SECTIONS } from '../../constants/landing'
import { toast } from '../../store/toastStore'
import { SectionHeading } from './SectionHeading'

const contactRows = [
  {
    icon: MapPin,
    label: 'Address',
    value: '148 Harbor Lane, Bayview District',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (555) 010-2000',
    href: 'tel:+15550102000',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'reservations@harborlight.local',
    href: 'mailto:reservations@harborlight.local',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Front desk · Open 24/7',
  },
]

export function ContactSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    toast('Thanks for reaching out — we will reply shortly.', 'success')
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <section id={LANDING_SECTIONS.contact} className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Get in Touch"
          title="We are here when you need us"
          description="Questions about a stay, a group booking, or accessibility? Send a note or reach the desk directly."
        />
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ul className="space-y-5">
            {contactRows.map((row) => {
              const Icon = row.icon
              return (
                <li key={row.label} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-tint text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{row.label}</p>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="mt-0.5 text-sm text-neutral-600 transition hover:text-accent"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-sm text-neutral-600">{row.value}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="space-y-6">
            <div
              className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50"
              aria-hidden
            >
              <div className="text-center text-neutral-400">
                <MapPin className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm font-medium">Map placeholder</p>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 shadow-card"
              aria-label="Send us a message"
            >
              <h3 className="font-display text-lg font-bold text-primary">Send us a message</h3>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-600">Name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-600">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-600">Message</span>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
              >
                Send message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
