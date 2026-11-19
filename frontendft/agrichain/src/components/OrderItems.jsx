import { useTranslation } from 'react-i18next'
import { BasketIcon } from '@phosphor-icons/react'
import { number, rupees } from '@/lib/format'
import { produceName } from '@/lib/produce'
import { IconCircle, ProduceMark } from './Bits'

/** The round icon of an order: the produce for one item, a basket for several */
export function OrderMark({ order, size = 'md' }) {
  const [first] = order.items
  if (order.items.length === 1) return <ProduceMark name={first.produce_name} category={first.produce_category} size={size} />
  return <IconCircle icon={BasketIcon} size={size} />
}

/** One line per item (kg, name, price), shown only when an order holds more than one product */
export function OrderItemLines({ order, withPrice = false }) {
  const { i18n } = useTranslation()
  if (order.items.length < 2) return null
  return (
    <ul className="mt-1.5 space-y-0.5 text-sm text-muted">
      {order.items.map((item) => (
        <li key={item.listing_id} className="flex justify-between gap-6">
          <span>
            {number(item.quantity)} kg {produceName(item.produce_name, i18n.language)}
          </span>
          {withPrice && <span className="whitespace-nowrap">{rupees(item.line_total)}</span>}
        </li>
      ))}
    </ul>
  )
}
