import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowRightIcon, CurrencyInrIcon, LeafIcon, MapPinIcon, PackageIcon, StorefrontIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useMyOrders, useRegionListings } from '@/api/buyer'
import { useDashboard } from '@/api/dashboard'
import { errorMessage } from '@/lib/errors'
import { groupByFarmer } from '@/lib/farmers'
import { formatLongDate, rupees } from '@/lib/format'
import { greetingKey } from '@/lib/greeting'
import { orderTitle } from '@/lib/orders'
import { produceName } from '@/lib/produce'
import { Card, Eyebrow, IconCircle, Pill } from '@/components/Bits'
import { ButtonLink } from '@/components/Button'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { MarketTicker } from '@/components/MarketTicker'
import { OrderStatusPill } from '@/components/OrderStatus'
import { Stars } from '@/components/StarRating'

const ACTIVE = ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY']
const FARMERS_SHOWN = 6
const CHIPS_SHOWN = 4

export default function BuyerDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const orders = useMyOrders()
  const activeCount = orders.data?.filter((o) => ACTIVE.includes(o.status)).length ?? 0

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Pill icon={LeafIcon}>{formatLongDate(new Date(), i18n.language)}</Pill>
          <h1 className="mt-5 text-[42px] leading-[1.15]">
            <span className="block text-ink">{t(greetingKey(), { name: user?.name ?? '' })}</span>
            <span className="block text-leaf">
              {activeCount > 0 ? t('buyer.dashboard.statusActive', { count: activeCount }) : t('buyer.dashboard.statusNone')}
            </span>
          </h1>
        </div>
        <ButtonLink to="/buyer/shop" icon={StorefrontIcon}>
          {t('buyer.dashboard.shopCta')}
        </ButtonLink>
      </section>

      <MarketTicker />

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
        <NearbyFarmers />
        <div className="space-y-6">
          <LatestOrders orders={orders} />
          <SpendCard />
        </div>
      </div>
    </>
  )
}

function NearbyFarmers() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const listings = useRegionListings(user?.region_id)
  const farmers = groupByFarmer(listings.data ?? [])

  return (
    <Card className="lg:col-span-2">
      <div className="px-6 pt-6 pb-4">
        <Eyebrow icon={MapPinIcon}>{user?.region_name}</Eyebrow>
        <h2 className="mt-1.5 text-[22px] text-ink">{t('buyer.dashboard.nearTitle')}</h2>
      </div>

      {listings.isPending ? (
        <SkeletonRows rows={3} />
      ) : listings.isError ? (
        <ErrorState message={errorMessage(listings.error, t)} onRetry={listings.refetch} />
      ) : farmers.length === 0 ? (
        <EmptyState
          icon={StorefrontIcon}
          title={t('buyer.dashboard.nearEmptyTitle')}
          body={t('buyer.dashboard.nearEmptyBody', { region: user?.region_name })}
        />
      ) : (
        <ul>
          {farmers.slice(0, FARMERS_SHOWN).map((farmer) => (
            <li
              key={farmer.id}
              className="grid grid-cols-[1.3fr_1.6fr_auto] items-center gap-6 border-t border-line-soft px-6 py-5"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage font-serif text-lg text-forest"
                  aria-hidden="true"
                >
                  {farmer.name?.[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{farmer.name}</p>
                  <p className="flex items-center gap-1 truncate text-sm text-muted">
                    <MapPinIcon size={14} className="shrink-0" aria-hidden="true" />
                    {farmer.location}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                    {farmer.reviewCount > 0 ? (
                      <>
                        <Stars value={farmer.rating} size={14} />
                        {t('buyer.shop.rating', { rating: farmer.rating, count: farmer.reviewCount })}
                      </>
                    ) : (
                      t('buyer.shop.noRatings')
                    )}
                  </p>
                </div>
              </div>

              <ul className="flex flex-wrap gap-1.5">
                {farmer.items.slice(0, CHIPS_SHOWN).map((item) => (
                  <li key={item.id}>
                    <Pill tone="sage">{produceName(item.produce_name, i18n.language)}</Pill>
                  </li>
                ))}
                {farmer.items.length > CHIPS_SHOWN && (
                  <li>
                    <Pill tone="muted">{t('buyer.dashboard.moreItems', { count: farmer.items.length - CHIPS_SHOWN })}</Pill>
                  </li>
                )}
              </ul>

              <ButtonLink to={`/buyer/shop?farmer=${farmer.id}`} variant="secondary" size="sm">
                {t('buyer.dashboard.seeProduce')}
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function LatestOrders({ orders }) {
  const { t, i18n } = useTranslation()
  const latest = orders.data?.slice(0, 3) ?? []

  return (
    <Card>
      <div className="px-6 pt-6 pb-3">
        <Eyebrow icon={PackageIcon}>{t('buyer.dashboard.ordersEyebrow')}</Eyebrow>
        <h2 className="mt-1.5 text-[22px] text-ink">{t('buyer.dashboard.yourOrders')}</h2>
      </div>

      {orders.isPending ? (
        <SkeletonRows rows={2} />
      ) : orders.isError ? (
        <ErrorState message={errorMessage(orders.error, t)} onRetry={orders.refetch} />
      ) : latest.length === 0 ? (
        <div className="px-6 pb-6">
          <p className="font-semibold text-ink">{t('buyer.dashboard.noOrdersTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('buyer.dashboard.noOrdersBody')}</p>
          <ButtonLink to="/buyer/shop" size="sm" className="mt-4">
            {t('buyer.dashboard.shopCta')}
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul>
            {latest.map((order) => (
              <li key={order.id} className="border-t border-line-soft px-6 py-4">
                <p className="font-semibold text-ink">{orderTitle(order, i18n.language, t)}</p>
                <p className="mt-0.5 text-sm text-muted">{t('buyer.orders.from', { farmer: order.farmer_name })}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <OrderStatusPill status={order.status} labels="buyer.orders.status" />
                  <span className="font-serif text-lg text-ink">{rupees(order.grand_total)}</span>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/buyer/orders"
            className="flex items-center gap-1.5 border-t border-line-soft px-6 py-4 text-sm font-medium text-leaf hover:text-forest"
          >
            {t('buyer.dashboard.seeAllOrders')}
            <ArrowRightIcon size={14} aria-hidden="true" />
          </Link>
        </>
      )}
    </Card>
  )
}

function SpendCard() {
  const { t } = useTranslation()
  const dashboard = useDashboard()
  const data = dashboard.data

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <IconCircle icon={CurrencyInrIcon} size="sm" />
        <p className="text-sm text-muted">{t('buyer.dashboard.spent')}</p>
      </div>
      {dashboard.isPending ? (
        <div className="mt-4 h-14 animate-pulse rounded-lg bg-line-soft" />
      ) : (
        <>
          <p className="mt-3 font-serif text-[38px] leading-none text-ink">{rupees(data?.total_spent)}</p>
          {data?.upcoming_spend > 0 && (
            <p className="mt-3 border-t border-line-soft pt-3 text-[13px] text-muted">
              {t('buyer.dashboard.upcoming', { amount: rupees(data.upcoming_spend) })}
            </p>
          )}
        </>
      )}
    </Card>
  )
}
