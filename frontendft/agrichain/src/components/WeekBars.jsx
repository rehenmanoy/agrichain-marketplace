import { useTranslation } from 'react-i18next'
import { formatDate, rupees } from '@/lib/format'

/** Seven small bars with weekday labels; today's bar is the dark one. days: [{ date, [valueKey]: amount }] */
export function WeekBars({ days, valueKey }) {
  const { t, i18n } = useTranslation()
  const highest = Math.max(...days.map((d) => d[valueKey]), 0)

  return (
    <figure className="mt-6">
      <ul className="flex h-16 items-end gap-2" aria-label={t('dashboard.last7')}>
        {days.map((day, i) => {
          const isToday = i === days.length - 1
          const height = highest > 0 ? Math.max(6, (day[valueKey] / highest) * 100) : 6
          return (
            <li key={day.date} className="flex h-full flex-1 items-end">
              <span className={`w-full rounded-t ${isToday ? 'bg-forest' : 'bg-sage-strong'}`} style={{ height: `${height}%` }} />
              <span className="sr-only">
                {formatDate(day.date, i18n.language)}: {rupees(day[valueKey])}
              </span>
            </li>
          )
        })}
      </ul>
      <figcaption className="mt-2 flex justify-between text-[11px] text-muted" aria-hidden="true">
        {days.map((day, i) => (
          <span key={day.date} className={`flex-1 text-center ${i === days.length - 1 ? 'font-semibold text-forest' : ''}`}>
            {i === days.length - 1 ? t('dashboard.today') : formatDate(day.date, i18n.language, { weekday: 'short' })}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
