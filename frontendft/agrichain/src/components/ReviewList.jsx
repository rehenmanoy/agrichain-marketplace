import { useTranslation } from 'react-i18next'
import { timeAgo } from '@/lib/format'
import { produceName } from '@/lib/produce'
import { Stars } from './StarRating'

/**
 * Reviews, newest first: stars, the reviewer's first name, when, and the comment.
 * kind "farmer" and "partner" show the products of the order; "warehouse" shows the warehouse.
 */
export function ReviewList({ reviews, kind = 'farmer' }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  return (
    <ul className="divide-y divide-line-soft">
      {reviews.map((review) => {
        const who = kind === 'warehouse' ? review.farmer_name : review.buyer_name
        const about =
          kind === 'warehouse'
            ? review.warehouse_name
            : (review.produce_name ?? '')
                .split(', ')
                .filter(Boolean)
                .map((name) => produceName(name, lang))
                .join(', ')
        return (
          <li key={review.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Stars value={review.rating} size={15} />
                <span className="text-sm font-semibold text-ink">{who}</span>
              </div>
              <span className="text-[13px] text-muted">{timeAgo(review.created_at, lang)}</span>
            </div>
            {review.comment && <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{review.comment}</p>}
            {about && <p className="mt-1 text-[13px] text-muted">{about}</p>}
          </li>
        )
      })}
    </ul>
  )
}
