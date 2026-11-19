import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExtendBooking } from '@/api/storage'
import { errorMessage } from '@/lib/errors'
import { formatDate, isoDate, number, rupees } from '@/lib/format'
import { MAX_BOOKING_DAYS, inclusiveDays } from '@/lib/storage'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { Field, FormError } from '@/components/Field'
import { useToast } from '@/components/toast-context'

/** Ask the owner to keep the produce longer. The owner has to approve the new end date. */
export function ExtendPanel({ booking, onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const extend = useExtendBooking()

  const today = isoDate(0)
  // The new date has to be after the current end, and can't be in the past (an overdue booking ended earlier)
  const earliest = booking.end_date >= today ? booking.end_date : today
  const [newEnd, setNewEnd] = useState('')

  const days = newEnd ? inclusiveDays(booking.start_date, newEnd) : 0
  const total = days * booking.quantity_kg * booking.rate_per_kg_per_day
  const error = !newEnd
    ? null
    : newEnd <= booking.end_date
      ? t('storage.extendAfter', { date: formatDate(booking.end_date, lang) })
      : newEnd < today
        ? t('storage.startInPast')
        : days > MAX_BOOKING_DAYS
          ? t('storage.tooLong', { max: MAX_BOOKING_DAYS })
          : null

  const submit = () =>
    extend.mutate(
      { id: booking.id, new_end_date: newEnd },
      {
        onSuccess: () => {
          toast(t('storage.extendRequestedToast'))
          onClose()
        },
      },
    )

  return (
    <Panel
      open
      onClose={onClose}
      title={t('storage.extendTitle', { name: booking.warehouse_name })}
      subtitle={t('storage.extendSubtitle', {
        kg: number(booking.quantity_kg),
        start: formatDate(booking.start_date, lang),
        end: formatDate(booking.end_date, lang),
      })}
      footer={
        <div className="space-y-4">
          {newEnd && !error && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">{t('storage.newTotal')}</span>
              <span className="font-serif text-3xl text-ink">{rupees(total)}</span>
            </div>
          )}
          <FormError message={extend.isError ? errorMessage(extend.error, t) : null} />
          <Button className="w-full" onClick={submit} loading={extend.isPending} disabled={!newEnd || Boolean(error)}>
            {extend.isPending ? t('storage.sending') : t('storage.sendExtension')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {booking.is_overdue && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {t('storage.overdueExtendNote', { count: booking.overdue_days })}
          </p>
        )}
        <Field
          label={t('storage.newEndDate')}
          type="date"
          min={earliest}
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
          error={error}
          hint={newEnd && !error ? t('storage.days', { count: days }) : undefined}
        />
        <p className="text-[13px] leading-relaxed text-muted">{t('storage.extendNote')}</p>
      </div>
    </Panel>
  )
}
