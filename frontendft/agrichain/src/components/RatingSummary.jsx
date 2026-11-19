import { useTranslation } from 'react-i18next'
import { Stars } from './StarRating'

/** The average rating, how many reviews, and a bar for each of 5 to 1 stars */
export function RatingSummary({ reviews }) {
  const { t } = useTranslation()
  const count = reviews.length
  const average = count ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-8">
      <div className="text-center">
        <p className="font-serif text-[52px] leading-none text-ink">{count ? average.toFixed(1) : '–'}</p>
        <div className="mt-2 flex justify-center">
          <Stars value={average} size={18} />
        </div>
        <p className="mt-1.5 text-sm text-muted">{t('reviews.count', { count })}</p>
      </div>

      <ul className="space-y-1.5" aria-label={t('reviews.breakdown')}>
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = reviews.filter((r) => r.rating === stars).length
          return (
            <li key={stars} className="flex items-center gap-3 text-sm">
              <span className="w-12 text-muted">{t('reviews.starsShort', { count: stars })}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sage">
                <span className="block h-full rounded-full bg-amber" style={{ width: count ? `${(n / count) * 100}%` : 0 }} />
              </span>
              <span className="w-6 text-right text-muted">{n}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
