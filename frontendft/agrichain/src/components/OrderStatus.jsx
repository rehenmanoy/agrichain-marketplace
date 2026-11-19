import { useTranslation } from 'react-i18next'
import { BellIcon, CheckCircleIcon, CheckIcon, TruckIcon, XIcon } from '@phosphor-icons/react'
import { Pill } from './Bits'

const STATUS_STYLE = {
  PENDING: { tone: 'amber', icon: BellIcon },
  CONFIRMED: { tone: 'sage', icon: CheckIcon },
  OUT_FOR_DELIVERY: { tone: 'sky', icon: TruckIcon },
  DELIVERED: { tone: 'forest', icon: CheckCircleIcon },
  CANCELLED: { tone: 'muted', icon: XIcon },
}

/** labels: translation group for the wording, e.g. 'buyer.orders.status' for the buyer's point of view */
export function OrderStatusPill({ status, labels = 'orders.status' }) {
  const { t } = useTranslation()
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING
  return (
    <Pill tone={style.tone} icon={style.icon}>
      {t(`${labels}.${status}`)}
    </Pill>
  )
}

const STEP_INDEX = { PENDING: 0, CONFIRMED: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3 }
const STEPS = ['ordered', 'accepted', 'onTheWay', 'delivered']

/** Four-step progress line: Ordered → Accepted → On the way → Delivered */
export function OrderSteps({ status }) {
  const { t } = useTranslation()
  const current = STEP_INDEX[status] ?? 0

  return (
    <ol className="flex w-full items-start">
      {STEPS.map((step, i) => {
        const done = i <= current
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute top-[7px] right-1/2 h-0.5 w-full ${i <= current ? 'bg-forest' : 'bg-line'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex size-4 items-center justify-center rounded-full border-2 ${
                done ? 'border-forest bg-forest' : 'border-line bg-white'
              } ${i === current ? 'ring-4 ring-sage' : ''}`}
              aria-hidden="true"
            />
            <span className={`mt-2 text-xs ${i === current ? 'font-semibold text-forest' : done ? 'text-ink' : 'text-muted'}`}>
              {t(`orders.steps.${step}`)}
              {i === current && <span className="sr-only"> (current)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
