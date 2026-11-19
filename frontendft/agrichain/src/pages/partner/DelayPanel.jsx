import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CarIcon, CloudRainIcon, DotsThreeCircleIcon, HourglassMediumIcon, TrafficConeIcon } from '@phosphor-icons/react'
import { useReportDelay } from '@/api/partner'
import { errorMessage } from '@/lib/errors'
import { itemsText } from '@/lib/orders'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { FormError } from '@/components/Field'
import { useToast } from '@/components/toast-context'

const REASONS = [
  { key: 'TRAFFIC', icon: CarIcon },
  { key: 'VEHICLE', icon: TrafficConeIcon },
  { key: 'WEATHER', icon: CloudRainIcon },
  { key: 'WAITING_AT_FARM', icon: HourglassMediumIcon },
  { key: 'OTHER', icon: DotsThreeCircleIcon },
]
const MINUTES = [15, 30, 45, 60, 90]

/** Tell the buyer and farmer a delivery is running late: pick a reason and about how long. Mounted only while open. */
export function DelayPanel({ order, onClose }) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const report = useReportDelay()
  const [reason, setReason] = useState(order.delay_reason ?? '')
  const [minutes, setMinutes] = useState(order.delay_minutes ?? 0)
  const [missing, setMissing] = useState(false)

  const submit = () => {
    if (!reason || !minutes) {
      setMissing(true)
      return
    }
    report.mutate(
      { id: order.id, reason, minutes },
      {
        onSuccess: () => {
          toast(t('partner.delay.sent'))
          onClose()
        },
      },
    )
  }

  return (
    <Panel
      open
      onClose={onClose}
      title={t('partner.delay.title')}
      subtitle={t('partner.delay.subtitle', {
        items: itemsText(order, i18n.language),
        buyer: order.buyer_name,
      })}
      footer={
        <div className="space-y-3">
          <FormError message={report.isError ? errorMessage(report.error, t) : null} />
          {missing && (!reason || !minutes) && <p className="text-[13px] font-medium text-danger">{t('partner.delay.pickBoth')}</p>}
          <Button className="w-full" onClick={submit} loading={report.isPending}>
            {t('partner.delay.send')}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <fieldset>
          <legend className="text-sm font-medium text-ink">{t('partner.delay.why')}</legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {REASONS.map(({ key, icon: Icon }) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm transition-colors has-focus-visible:ring-4 has-focus-visible:ring-sage ${
                  reason === key ? 'border-forest bg-sage font-semibold text-forest' : 'border-line bg-white text-ink hover:border-leaf'
                }`}
              >
                <input
                  type="radio"
                  name="delay-reason"
                  value={key}
                  checked={reason === key}
                  onChange={() => setReason(key)}
                  className="sr-only"
                />
                <Icon size={20} aria-hidden="true" />
                {t(`delay.reason.${key}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-ink">{t('partner.delay.howLong')}</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {MINUTES.map((m) => (
              <label
                key={m}
                className={`cursor-pointer rounded-full border px-5 py-2 text-sm transition-colors has-focus-visible:ring-4 has-focus-visible:ring-sage ${
                  minutes === m ? 'border-forest bg-forest font-semibold text-white' : 'border-line bg-white text-ink hover:border-leaf'
                }`}
              >
                <input
                  type="radio"
                  name="delay-minutes"
                  value={m}
                  checked={minutes === m}
                  onChange={() => setMinutes(m)}
                  className="sr-only"
                />
                {t('partner.delay.minutes', { count: m })}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Panel>
  )
}
