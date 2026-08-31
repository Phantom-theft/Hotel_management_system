import ourStoryImage from '../../assets/Our story.jfif'
import { LANDING_SECTIONS } from '../../constants/landing'
import { SectionHeading } from './SectionHeading'

export function AboutSection() {
  return (
    <section id={LANDING_SECTIONS.about} className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-14">
        <img
          src={ourStoryImage}
          alt="Harborlight Hotel — our story"
          className="min-h-[280px] w-full rounded-xl object-cover shadow-card sm:min-h-[360px] lg:min-h-[420px]"
        />
        <div>
          <SectionHeading
            align="left"
            eyebrow="Our Story"
            title="A single address, a steadier way to stay"
          />
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600 sm:text-base">
            <p>
              Harborlight opened with a simple premise: one boutique property, one team, and rates
              you can read without a magnifying glass. We are not a chain — we are a neighborhood
              hotel built for travelers who want calm rooms and a front desk that remembers your
              name.
            </p>
            <p>
              Every stay is backed by live inventory, transparent nightly pricing, and a modern
              booking flow that respects your time. Holds expire cleanly, payments run through
              Stripe, and our staff can see the same reservation you see in your account.
            </p>
            <p>
              Whether you are here for a long weekend or a quiet work retreat, we keep the experience
              unhurried: soft lighting in the lobby, honest amenities, and no surprise fees at
              checkout. Harborlight is hospitality scaled to human size.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
