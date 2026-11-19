import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CheckCircleIcon, MapPinIcon, PackageIcon, StarIcon, TruckIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useIncomingOrders } from '@/api/orders'
import { useFarmerReviews } from '@/api/reviews'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, rupees } from '@/lib/format'
import { orderTitle } from '@/lib/orders'
import { Card, PageHeader } from '@/components/Bits'
import { CallLink } from '@/components/CallLink'
import { DelayNotice } from '@/components/DelayNotice'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { OrderDecision } from '@/components/OrderDecision'
import { OrderItemLines, OrderMark } from '@/components/OrderItems'
import { OrderStatusPill, OrderSteps } from '@/components/OrderStatus'

const TABS = [
  { key: 'new', label: 'orders.tabNew', statuses: ['PENDING'], empty: 'emptyNew', icon: PackageIcon },
  { key: 'active', label: 'orders.tabActive', statuses: ['CONFIRMED', 'OUT_FOR_DELIVERY'], empty: 'emptyActive', icon: TruckIcon },
  { key: 'done', label: 'orders.tabDone', statuses: ['DELIVERED', 'CANCELLED'], empty: 'emptyDone', icon: CheckCircleIcon },
]

export default function Orders() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const orders = useIncomingOrders()
  const reviews = useFarmerReviews(user?.id)
  const [params, setParams] = useSearchParams()

  const current = TABS.find((tab) => tab.key === params.get('tab')) ?? TABS[0]
  const inTab = (tab) => orders.data?.filter((o) => tab.statuses.includes(o.status)) ?? []
  const visible = inTab(current)
  const reviewByOrder = new Map((reviews.data ?? []).map((r) => [r.order_id, r]))

  const onTabKey = (e, index) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    const next = TABS[(index + step + TABS.length) % TABS.length]
    setParams({ tab: next.key })
    document.getElementById(`tab-${next.key}`)?.focus()
  }

  return (
    <>
      <PageHeader title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <div role="tablist" aria-label={t('orders.title')} className="flex gap-2 border-b border-line">
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
              aria-controls="orders-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setParams({ tab: tab.key })}
              onKeyDown={(e) => onTabKey(e, index)}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] transition-colors ${
                selected ? 'border-forest font-semibold text-forest' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t(tab.label)}
              {orders.data && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    tab.key === 'new' && count > 0 ? 'bg-amber text-white' : 'bg-line-soft text-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div id="orders-panel" role="tabpanel" aria-labelledby={`tab-${current.key}`} className="mt-6">
        {orders.isPending ? (
          <Card>
            <SkeletonRows rows={3} />
          </Card>
        ) : orders.isError ? (
          <Card>
            <ErrorState message={errorMessage(orders.error, t)} onRetry={orders.refetch} />
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={current.icon}
              title={t(`orders.${current.empty}`)}
              body={t(`orders.${current.empty}Body`)}
            />
          </Card>
        ) : (
          <ul className="space-y-4">
            {visible.map((order) => (
              <OrderCard key={order.id} order={order} review={reviewByOrder.get(order.id)} />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function OrderCard({ order, review }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  return (
    <Card as="li" className="grid grid-cols-[1.3fr_1.5fr_auto] items-center gap-10 px-7 py-6">
      <div className="flex gap-4">
        <OrderMark order={order} />
        <div className="min-w-0">
          <p className="font-serif text-xl text-ink">{orderTitle(order, lang, t)}</p>
          <OrderItemLines order={order} />
          <p className="mt-1 text-sm text-ink">
            {order.buyer_name}
            <span className="text-muted"> · {t('orders.ordered', { time: formatDateTime(order.created_at, lang) })}</span>
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
            <MapPinIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="sr-only">{t('orders.deliverTo')}: </span>
              {order.delivery_address}
            </span>
          </p>
          {order.status === 'PENDING' && (
            <div className="mt-2">
              <CallLink name={order.buyer_name} phone={order.buyer_phone} />
            </div>
          )}
        </div>
      </div>

      <div>
        {order.status === 'CANCELLED' ? (
          <OrderStatusPill status={order.status} />
        ) : (
          <>
            <OrderSteps status={order.status} />
            <div className="mt-4 text-center text-sm">
              {order.status === 'CONFIRMED' && <p className="text-muted">{t('orders.waitingPartner')}</p>}
              {order.status === 'OUT_FOR_DELIVERY' && order.delay_minutes > 0 && (
                <div className="mb-2">
                  <DelayNotice order={order} />
                </div>
              )}
              {order.status === 'OUT_FOR_DELIVERY' && (
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-ink">
                  <span>
                    {t('orders.partner')}: <span className="font-semibold">{order.delivery_partner_name}</span>
                  </span>
                  <CallLink name={order.delivery_partner_name} phone={order.delivery_partner_phone} />
                </p>
              )}
              {order.status === 'DELIVERED' && (
                <p className="text-muted">
                  {t('orders.deliveredAt', { time: formatDateTime(order.delivered_at, lang) })}
                  {review && (
                    <span className="mt-1 flex items-center justify-center gap-1 text-ink">
                      <StarIcon size={14} weight="fill" className="text-amber" aria-hidden="true" />
                      {t('orders.rated', { buyer: order.buyer_name, rating: review.rating })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex min-w-44 flex-col items-end gap-3 text-right">
        <div>
          <p className="text-xs text-muted">{t('orders.youGet')}</p>
          <p className="font-serif text-2xl text-ink">{rupees(order.total_price)}</p>
        </div>
        {order.status === 'PENDING' && <OrderDecision order={order} />}
      </div>
    </Card>
  )
}
