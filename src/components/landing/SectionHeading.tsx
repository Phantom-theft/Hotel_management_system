interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  align?: 'center' | 'left'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'

  return (
    <div className={alignClass}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-3 text-neutral-600">{description}</p>}
    </div>
  )
}
