import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { HOTEL_CONTACT } from '../../constants/contact'
import { LANDING_SECTIONS } from '../../constants/landing'
import { toast } from '../../store/toastStore'
import { ContactMap } from './ContactMap'
import { SectionHeading } from './SectionHeading'

const contactRows = [
  {
    icon: MapPin,
    label: 'Address',
    value: HOTEL_CONTACT.address,
  },
  {
    icon: Phone,
    label: 'Phone',
    value: HOTEL_CONTACT.phone,
    href: HOTEL_CONTACT.phoneHref,
  },
  {
    icon: Mail,
    label: 'Email',
    value: HOTEL_CONTACT.email,
    href: HOTEL_CONTACT.emailHref,
  },
  {
    icon: Clock,
    label: 'Hours',
    value: HOTEL_CONTACT.hours,
  },
]

function ContactDetailsList() {
  return (
    <ul className="space-y-4">
      {contactRows.map((row) => {
        const Icon = row.icon
        return (
          <li key={row.label} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-accent">
              <Icon className="h-4 w-4" aria-hidden />
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
  )
}

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
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-14">
          <form
            onSubmit={onSubmit}
            className="flex h-full flex-col rounded-xl border border-neutral-100 bg-white p-6 shadow-card"
            aria-label="Send us a message"
          >
            <h3 className="font-display text-lg font-bold text-primary">Send us a message</h3>
            <div className="mt-4 flex flex-1 flex-col gap-4">
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
              <label className="flex flex-1 flex-col text-sm">
                <span className="mb-1 block font-medium text-neutral-600">Message</span>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[7rem] w-full flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="submit"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
              >
                Send message
              </button>
            </div>
          </form>

          <div className="flex h-full flex-col gap-6">
            <ContactMap />
            <ContactDetailsList />
          </div>
        </div>
      </div>
    </section>
  )
}
