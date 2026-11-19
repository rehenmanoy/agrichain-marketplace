import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  BellRingingIcon,
  ClockCountdownIcon,
  CurrencyInrIcon,
  GaugeIcon,
  LeafIcon,
  ListChecksIcon,
  StarIcon,
  WarehouseIcon,
} from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useDashboard } from '@/api/dashboard'
import { useIncomingBookings, useMyWarehouses } from '@/api/owner'
import { errorMessage } from '@/lib/errors'
import { formatDate, formatLongDate, number, rupees, timeAgo } from '@/lib/format'
import { greetingKey } from '@/lib/greeting'
import { Card, Eyebrow, IconCircle, Pill } from '@/components/Bits'
import { ButtonLink } from '@/components/Button'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { SpaceBar } from '@/components/SpaceBar'
import { Stars } from '@/components/StarRating'
import { WarehouseThumb } from '@/components/PhotoGallery'
import { BookingPill } from './BookingPill'

export default function OwnerHome() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const dashboard = useDashboard()
  const warehouses = useMyWarehouses()
  const bookings = useIncomingBookings()
  const data = dashboard.data

  const requests = data?.pending_requests ?? 0
  const extensions = data?.pending_extensions ?? 0
  const overdue = data?.overdue_bookings ?? 0
  const waiting = requests + extensions

  let statusLine = t('owner.home.statusQuiet')
  if (waiting > 0) statusLine = t('owner.home.statusWaiting', { count: waiting })
  else if (overdue > 0) statusLine = t('owner.home.statusOverdue', { count: overdue })

  const stats = [
    { icon: WarehouseIcon, label: t('owner.home.warehouses'), value: number(data?.warehouses) },
    { icon: GaugeIcon, label: t('owner.home.inUse'), value: `${number(data?.occupancy_pct)}%` },
    { icon: ListChecksIcon, label: t('owner.home.activeBookings'), value: number(data?.active_bookings) },
    { icon: CurrencyInrIcon, label: t('owner.home.income'), value: rupees(data?.booking_revenue) },
  ]

  const alerts = [
    { count: requests, tone: 'amber', text: 'owner.home.alertRequests', icon: BellRingingIcon },
    { count: extensions, tone: 'amber', text: 'owner.home.alertExtensions', icon: ClockCountdownIcon },
    { count: overdue, tone: 'danger', text: 'owner.home.alertOverdue', icon: ClockCountdownIcon },
  ].filter((alert) => alert.count > 0)

  const latest = (bookings.data ?? []).slice(0, 4)

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Pill icon={LeafIcon}>{formatLongDate(new Date(), i18n.language)}</Pill>
          <h1 className="mt-5 text-[42px] leading-[1.15]">
            <span className="block text-ink">{t(greetingKey(), { name: user?.name ?? '' })}</span>
            <span className="block text-leaf">{statusLine}</span>
          </h1>
        </div>
        <ButtonLink to="/owner/warehouses" icon={WarehouseIcon}>
          {t('owner.home.manage')}
        </ButtonLink>
      </section>

      <ul className="mt-10 grid grid-cols-4 gap-5">
        {stats.map(({ icon, label, value }) => (
          <Card as="li" key={label} className="p-5">
            <div className="flex items-center gap-3">
              <IconCircle icon={icon} size="sm" />
              <p className="text-sm text-muted">{label}</p>
            </div>
            {dashboard.isPending ? (
              <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-line-soft" />
            ) : (
              <p className="mt-3 font-serif text-[34px] leading-none text-ink">{value}</p>
            )}
          </Card>
        ))}
      </ul>

      {alerts.length > 0 && (
        <ul className="mt-6 space-y-3">
          {alerts.map(({ count, tone, text, icon: Icon }) => (
            <li key={text}>
              <Link
                to="/owner/bookings"
                className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium ${
                  tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-amber-soft text-amber'
                }`}
              >
                <Icon size={18} weight="bold" aria-hidden="true" />
                {t(text, { count })}
                <ArrowRightIcon size={14} className="ml-auto" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="px-6 pt-6 pb-4">
            <Eyebrow icon={WarehouseIcon}>{user?.region_name}</Eyebrow>
            <h2 className="mt-1.5 text-[22px] text-ink">{t('owner.home.yourWarehouses')}</h2>
          </div>
          {warehouses.isPending ? (
            <SkeletonRows rows={2} />
          ) : warehouses.isError ? (
            <ErrorState message={errorMessage(warehouses.error, t)} onRetry={warehouses.refetch} />
          ) : warehouses.data.length === 0 ? (
            <EmptyState
              icon={WarehouseIcon}
              title={t('owner.warehouses.emptyTitle')}
              body={t('owner.warehouses.emptyBody')}
              action={<ButtonLink to="/owner/warehouses">{t('owner.home.addFirst')}</ButtonLink>}
            />
          ) : (
            <ul>
              {warehouses.data.map((warehouse) => (
                <li key={warehouse.id} className="grid grid-cols-[1.2fr_1fr] items-center gap-6 border-t border-line-soft px-6 py-4">
                  <div className="flex items-center gap-3">
                    <WarehouseThumb warehouse={warehouse} size="size-14" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{warehouse.name}</p>
                      <p className="truncate text-sm text-muted">{warehouse.location}</p>
                      {!warehouse.is_active && <Pill tone="muted">{t('owner.warehouses.paused')}</Pill>}
                    </div>
                  </div>
                  <SpaceBar free={warehouse.available_capacity_kg} total={warehouse.total_capacity_kg} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
        <Card>
          <div className="px-6 pt-6 pb-4">
            <Eyebrow icon={ListChecksIcon}>{t('owner.home.latestEyebrow')}</Eyebrow>
            <h2 className="mt-1.5 text-[22px] text-ink">{t('owner.home.latest')}</h2>
          </div>
          {bookings.isPending ? (
            <SkeletonRows rows={2} />
          ) : latest.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted">{t('owner.home.noBookings')}</p>
          ) : (
            <>
              <ul>
                {latest.map((b) => (
                  <li key={b.id} className="border-t border-line-soft px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">
                        {b.farmer_name} · {number(b.quantity_kg)} kg
                      </p>
                      <BookingPill booking={b} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {b.warehouse_name} · {formatDate(b.start_date, i18n.language)} – {formatDate(b.end_date, i18n.language)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                to="/owner/bookings"
                className="flex items-center gap-1.5 border-t border-line-soft px-6 py-4 text-sm font-medium text-leaf hover:text-forest"
              >
                {t('owner.home.seeAll')}
                <ArrowRightIcon size={14} aria-hidden="true" />
              </Link>
            </>
          )}
        </Card>

        <Card>
          <div className="px-6 pt-6 pb-4">
            <Eyebrow icon={StarIcon}>{t('reviews.ownerEyebrow')}</Eyebrow>
            <h2 className="mt-1.5 text-[22px] text-ink">{t('reviews.ownerTitle')}</h2>
            {data?.review_count > 0 && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <Stars value={data.rating} size={15} />
                {t('reviews.ratingSummary', { rating: data.rating, count: data.review_count })}
              </p>
            )}
          </div>
          {data?.recent_reviews?.length > 0 ? (
            <ul>
              {data.recent_reviews.map((r) => (
                <li key={r.id} className="border-t border-line-soft px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Stars value={r.rating} size={14} />
                      {r.farmer_name}
                    </p>
                    <span className="text-[13px] text-muted">{timeAgo(r.created_at, i18n.language)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-ink">{r.comment}</p>}
                  <p className="mt-0.5 text-[13px] text-muted">{r.warehouse_name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 pb-6 text-sm text-muted">{t('reviews.ownerEmpty')}</p>
          )}
        </Card>
        </div>
      </div>
    </>
  )
}
