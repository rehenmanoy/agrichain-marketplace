import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StarIcon, WarehouseIcon } from '@phosphor-icons/react'
import { useReviewWarehouse } from '@/api/reviews'
import { useCancelBooking, useCancelExtension, useReleaseStorage } from '@/api/storage'
import { errorMessage } from '@/lib/errors'
import { formatDate, number, rupees } from '@/lib/format'
import { produceName } from '@/lib/produce'
import { daysFromToday } from '@/lib/storage'
import { IconCircle, Pill } from '@/components/Bits'
import { Button } from '@/components/Button'
import { CallLink } from '@/components/CallLink'
import { ConfirmDialog } from '@/components/Dialogs'
import { RatingPanel } from '@/components/RatingPanel'
import { Stars } from '@/components/StarRating'
import { useToast } from '@/components/toast-context'
import { ExtendPanel } from './ExtendPanel'

/** One of the farmer's bookings, with what it is waiting for and what they can do next */
export function StorageBookingRow({ booking }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const cancel = useCancelBooking()
  const release = useReleaseStorage()
  const withdraw = useCancelExtension()
  const rateWarehouse = useReviewWarehouse()
  const [asking, setAsking] = useState(null) // 'cancel' | 'release'
  const [extending, setExtending] = useState(false)
  const [rating, setRating] = useState(false)

  const { status, extension } = booking
  const notStarted = status === 'ACTIVE' && daysFromToday(booking.start_date) > 0
  const inProgress = status === 'ACTIVE' && !notStarted
  const daysLeft = daysFromToday(booking.end_date)
  const finished = ['RELEASED', 'REJECTED', 'CANCELLED'].includes(status)
  const waitingExtension = extension?.status === 'PENDING'
  const declinedExtension = inProgress && extension?.status === 'REJECTED'

  const run = (mutation, id, message, done) =>
    mutation.mutate(id, {
      onSuccess: () => {
        done?.()
        toast(message)
      },
      onError: (error) => {
        done?.()
        toast(errorMessage(error, t), 'error')
      },
    })

  let pill
  if (status === 'REQUESTED') pill = <Pill tone="amber">{t('storage.waitingOwner')}</Pill>
  else if (booking.is_overdue) pill = <Pill tone="danger">{t('storage.overdue', { count: booking.overdue_days })}</Pill>
  else if (notStarted) pill = <Pill>{t('storage.approved')}</Pill>
  else if (inProgress) pill = <Pill>{t('storage.inStorage')}</Pill>
  else if (status === 'REJECTED') pill = <Pill tone="danger">{t('storage.declined')}</Pill>
  else if (status === 'CANCELLED') pill = <Pill tone="muted">{t('storage.cancelled')}</Pill>
  else pill = <Pill tone="muted">{t('storage.takenOut')}</Pill>

  return (
    <li className={`border-t border-line-soft px-6 py-4 ${finished ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">
            {number(booking.quantity_kg)} kg
            {booking.produce_name ? ` ${produceName(booking.produce_name, lang)}` : ''}
          </p>
          <p className="text-sm text-muted">{booking.warehouse_name}</p>
        </div>
        {pill}
      </div>

      <p className="mt-2 text-[13px] text-muted">
        {t('storage.fromTo', { start: formatDate(booking.start_date, lang), end: formatDate(booking.end_date, lang) })}
        {' · '}
        {booking.is_overdue ? t('storage.chargeSoFar') : t('storage.amount')}:{' '}
        <span className={booking.is_overdue ? 'font-semibold text-danger' : 'text-ink'}>{rupees(booking.amount_to_pay)}</span>
      </p>

      {inProgress && !booking.is_overdue && (
        <p className="mt-1 text-[13px] text-muted">
          {daysLeft === 0 ? t('storage.lastDay') : t('storage.daysLeft', { count: daysLeft })}
        </p>
      )}
      {booking.is_overdue && <p className="mt-1 text-[13px] font-medium text-danger">{t('storage.overdueHelp')}</p>}
      {status === 'REJECTED' && booking.decision_note && (
        <p className="mt-1 text-[13px] text-ink">{t('storage.ownerSaid', { note: booking.decision_note })}</p>
      )}

      {waitingExtension && (
        <p className="mt-2 rounded-lg bg-amber-soft px-3 py-2 text-[13px] text-amber">
          {t('storage.extensionWaiting', { date: formatDate(extension.new_end_date, lang) })}
        </p>
      )}
      {declinedExtension && (
        <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {t('storage.extensionDeclined', { date: formatDate(extension.new_end_date, lang) })}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status === 'REQUESTED' && (
          <Button variant="secondary" size="sm" onClick={() => setAsking('cancel')}>
            {t('storage.cancelRequest')}
          </Button>
        )}
        {notStarted && (
          <Button variant="secondary" size="sm" onClick={() => setAsking('cancel')}>
            {t('storage.cancelBooking')}
          </Button>
        )}
        {inProgress && (
          <>
            <Button variant={booking.is_overdue ? 'primary' : 'secondary'} size="sm" onClick={() => setAsking('release')}>
              {t('storage.takeOut')}
            </Button>
            {waitingExtension ? (
              <Button
                variant="ghost"
                size="sm"
                loading={withdraw.isPending}
                onClick={() => run(withdraw, booking.id, t('storage.extensionWithdrawn'))}
              >
                {t('storage.withdrawExtension')}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setExtending(true)}>
                {t('storage.extend')}
              </Button>
            )}
          </>
        )}
        {!finished && <CallLink name={booking.owner_name} phone={booking.owner_phone} />}
        {status === 'RELEASED' && !booking.is_reviewed && (
          <Button variant="secondary" size="sm" icon={StarIcon} onClick={() => setRating(true)}>
            {t('storage.rateWarehouse')}
          </Button>
        )}
        {status === 'RELEASED' && booking.is_reviewed && (
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <Stars value={booking.review_rating} size={14} />
            {t('storage.yourWarehouseRating', { rating: booking.review_rating })}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={asking === 'cancel'}
        onClose={() => setAsking(null)}
        onConfirm={() => run(cancel, booking.id, t('storage.cancelledToast'), () => setAsking(null))}
        loading={cancel.isPending}
        title={t('storage.cancelTitle', { name: booking.warehouse_name })}
        body={t('storage.cancelBody')}
        confirmLabel={t('storage.yesCancel')}
      />
      <ConfirmDialog
        open={asking === 'release'}
        onClose={() => setAsking(null)}
        onConfirm={() => run(release, booking.id, t('storage.takenOutToast'), () => setAsking(null))}
        loading={release.isPending}
        title={t('storage.takeOutTitle', { name: booking.warehouse_name })}
        body={t('storage.takeOutBody')}
        confirmLabel={t('common.yesTakeOut')}
        tone="primary"
      />
      {extending && <ExtendPanel key={booking.id} booking={booking} onClose={() => setExtending(false)} />}
      {rating && (
        <RatingPanel
          title={t('storage.rateWarehouseTitle', { name: booking.warehouse_name })}
          header={
            <>
              <IconCircle icon={WarehouseIcon} size="lg" />
              <div>
                <p className="font-serif text-xl text-ink">{booking.warehouse_name}</p>
                <p className="text-sm text-muted">
                  {t('storage.fromTo', { start: formatDate(booking.start_date, lang), end: formatDate(booking.end_date, lang) })}
                </p>
              </div>
            </>
          }
          question={t('storage.rateWarehouseQuestion', { name: booking.warehouse_name })}
          mutation={rateWarehouse}
          toArgs={({ rating: stars, comment }) => ({ id: booking.id, rating: stars, comment })}
          doneText={t('storage.rateWarehouseThanks')}
          onClose={() => setRating(false)}
        />
      )}
    </li>
  )
}
