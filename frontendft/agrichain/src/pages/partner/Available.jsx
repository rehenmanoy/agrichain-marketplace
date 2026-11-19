import { useTranslation } from 'react-i18next'
import { HandGrabbingIcon, PackageIcon } from '@phosphor-icons/react'
import { useAvailableDeliveries, useTakeDelivery } from '@/api/partner'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, rupees } from '@/lib/format'
import { orderTitle } from '@/lib/orders'
import { Card, PageHeader } from '@/components/Bits'
import { Button } from '@/components/Button'
import { DeliveryRoute } from '@/components/DeliveryRoute'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { OrderItemLines, OrderMark } from '@/components/OrderItems'
import { useToast } from '@/components/toast-context'

export default function Available() {
  const { t } = useTranslation()
  const available = useAvailableDeliveries()

  return (
    <>
      <PageHeader title={t('partner.available.title')} subtitle={t('partner.available.subtitle')} />

      {available.isPending ? (
        <Card>
          <SkeletonRows rows={3} />
        </Card>
      ) : available.isError ? (
        <Card>
          <ErrorState message={errorMessage(available.error, t)} onRetry={available.refetch} />
        </Card>
      ) : available.data.length === 0 ? (
        <Card>
          <EmptyState icon={PackageIcon} title={t('partner.available.empty')} body={t('partner.available.emptyBody')} />
        </Card>
      ) : (
        <ul className="space-y-4">
          {available.data.map((order) => (
            <AvailableOrder key={order.id} order={order} />
          ))}
        </ul>
      )}
    </>
  )
}

function AvailableOrder({ order }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const take = useTakeDelivery()

  const onTake = () =>
    take.mutate(order.id, {
      onSuccess: () => toast(t('partner.available.taken')),
      onError: (error) => toast(errorMessage(error, t), 'error'),
    })

  return (
    <Card as="li" className="grid grid-cols-[1.1fr_1.6fr_auto] items-center gap-10 px-7 py-6">
      <div className="flex gap-4">
        <OrderMark order={order} />
        <div>
          <p className="font-serif text-xl text-ink">{orderTitle(order, lang, t)}</p>
          <OrderItemLines order={order} />
          <p className="mt-1 text-sm text-muted">{t('partner.available.accepted', { time: formatDateTime(order.updated_at, lang) })}</p>
        </div>
      </div>

      <DeliveryRoute order={order} />

      <div className="flex min-w-44 flex-col items-end gap-3 text-right">
        <div>
          <p className="text-xs text-muted">{t('partner.youEarn')}</p>
          <p className="font-serif text-2xl text-ink">{rupees(order.delivery_fee)}</p>
        </div>
        <Button icon={HandGrabbingIcon} onClick={onTake} loading={take.isPending}>
          {t('partner.available.take')}
        </Button>
      </div>
    </Card>
  )
}
