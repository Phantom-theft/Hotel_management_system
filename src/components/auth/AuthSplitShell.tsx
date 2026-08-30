import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthSplitShellProps {
  branding: ReactNode
  children: ReactNode
}

export function AuthSplitShell({ branding, children }: AuthSplitShellProps) {
  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden lg:flex-row">
      {/* Desktop: full-height branding column */}
      <aside className="relative hidden h-full min-h-0 w-1/2 shrink-0 lg:flex">{branding}</aside>

      {/* Form column — full screen on mobile, half width on desktop */}
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-white">
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="mb-8 inline-block font-display text-xl font-extrabold tracking-tight text-primary lg:hidden"
            >
              Harborlight
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthBrandingPanel({
  eyebrow,
  title,
  description,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  footer: ReactNode
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#091326] via-[#0F1E3C] to-[#1B3563] p-8 text-white xl:p-16">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-10 [background-size:20px_20px]"
        aria-hidden
      />

      <div className="relative z-10">
        <Link
          to="/"
          className="inline-flex font-display text-2xl font-extrabold tracking-tight text-white transition-opacity hover:opacity-90 sm:text-3xl"
        >
          Harborlight
        </Link>
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
    </div>
  )
}
