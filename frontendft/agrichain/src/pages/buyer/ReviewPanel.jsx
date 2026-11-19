import { useTranslation } from 'react-i18next'
import { TruckIcon } from '@phosphor-icons/react'
import { useReviewOrder } from '@/api/buyer'
import { useReviewPartner } from '@/api/reviews'
import { orderTitle, produceNames } from '@/lib/orders'
import { IconCircle } from '@/components/Bits'
import { OrderMark } from '@/components/OrderItems'
import { RatingPanel } from '@/components/RatingPanel'

/**
 * Rate a delivered order: the farmer (target "farmer") or the delivery partner (target "partner").
 * Mounted only while open.
 */
export function ReviewPanel({ order, target = 'farmer', onClose }) {
  const { t, i18n } = useTranslation()
  const rateFarmer = useReviewOrder()
  const ratePartner = useReviewPartner()
  const produce = produceNames(order, i18n.language)
  const forPartner = target === 'partner'

  return (
    <RatingPanel
      title={
        forPartner
          ? t('buyer.orders.reviewPartnerTitle', { name: order.delivery_partner_name })
          : t('buyer.orders.reviewTitle', { farmer: order.farmer_name })
      }
      header={
        <>
          {forPartner ? <IconCircle icon={TruckIcon} size="lg" /> : <OrderMark order={order} size="lg" />}
          <div>
            <p className="font-serif text-xl text-ink">
              {forPartner ? order.delivery_partner_name : orderTitle(order, i18n.language, t)}
            </p>
            <p className="text-sm text-muted">
              {forPartner ? orderTitle(order, i18n.language, t) : t('buyer.orders.from', { farmer: order.farmer_name })}
            </p>
          </div>
        </>
      }
      question={forPartner ? t('buyer.orders.reviewPartnerQuestion') : t('buyer.orders.reviewQuestion', { produce })}
      mutation={forPartner ? ratePartner : rateFarmer}
      toArgs={({ rating, comment }) => ({ id: order.id, rating, comment })}
      doneText={t('buyer.orders.thanks')}
      onClose={onClose}
    />
  )
}
