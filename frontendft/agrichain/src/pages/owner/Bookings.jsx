import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BellRingingIcon, CheckCircleIcon, ClockCounterClockwiseIcon, MapPinIcon, WarehouseIcon } from '@phosphor-icons/react'
import {
  useApproveBooking,
  useApproveExtension,
  useIncomingBookings,
  useRejectBooking,
  useRejectExtension,
} from '@/api/owner'
import { errorMessage } from '@/lib/errors'
import { formatDate, number, rupees } from '@/lib/format'
import { produceName } from '@/lib/produce'
import { inclusiveDays } from '@/lib/storage'
import { Card, PageHeader } from '@/components/Bits'
import { Button } from '@/components/Button'
import { CallLink } from '@/components/CallLink'
import { ConfirmDialog, Panel } from '@/components/Dialogs'
import { FormError } from '@/components/Field'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { useToast } from '@/components/toast-context'
import { BookingPill } from './BookingPill'

const waitingExtension = (b) => b.status === 'ACTIVE' && b.extension?.status === 'PENDING'

const TABS = [
  {
    key: 'requests',
    label: 'owner.bookings.tabRequests',
    pick: (b) => b.status === 'REQUESTED' || waitingExtension(b),
    empty: 'emptyRequests',
    icon: BellRingingIcon,
  },
  { key: 'active', label: 'owner.bookings.tabActive', pick: (b) => b.status === 'ACTIVE', empty: 'emptyActive', icon: WarehouseIcon },
  {
    key: 'past',
    label: 'owner.bookings.tabPast',
    pick: (b) => ['RELEASED', 'REJECTED', 'CANCELLED'].includes(b.status),
    empty: 'emptyPast',
    icon: ClockCounterClockwiseIcon,
  },
]

