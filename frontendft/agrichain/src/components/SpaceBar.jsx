import { useTranslation } from 'react-i18next'
import { number } from '@/lib/format'

/** How full a warehouse is today: a bar plus "400 kg free of 1,000 kg" */
export function SpaceBar({ free, total }) {
  const { t } = useTranslation()
  const usedPct = total > 0 ? Math.min(100, Math.max(0, 100 - (free / total) * 100)) : 0
  const label = t('storage.free', { free: number(free), total: number(total) })

  return (
    <div>
      <div
        className="h-2 overflow-hidden rounded-full bg-sage"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedPct)}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-leaf" style={{ width: `${usedPct}%` }} />
      </div>
      <p className="mt-1.5 text-[13px] text-muted">{label}</p>
    </div>
  )
}
