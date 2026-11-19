import { useTranslation } from 'react-i18next'
import { ClockCountdownIcon } from '@phosphor-icons/react'

/** "Running about 30 min late: traffic", shown while a delivery that was reported late is on its way */
export function DelayNotice({ order }) {
  const { t } = useTranslation()
  if (order.status !== 'OUT_FOR_DELIVERY' || !order.delay_minutes) return null
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1 text-[13px] font-medium text-amber">
      <ClockCountdownIcon size={15} aria-hidden="true" />
      {t('delay.notice', { minutes: order.delay_minutes, reason: t(`delay.reason.${order.delay_reason}`) })}
    </p>
  )
}
