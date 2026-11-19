import { useTranslation } from 'react-i18next'
import { StarIcon } from '@phosphor-icons/react'

/** Read-only stars, e.g. 4.5 shows four and a half (rounded to the nearest whole star) */
export function Stars({ value, size = 16 }) {
  const { t } = useTranslation()
  const filled = Math.round(Number(value) || 0)
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={t('buyer.starsOf', { rating: value })}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          size={size}
          weight={i < filled ? 'fill' : 'regular'}
          className={i < filled ? 'text-amber' : 'text-line'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/** Five tappable stars for giving a rating; a radio group, so the arrow keys work too */
export function StarInput({ value, onChange, label }) {
  const { t } = useTranslation()

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(5, (value || 0) + 1))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, (value || 1) - 1))
    else return
    e.preventDefault()
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5" onKeyDown={onKeyDown}>
      {[1, 2, 3, 4, 5].map((n) => {
        const checked = value === n
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t('buyer.starsOf', { rating: n })}
            tabIndex={checked || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            className="rounded-lg p-1 transition-transform hover:scale-110"
          >
            <StarIcon
              size={36}
              weight={n <= (value || 0) ? 'fill' : 'regular'}
              className={n <= (value || 0) ? 'text-amber' : 'text-line'}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
