import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUUpLeftIcon, CheckCircleIcon, ClockCountdownIcon, TruckIcon } from '@phosphor-icons/react'
import { useCompleteDelivery, useGiveBackDelivery, useMyDeliveries } from '@/api/partner'
import { useDashboard } from '@/api/dashboard'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, rupees } from '@/lib/format'
import { itemsText, orderTitle } from '@/lib/orders'
import { Card, PageHeader } from '@/components/Bits'
import { Button, ButtonLink } from '@/components/Button'
import { DelayNotice } from '@/components/DelayNotice'
import { DeliveryRoute } from '@/components/DeliveryRoute'
import { OrderItemLines, OrderMark } from '@/components/OrderItems'
import { ConfirmDialog } from '@/components/Dialogs'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { useToast } from '@/components/toast-context'
import { DelayPanel } from './DelayPanel'

export default function MyDeliveries() {
  const { t } = useTranslation()
  const deliveries = useMyDeliveries()
  const dashboard = useDashboard()

  const onTheWay = deliveries.data?.filter((o) => o.status === 'OUT_FOR_DELIVERY') ?? []
  const done = deliveries.data?.filter((o) => o.status === 'DELIVERED') ?? []

  if (deliveries.isPending || deliveries.isError) {
    return (
      <>
        <PageHeader title={t('partner.mine.title')} subtitle={t('partner.mine.subtitle')} />
        <Card>
          {deliveries.isError ? (
            <ErrorState message={errorMessage(deliveries.error, t)} onRetry={deliveries.refetch} />
          ) : (
            <SkeletonRows rows={3} />
          )}
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={t('partner.mine.title')}
        subtitle={t('partner.mine.subtitle')}
        action={
          <p className="text-right">
            <span className="block text-xs text-muted">{t('partner.mine.earnedTotal')}</span>
            <span className="font-serif text-3xl text-ink">{rupees(dashboard.data?.total_earned)}</span>
          </p>
        }
      />

      <div className="space-y-12">
        <section aria-labelledby="on-the-way-heading">
          <h2 id="on-the-way-heading" className="mb-4 flex items-center gap-3 text-xl text-ink">
            {t('partner.mine.onTheWay')}
            {onTheWay.length > 0 && (
              <span className="rounded-full bg-amber px-2.5 py-0.5 font-sans text-xs font-semibold text-white">{onTheWay.length}</span>
            )}
          </h2>
          {onTheWay.length === 0 ? (
            <Card>
              <EmptyState
                icon={TruckIcon}
                title={t('partner.mine.emptyActive')}
                body={t('partner.mine.emptyActiveBody')}
                action={<ButtonLink to="/partner/available">{t('partner.mine.findOne')}</ButtonLink>}
              />
            </Card>
          ) : (
            <ul className="space-y-4">
              {onTheWay.map((order) => (
                <ActiveDelivery key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 text-xl text-ink">
            {t('partner.mine.history')}
          </h2>
          {done.length === 0 ? (
            <Card>
              <EmptyState icon={CheckCircleIcon} title={t('partner.mine.emptyDone')} body={t('partner.mine.emptyDoneBody')} />
            </Card>
          ) : (
            <Card as="ul">
              {done.map((order) => (
                <DoneDelivery key={order.id} order={order} />
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  )
}

function ActiveDelivery({ order }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const complete = useCompleteDelivery()
  const giveBack = useGiveBackDelivery()
  const [asking, setAsking] = useState(null) // 'deliver' | 'giveBack'
  const [lateOpen, setLateOpen] = useState(false)

  const run = (mutation, message) =>
    mutation.mutate(order.id, {
      onSuccess: () => {
        setAsking(null)
        toast(message)
      },
      onError: (error) => {
        setAsking(null)
        toast(errorMessage(error, t), 'error')
      },
    })

  return (
    <Card as="li" className="grid grid-cols-[1fr_1.6fr_auto] gap-10 px-7 py-6">
      <div className="flex gap-4">
        <OrderMark order={order} />
        <div>
          <p className="font-serif text-xl text-ink">{orderTitle(order, lang, t)}</p>
          <OrderItemLines order={order} />
          <p className="mt-1 text-sm text-muted">{t('partner.mine.pickedUp', { time: formatDateTime(order.picked_up_at, lang) })}</p>
          <div className="mt-3">
            <DelayNotice order={order} />
          </div>
        </div>
      </div>

      <DeliveryRoute order={order} showCalls />

      <div className="flex min-w-48 flex-col items-stretch gap-3 text-right">
        <div>
          <p className="text-xs text-muted">{t('partner.youEarn')}</p>
          <p className="font-serif text-2xl text-ink">{rupees(order.delivery_fee)}</p>
        </div>
        <Button icon={CheckCircleIcon} onClick={() => setAsking('deliver')}>
          {t('partner.mine.markDelivered')}
        </Button>
        <Button variant="secondary" icon={ClockCountdownIcon} onClick={() => setLateOpen(true)}>
          {order.delay_minutes ? t('partner.mine.changeLate') : t('partner.mine.runningLate')}
        </Button>
        <Button variant="ghost" size="sm" icon={ArrowUUpLeftIcon} onClick={() => setAsking('giveBack')}>
          {t('partner.mine.giveBack')}
        </Button>
      </div>

      <ConfirmDialog
        open={asking === 'deliver'}
        onClose={() => setAsking(null)}
        onConfirm={() => run(complete, t('partner.mine.deliveredToast'))}
        loading={complete.isPending}
        tone="primary"
        title={t('partner.mine.deliverTitle')}
        body={t('partner.mine.deliverBody', { items: itemsText(order, lang), buyer: order.buyer_name })}
        confirmLabel={t('partner.mine.yesDelivered')}
      />
      <ConfirmDialog
        open={asking === 'giveBack'}
        onClose={() => setAsking(null)}
        onConfirm={() => run(giveBack, t('partner.mine.gaveBackToast'))}
        loading={giveBack.isPending}
        title={t('partner.mine.giveBackTitle')}
        body={t('partner.mine.giveBackBody')}
        confirmLabel={t('partner.mine.yesGiveBack')}
      />
      {lateOpen && <DelayPanel key={order.id} order={order} onClose={() => setLateOpen(false)} />}
    </Card>
  )
}

function DoneDelivery({ order }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  return (
    <li className="grid grid-cols-[1.4fr_1.4fr_auto] items-center gap-8 border-t border-line-soft px-6 py-5 first:border-t-0">
      <div className="flex gap-4">
        <OrderMark order={order} />
        <div>
          <p className="font-semibold text-ink">{orderTitle(order, lang, t)}</p>
          <p className="text-sm text-muted">{formatDateTime(order.delivered_at, lang)}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        {order.farmer_name} → {order.buyer_name}
      </p>
      <p className="font-serif text-xl text-ink">{rupees(order.delivery_fee)}</p>
    </li>
  )
}
