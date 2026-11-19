import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPinIcon, PackageIcon, ReceiptIcon, StarIcon } from '@phosphor-icons/react'
import { useCancelMyOrder, useMyOrders } from '@/api/buyer'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, rupees } from '@/lib/format'
import { itemsText, orderTitle } from '@/lib/orders'
import { Card, PageHeader } from '@/components/Bits'
import { Button, ButtonLink } from '@/components/Button'
import { CallLink } from '@/components/CallLink'
import { DelayNotice } from '@/components/DelayNotice'
import { ConfirmDialog } from '@/components/Dialogs'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { OrderItemLines, OrderMark } from '@/components/OrderItems'
import { OrderStatusPill, OrderSteps } from '@/components/OrderStatus'
import { Stars } from '@/components/StarRating'
import { useToast } from '@/components/toast-context'
import { ReviewPanel } from './ReviewPanel'

const ACTIVE = ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY']
const RECENT = ['DELIVERED', 'CANCELLED']

export default function BuyerOrders() {
  const { t } = useTranslation()
  const orders = useMyOrders()
  const [reviewing, setReviewing] = useState(null) // { order, target: 'farmer' | 'partner' }

  const active = orders.data?.filter((o) => ACTIVE.includes(o.status)) ?? []
  const recent = orders.data?.filter((o) => RECENT.includes(o.status)) ?? []

  if (orders.isPending) {
    return (
      <>
        <PageHeader title={t('buyer.orders.title')} subtitle={t('buyer.orders.subtitle')} />
        <Card>
          <SkeletonRows rows={3} />
        </Card>
      </>
    )
  }
  if (orders.isError) {
    return (
      <>
        <PageHeader title={t('buyer.orders.title')} subtitle={t('buyer.orders.subtitle')} />
        <Card>
          <ErrorState message={errorMessage(orders.error, t)} onRetry={orders.refetch} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('buyer.orders.title')} subtitle={t('buyer.orders.subtitle')} />

      <div className="space-y-12">
        <section aria-labelledby="active-heading">
          <h2 id="active-heading" className="mb-4 flex items-center gap-3 text-xl text-ink">
            {t('buyer.orders.active')}
            {active.length > 0 && (
              <span className="rounded-full bg-amber px-2.5 py-0.5 font-sans text-xs font-semibold text-white">{active.length}</span>
            )}
          </h2>
          {active.length === 0 ? (
            <Card>
              <EmptyState
                icon={PackageIcon}
                title={t('buyer.orders.emptyActive')}
                body={t('buyer.orders.emptyActiveBody')}
                action={<ButtonLink to="/buyer/shop">{t('buyer.dashboard.shopCta')}</ButtonLink>}
              />
            </Card>
          ) : (
            <ul className="space-y-4">
              {active.map((order) => (
                <ActiveOrder key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-4 text-xl text-ink">
            {t('buyer.orders.recent')}
          </h2>
          {recent.length === 0 ? (
            <Card>
              <EmptyState icon={ReceiptIcon} title={t('buyer.orders.emptyRecent')} body={t('buyer.orders.emptyRecentBody')} />
            </Card>
          ) : (
            <Card as="ul">
              {recent.map((order) => (
                <RecentOrder
                  key={order.id}
                  order={order}
                  onRate={() => setReviewing({ order, target: 'farmer' })}
                  onRatePartner={() => setReviewing({ order, target: 'partner' })}
                />
              ))}
            </Card>
          )}
        </section>
      </div>

      {reviewing && (
        <ReviewPanel
          key={`${reviewing.order.id}-${reviewing.target}`}
          order={reviewing.order}
          target={reviewing.target}
          onClose={() => setReviewing(null)}
        />
      )}
    </>
  )
}

function ActiveOrder({ order }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const cancel = useCancelMyOrder()
  const [confirming, setConfirming] = useState(false)

  const onCancel = () =>
    cancel.mutate(order.id, {
      onSuccess: () => {
        setConfirming(false)
        toast(t('buyer.orders.cancelled'))
      },
      onError: (error) => {
        setConfirming(false)
        toast(errorMessage(error, t), 'error')
      },
    })

  return (
    <Card as="li" className="grid grid-cols-[1.3fr_1.5fr_auto] items-center gap-10 px-7 py-6">
      <div className="flex gap-4">
        <OrderMark order={order} />
        <div className="min-w-0">
          <p className="font-serif text-xl text-ink">{orderTitle(order, lang, t)}</p>
          <OrderItemLines order={order} />
          <p className="mt-1 text-sm text-ink">
            {t('buyer.orders.from', { farmer: order.farmer_name })}
            <span className="text-muted"> · {t('buyer.orders.orderedOn', { time: formatDateTime(order.created_at, lang) })}</span>
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
            <MapPinIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {order.delivery_address}
          </p>
          {order.status !== 'OUT_FOR_DELIVERY' && (
            <div className="mt-2">
              <CallLink name={order.farmer_name} phone={order.farmer_phone} />
            </div>
          )}
        </div>
      </div>

      <div>
        <OrderSteps status={order.status} />
        <div className="mt-4 flex flex-col items-center gap-1.5 text-center text-sm">
          <OrderStatusPill status={order.status} labels="buyer.orders.status" />
          <DelayNotice order={order} />
          {order.status === 'OUT_FOR_DELIVERY' && (
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-ink">
              {t('buyer.orders.partner', { name: order.delivery_partner_name })}
              <CallLink name={order.delivery_partner_name} phone={order.delivery_partner_phone} />
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-40 flex-col items-end gap-3 text-right">
        <div>
          <p className="text-xs text-muted">{t('buyer.orders.total')}</p>
          <p className="font-serif text-2xl text-ink">{rupees(order.grand_total)}</p>
          <p className="text-xs text-muted">{t('buyer.orders.incDelivery', { fee: rupees(order.delivery_fee) })}</p>
        </div>
        {order.status === 'PENDING' && (
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            {t('buyer.orders.cancel')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={onCancel}
        loading={cancel.isPending}
        title={t('buyer.orders.cancelTitle')}
        body={t('buyer.orders.cancelBody', { items: itemsText(order, lang), farmer: order.farmer_name })}
        confirmLabel={t('buyer.orders.yesCancel')}
      />
    </Card>
  )
}

function RecentOrder({ order, onRate, onRatePartner }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  return (
    <li className="grid grid-cols-[1.4fr_1.2fr_auto] items-center gap-8 border-t border-line-soft px-6 py-5 first:border-t-0">
      <div className="flex gap-4">
        <OrderMark order={order} />
        <div className="min-w-0">
          <p className="font-semibold text-ink">{orderTitle(order, lang, t)}</p>
          <p className="text-sm text-muted">
            {t('buyer.orders.from', { farmer: order.farmer_name })}
            {' · '}
            {formatDateTime(order.delivered_at ?? order.updated_at, lang)}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <OrderStatusPill status={order.status} labels="buyer.orders.status" />
        {order.is_reviewed && (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <Stars value={order.review_rating} size={14} />
            {t('buyer.orders.yourRating', { rating: order.review_rating })}
          </p>
        )}
        {order.is_partner_reviewed && (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <Stars value={order.partner_review_rating} size={14} />
            {t('buyer.orders.yourDeliveryRating', { rating: order.partner_review_rating })}
          </p>
        )}
      </div>

      <div className="flex min-w-44 flex-col items-end gap-2.5 text-right">
        <p className="font-serif text-xl text-ink">{rupees(order.grand_total)}</p>
        {order.status === 'DELIVERED' && !order.is_reviewed && (
          <Button variant="secondary" size="sm" icon={StarIcon} onClick={onRate}>
            {t('buyer.orders.rate')}
          </Button>
        )}
        {order.status === 'DELIVERED' && order.delivery_partner_id && !order.is_partner_reviewed && (
          <Button variant="secondary" size="sm" icon={StarIcon} onClick={onRatePartner}>
            {t('buyer.orders.rateDelivery')}
          </Button>
        )}
      </div>
    </li>
  )
}
