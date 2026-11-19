import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  BellIcon,
  CurrencyInrIcon,
  LeafIcon,
  PlantIcon,
  PlusIcon,
  StarIcon,
} from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useDashboard } from '@/api/dashboard'
import { useMyListings } from '@/api/listings'
import { useIncomingOrders } from '@/api/orders'
import { formatLongDate, number, rupees } from '@/lib/format'
import { greetingKey } from '@/lib/greeting'
import { itemsText } from '@/lib/orders'
import { produceAltName, produceName } from '@/lib/produce'
import { Card, Eyebrow, IconCircle, Pill, ProduceMark } from '@/components/Bits'
import { ButtonLink } from '@/components/Button'
import { WeekBars } from '@/components/WeekBars'
import { MarketTicker } from '@/components/MarketTicker'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { OrderDecision } from '@/components/OrderDecision'
import { PriceRuler } from '@/components/PriceRuler'
import { errorMessage } from '@/lib/errors'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const listings = useMyListings()
  const orders = useIncomingOrders()

  const pending = orders.data?.filter((o) => o.status === 'PENDING') ?? []
  const onSale = listings.data?.filter((l) => l.is_active) ?? []
  const firstName = user?.name ?? ''

  let statusLine = t('dashboard.nothingOnSale')
  if (pending.length > 0) statusLine = t('dashboard.waiting', { count: pending.length })
  else if (onSale.length > 0) statusLine = t('dashboard.onSale')

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Pill icon={LeafIcon}>{formatLongDate(new Date(), i18n.language)}</Pill>
          <h1 className="mt-5 text-[42px] leading-[1.15]">
            <span className="block text-ink">{t(greetingKey(), { name: firstName })}</span>
            <span className="block text-leaf">{statusLine}</span>
          </h1>
        </div>
        <ButtonLink to="/farmer/produce?sell=1" icon={PlusIcon}>
          {t('produce.sell')}
        </ButtonLink>
      </section>

      <MarketTicker />

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
        <ProduceOnSale listings={listings} onSale={onSale} />
        <div className="space-y-6">
          <NeedsAnswer orders={orders} pending={pending} />
          <MoneyCard />
          <RatingCard />
        </div>
      </div>
    </>
  )
}

function ProduceOnSale({ listings, onSale }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-end justify-between px-6 pt-6 pb-4">
        <div>
          <Eyebrow icon={PlantIcon}>{t('dashboard.onSaleEyebrow')}</Eyebrow>
          <h2 className="mt-1.5 text-[22px] text-ink">{t('dashboard.yourProduce')}</h2>
        </div>
        {onSale.length > 0 && (
          <Link to="/farmer/produce" className="flex items-center gap-1.5 text-sm font-medium text-leaf hover:text-forest">
            {t('dashboard.seeAll')}
            <ArrowRightIcon size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      {listings.isPending ? (
        <SkeletonRows rows={3} />
      ) : listings.isError ? (
        <ErrorState message={errorMessage(listings.error, t)} onRetry={listings.refetch} />
      ) : onSale.length === 0 ? (
        <EmptyState
          icon={PlantIcon}
          title={t('dashboard.emptyProduce')}
          body={t('dashboard.emptyProduceBody')}
          action={
            <ButtonLink to="/farmer/produce?sell=1" icon={PlusIcon}>
              {t('produce.sell')}
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ul>
            {onSale.slice(0, 5).map((listing) => (
              <li
                key={listing.id}
                className="grid grid-cols-[1.6fr_0.8fr_0.7fr_1.5fr_auto] items-center gap-5 border-t border-line-soft px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <ProduceMark name={listing.produce_name} category={listing.produce_category} />
                  <div>
                    <p className="font-semibold text-ink">{produceName(listing.produce_name, lang)}</p>
                    <p className="text-sm text-muted">{produceAltName(listing.produce_name, lang)}</p>
                  </div>
                </div>
                <p className="text-sm text-ink">{t('produce.left', { qty: number(listing.available_qty) })}</p>
                <p className="font-semibold whitespace-nowrap text-ink">{t('common.perKg', { price: rupees(listing.listing_price) })}</p>
                <PriceRuler price={listing.listing_price} marketPrice={listing.market_price} />
                <ButtonLink to={`/farmer/produce?edit=${listing.id}`} variant="ghost" size="sm">
                  {t('produce.change')}
                </ButtonLink>
              </li>
            ))}
          </ul>
          <p className="border-t border-line-soft px-6 py-4 text-[13px] text-muted">{t('dashboard.rulerHint')}</p>
        </>
      )}
    </Card>
  )
}

function MoneyCard() {
  const { t } = useTranslation()
  const dashboard = useDashboard()
  const data = dashboard.data
  const days = data?.revenue_last_7_days ?? []
  const week = days.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <IconCircle icon={CurrencyInrIcon} size="sm" />
        <p className="text-sm text-muted">{t('dashboard.earnedWeek')}</p>
      </div>
      {dashboard.isPending ? (
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-line-soft" />
      ) : (
        <>
          <p className="mt-3 font-serif text-[38px] leading-none text-ink">{rupees(week)}</p>

          <WeekBars days={days} valueKey="revenue" />

          <div className="mt-5 space-y-1 border-t border-line-soft pt-4 text-[13px] text-muted">
            <p>{t('dashboard.earnedTotal', { amount: rupees(data?.total_earned) })}</p>
            {data?.pending_earnings > 0 && <p>{t('dashboard.pendingMoney', { amount: rupees(data.pending_earnings) })}</p>}
          </div>
        </>
      )}
    </Card>
  )
}

function NeedsAnswer({ orders, pending }) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <Eyebrow icon={BellIcon}>{t('dashboard.needsAnswer')}</Eyebrow>
        {pending.length > 0 && <Pill tone="amber">{pending.length}</Pill>}
      </div>

      {orders.isPending ? (
        <SkeletonRows rows={2} />
      ) : pending.length === 0 ? (
        <div className="px-6 pb-6">
          <p className="font-semibold text-ink">{t('dashboard.noNewOrders')}</p>
          <p className="mt-1 text-sm text-muted">{t('dashboard.noNewOrdersBody')}</p>
        </div>
      ) : (
        <ul>
          {pending.slice(0, 3).map((order) => (
            <li key={order.id} className="border-t border-line-soft px-6 py-4">
              <p className="font-semibold text-ink">
                {t('dashboard.wants', {
                  buyer: order.buyer_name,
                  items: itemsText(order, i18n.language),
                })}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {order.delivery_address}, {rupees(order.total_price)}
              </p>
              <div className="mt-3">
                <OrderDecision order={order} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <Link
          to="/farmer/orders"
          className="flex items-center gap-1.5 border-t border-line-soft px-6 py-4 text-sm font-medium text-leaf hover:text-forest"
        >
          {t('dashboard.seeOrders')}
          <ArrowRightIcon size={14} aria-hidden="true" />
        </Link>
      )}
    </Card>
  )
}

function RatingCard() {
  const { t } = useTranslation()
  const dashboard = useDashboard()
  const data = dashboard.data

  return (
    <Card className="flex items-center gap-4 p-6">
      <IconCircle icon={StarIcon} />
      <div>
        <p className="text-sm text-muted">{t('dashboard.rating')}</p>
        {data?.review_count > 0 ? (
          <p className="text-ink">
            <span className="font-serif text-2xl">{data.rating}</span>
            <span className="text-sm text-muted"> / 5, {t('dashboard.reviews', { count: data.review_count })}</span>
          </p>
        ) : (
          <p className="font-semibold text-ink">{t('dashboard.noRating')}</p>
        )}
      </div>
    </Card>
  )
}
