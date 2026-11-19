import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarBlankIcon, PhoneIcon, WarehouseIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useMyBookings, useWarehouses } from '@/api/storage'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { Card, Eyebrow, PageHeader, Pill } from '@/components/Bits'
import { Button } from '@/components/Button'
import { Stars } from '@/components/StarRating'
import { WarehouseReviews } from '@/components/WarehouseReviews'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { WarehouseThumb } from '@/components/PhotoGallery'
import { SpaceBar } from '@/components/SpaceBar'
import { BookPanel } from './BookPanel'
import { StorageBookingRow } from './StorageBookingRow'

export default function Storage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const warehouses = useWarehouses(user?.region_id)
  const bookings = useMyBookings()
  const [booking, setBooking] = useState(null)
  const [reviewsOf, setReviewsOf] = useState(null)

  return (
    <>
      <PageHeader title={t('storage.title')} subtitle={t('storage.subtitle')} />

      <div className="grid items-start gap-6 lg:grid-cols-[2.1fr_1fr]">
        <Card>
          <div className="px-6 pt-6 pb-4">
            <Eyebrow icon={WarehouseIcon}>{user?.region_name}</Eyebrow>
            <h2 className="mt-1.5 text-[22px] text-ink">{t('storage.find')}</h2>
            <p className="mt-2 text-sm text-muted">{t('storage.coldVsDry')}</p>
          </div>
          {warehouses.isPending ? (
            <SkeletonRows rows={3} />
          ) : warehouses.isError ? (
            <ErrorState message={errorMessage(warehouses.error, t)} onRetry={warehouses.refetch} />
          ) : warehouses.data.length === 0 ? (
            <EmptyState icon={WarehouseIcon} title={t('storage.emptyFind')} body={t('storage.emptyFindBody')} />
          ) : (
            <ul>
              {warehouses.data.map((warehouse) => (
                <WarehouseRow
                  key={warehouse.id}
                  warehouse={warehouse}
                  onBook={() => setBooking(warehouse)}
                  onReviews={() => setReviewsOf(warehouse)}
                />
              ))}
            </ul>
          )}
        </Card>

        <MyStorage bookings={bookings} />
      </div>

      {booking && <BookPanel key={booking.id} warehouse={booking} onClose={() => setBooking(null)} />}
      {reviewsOf && <WarehouseReviews key={reviewsOf.id} warehouse={reviewsOf} onClose={() => setReviewsOf(null)} />}
    </>
  )
}

function WarehouseRow({ warehouse, onBook, onReviews }) {
  const { t } = useTranslation()

  return (
    <li className="grid grid-cols-[1.7fr_1.1fr_auto] items-center gap-8 border-t border-line-soft px-6 py-5">
      <div className="flex gap-4">
        <WarehouseThumb warehouse={warehouse} size="size-20" />
        <div className="min-w-0">
          <p className="font-serif text-lg text-ink">{warehouse.name}</p>
          <p className="text-sm text-muted">{warehouse.location}</p>
          {warehouse.review_count > 0 && (
            <button
              type="button"
              onClick={onReviews}
              aria-label={t('reviews.readReviews', { name: warehouse.name })}
              className="mt-1 flex items-center gap-1.5 rounded-lg text-[13px] text-muted hover:text-forest"
            >
              <Stars value={warehouse.rating} size={13} />
              {t('reviews.ratingSummary', { rating: warehouse.rating, count: warehouse.review_count })}
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Pill tone={warehouse.is_cold_storage ? 'sky' : 'sage'}>
              {warehouse.is_cold_storage ? t('storage.cold') : t('storage.dry')}
            </Pill>
            {warehouse.owner_phone && (
              <a
                href={`tel:${warehouse.owner_phone}`}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-leaf hover:text-forest"
              >
                <PhoneIcon size={13} aria-hidden="true" />
                {t('storage.callOwner')}
              </a>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="font-semibold text-ink">{t('storage.rate', { rate: number(warehouse.price_per_kg_per_day) })}</p>
        {/* A daily per-kg rate is hard to picture, so show what a typical stay costs in total */}
        <p className="mb-2 text-[13px] text-muted">
          {t('storage.sample', { amount: rupees(Math.round(100 * 15 * warehouse.price_per_kg_per_day)) })}
        </p>
        <SpaceBar free={warehouse.available_capacity_kg} total={warehouse.total_capacity_kg} />
      </div>

      <Button variant="secondary" size="sm" onClick={onBook}>
        {t('storage.viewAndBook')}
      </Button>
    </li>
  )
}

const ORDER = { REQUESTED: 0, ACTIVE: 1 }

function MyStorage({ bookings }) {
  const { t } = useTranslation()
  // Overdue and waiting bookings first: they need the farmer's attention
  const open = (bookings.data ?? [])
    .filter((b) => b.status in ORDER)
    .sort((a, b) => Number(b.is_overdue) - Number(a.is_overdue) || ORDER[a.status] - ORDER[b.status])
  const past = (bookings.data ?? []).filter((b) => !(b.status in ORDER)).slice(0, 5)

  return (
    <Card>
      <div className="px-6 pt-6 pb-4">
        <Eyebrow icon={CalendarBlankIcon}>{t('storage.inStorage')}</Eyebrow>
        <h2 className="mt-1.5 text-[22px] text-ink">{t('storage.mine')}</h2>
      </div>
      {bookings.isPending ? (
        <SkeletonRows rows={2} />
      ) : bookings.isError ? (
        <ErrorState message={errorMessage(bookings.error, t)} onRetry={bookings.refetch} />
      ) : open.length === 0 && past.length === 0 ? (
        <EmptyState icon={CalendarBlankIcon} title={t('storage.emptyMine')} body={t('storage.emptyMineBody')} />
      ) : (
        <ul>
          {[...open, ...past].map((b) => (
            <StorageBookingRow key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </Card>
  )
}