export default function OwnerBookings() {
  const { t } = useTranslation()
  const bookings = useIncomingBookings()
  const [params, setParams] = useSearchParams()

  const current = TABS.find((tab) => tab.key === params.get('tab')) ?? TABS[0]
  const inTab = (tab) => bookings.data?.filter(tab.pick) ?? []
  // Overdue first in the active list: they need a phone call
  const visible = inTab(current).sort((a, b) => Number(b.is_overdue) - Number(a.is_overdue))

  const onTabKey = (e, index) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    const next = TABS[(index + step + TABS.length) % TABS.length]
    setParams({ tab: next.key })
    document.getElementById(`tab-${next.key}`)?.focus()
  }

  return (
    <>
      <PageHeader title={t('owner.bookings.title')} subtitle={t('owner.bookings.subtitle')} />

      <div role="tablist" aria-label={t('owner.bookings.title')} className="flex gap-2 border-b border-line">
        {TABS.map((tab, index) => {
          const selected = tab.key === current.key
          const count = inTab(tab).length
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls="bookings-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setParams({ tab: tab.key })}
              onKeyDown={(e) => onTabKey(e, index)}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] transition-colors ${
                selected ? 'border-forest font-semibold text-forest' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t(tab.label)}
              {bookings.data && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    tab.key === 'requests' && count > 0 ? 'bg-amber text-white' : 'bg-line-soft text-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div id="bookings-panel" role="tabpanel" aria-labelledby={`tab-${current.key}`} className="mt-6">
        {bookings.isPending ? (
          <Card>
            <SkeletonRows rows={3} />
          </Card>
        ) : bookings.isError ? (
          <Card>
            <ErrorState message={errorMessage(bookings.error, t)} onRetry={bookings.refetch} />
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={current.icon}
              title={t(`owner.bookings.${current.empty}`)}
              body={t(`owner.bookings.${current.empty}Body`)}
            />
          </Card>
        ) : (
          <ul className="space-y-4">
            {visible.map((booking) => (
              <BookingCard key={`${booking.id}-${current.key}`} booking={booking} tab={current.key} />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function BookingCard({ booking, tab }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const approve = useApproveBooking()
  const approveExt = useApproveExtension()
  const rejectExt = useRejectExtension()
  const [declining, setDeclining] = useState(false)
  const [decliningExt, setDecliningExt] = useState(false)

  const isExtension = tab === 'requests' && booking.status === 'ACTIVE'
  const extension = booking.extension
  const days = inclusiveDays(booking.start_date, isExtension ? extension.new_end_date : booking.end_date)
  const newTotal = days * booking.quantity_kg * booking.rate_per_kg_per_day

  const answer = (mutation, id, message) =>
    mutation.mutate(id, {
      onSuccess: () => {
        setDecliningExt(false)
        toast(message)
      },
      onError: (error) => {
        setDecliningExt(false)
        toast(errorMessage(error, t), 'error')
      },
    })

  return (
    <Card as="li" className="grid grid-cols-[1.3fr_1.4fr_auto] items-center gap-10 px-7 py-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-serif text-xl text-ink">{booking.farmer_name}</p>
          <BookingPill booking={booking} />
        </div>
        <p className="mt-1 text-sm text-ink">
          {number(booking.quantity_kg)} kg
          {booking.produce_name ? ` ${produceName(booking.produce_name, lang)}` : ''}
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
          <MapPinIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {booking.warehouse_name}
        </p>
        <div className="mt-2">
          <CallLink name={booking.farmer_name} phone={booking.farmer_phone} />
        </div>
      </div>

      <div className="text-sm">
        <p className="text-ink">
          {formatDate(booking.start_date, lang)} – {formatDate(booking.end_date, lang)}
          <span className="text-muted"> · {t('storage.days', { count: inclusiveDays(booking.start_date, booking.end_date) })}</span>
        </p>
        {isExtension && (
          <p className="mt-2 rounded-lg bg-amber-soft px-3 py-2 font-medium text-amber">
            {t('owner.bookings.wantsExtend', { date: formatDate(extension.new_end_date, lang) })}
          </p>
        )}
        {booking.is_overdue && <p className="mt-2 font-medium text-danger">{t('owner.bookings.overdueHelp', { count: booking.overdue_days })}</p>}
        {booking.status === 'REJECTED' && booking.decision_note && (
          <p className="mt-2 text-muted">{t('owner.bookings.yourNote', { note: booking.decision_note })}</p>
        )}
        {booking.status === 'ACTIVE' && !isExtension && extension?.status === 'PENDING' && (
          <p className="mt-2 text-amber">{t('owner.bookings.extensionPending', { date: formatDate(extension.new_end_date, lang) })}</p>
        )}
      </div>

      <div className="flex min-w-44 flex-col items-end gap-3 text-right">
        <div>
          <p className="text-xs text-muted">
            {isExtension ? t('owner.bookings.newTotal') : booking.is_overdue ? t('storage.chargeSoFar') : t('owner.bookings.amount')}
          </p>
          <p className={`font-serif text-2xl ${booking.is_overdue ? 'text-danger' : 'text-ink'}`}>
            {rupees(isExtension ? newTotal : booking.amount_to_pay)}
          </p>
        </div>

        {tab === 'requests' && (
          <div className="flex gap-2">
            {isExtension ? (
              <>
                <Button
                  size="sm"
                  icon={CheckCircleIcon}
                  loading={approveExt.isPending}
                  disabled={rejectExt.isPending}
                  onClick={() => answer(approveExt, booking.id, t('owner.bookings.extensionAccepted'))}
                >
                  {t('owner.bookings.accept')}
                </Button>
                <Button variant="secondary" size="sm" disabled={approveExt.isPending} onClick={() => setDecliningExt(true)}>
                  {t('owner.bookings.decline')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  icon={CheckCircleIcon}
                  loading={approve.isPending}
                  onClick={() => answer(approve, booking.id, t('owner.bookings.accepted', { name: booking.farmer_name }))}
                >
                  {t('owner.bookings.accept')}
                </Button>
                <Button variant="secondary" size="sm" disabled={approve.isPending} onClick={() => setDeclining(true)}>
                  {t('owner.bookings.decline')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {declining && <DeclinePanel booking={booking} onClose={() => setDeclining(false)} />}
      <ConfirmDialog
        open={decliningExt}
        onClose={() => setDecliningExt(false)}
        onConfirm={() => answer(rejectExt, booking.id, t('owner.bookings.extensionDeclined'))}
        loading={rejectExt.isPending}
        title={t('owner.bookings.declineExtTitle')}
        body={t('owner.bookings.declineExtBody', { farmer: booking.farmer_name })}
        confirmLabel={t('owner.bookings.yesDecline')}
      />
    </Card>
  )
}

/** Decline a new request, with an optional reason the farmer will see */
function DeclinePanel({ booking, onClose }) {
  const { t } = useTranslation()
  const toast = useToast()
  const reject = useRejectBooking()
  const [note, setNote] = useState('')

  const submit = () =>
    reject.mutate(
      { id: booking.id, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast(t('owner.bookings.declined', { name: booking.farmer_name }))
          onClose()
        },
      },
    )

  return (
    <Panel
      open
      onClose={onClose}
      title={t('owner.bookings.declineTitle', { name: booking.farmer_name })}
      subtitle={t('owner.bookings.declineSubtitle')}
      footer={
        <div className="space-y-4">
          <FormError message={reject.isError ? errorMessage(reject.error, t) : null} />
          <Button variant="destructive" className="w-full" onClick={submit} loading={reject.isPending}>
            {t('owner.bookings.yesDecline')}
          </Button>
        </div>
      }
    >
      <label htmlFor="decline-note" className="block text-sm font-medium text-ink">
        {t('owner.bookings.reason')}
      </label>
      <textarea
        id="decline-note"
        rows={4}
        maxLength={300}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('owner.bookings.reasonPlaceholder')}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink outline-none placeholder:text-muted/70 focus:border-leaf focus:ring-4 focus:ring-sage"
      />
    </Panel>
  )
}
