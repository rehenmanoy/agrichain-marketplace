import { useTranslation } from 'react-i18next'
import { Pill } from '@/components/Bits'
import { daysFromToday } from '@/lib/storage'

/** What state a booking is in, from the owner's side */
export function BookingPill({ booking }) {
  const { t } = useTranslation()
  const { status } = booking

  if (status === 'REQUESTED') return <Pill tone="amber">{t('owner.status.REQUESTED')}</Pill>
  if (booking.is_overdue) return <Pill tone="danger">{t('storage.overdue', { count: booking.overdue_days })}</Pill>
  if (status === 'ACTIVE' && daysFromToday(booking.start_date) > 0) return <Pill>{t('owner.status.UPCOMING')}</Pill>
  if (status === 'ACTIVE') return <Pill>{t('owner.status.ACTIVE')}</Pill>
  if (status === 'REJECTED') return <Pill tone="danger">{t('owner.status.REJECTED')}</Pill>
  return <Pill tone="muted">{t(`owner.status.${status}`)}</Pill>
}
