import { useTranslation } from 'react-i18next'
import { MapPinIcon, StorefrontIcon } from '@phosphor-icons/react'
import { CallLink } from './CallLink'

/** Where to collect (the farmer) and where to drop (the buyer). Call links show once the delivery is yours. */
export function DeliveryRoute({ order, showCalls = false }) {
  const { t } = useTranslation()
  return (
    <dl className="grid gap-5 text-sm">
      <div className="flex gap-3">
        <StorefrontIcon size={18} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{t('partner.pickup')}</dt>
          <dd className="mt-0.5 font-semibold text-ink">{order.farmer_name}</dd>
          <dd className="text-muted">{order.farmer_location}</dd>
          {showCalls && (
            <dd className="mt-1">
              <CallLink name={order.farmer_name} phone={order.farmer_phone} />
            </dd>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <MapPinIcon size={18} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{t('partner.drop')}</dt>
          <dd className="mt-0.5 font-semibold text-ink">{order.buyer_name}</dd>
          <dd className="text-muted">{order.delivery_address}</dd>
          {showCalls && (
            <dd className="mt-1">
              <CallLink name={order.buyer_name} phone={order.buyer_phone} />
            </dd>
          )}
        </div>
      </div>
    </dl>
  )
}
