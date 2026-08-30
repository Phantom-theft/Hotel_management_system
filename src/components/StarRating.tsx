interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md'
  label?: string
}

export function StarRating({ value, onChange, max = 5, size = 'md', label }: StarRatingProps) {
  const interactive = typeof onChange === 'function'
  const sizeClass = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label ?? `${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1
        const filled = star <= value
        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              onClick={() => onChange(star)}
              className={`${sizeClass} rounded px-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                filled ? 'text-amber-500' : 'text-neutral-300'
              }`}
            >
              ★
            </button>
          )
        }
        return (
          <span
            key={star}
            className={`${sizeClass} ${filled ? 'text-amber-500' : 'text-neutral-300'}`}
            aria-hidden
          >
            ★
          </span>
        )
      })}
    </div>
  )
}

export function RatingBadge({ rating, total }: { rating: number; total: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-950 ring-1 ring-amber-200">
      <StarRating value={Math.round(rating)} size="sm" label={`Average ${rating.toFixed(1)} stars`} />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-amber-800/80">
        ({total} review{total === 1 ? '' : 's'})
      </span>
    </div>
  )
}
