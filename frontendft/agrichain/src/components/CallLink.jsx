import { useTranslation } from 'react-i18next'
import { PhoneIcon } from '@phosphor-icons/react'

/** "Call {name}" link that opens the phone dialler; renders nothing without a number */
export function CallLink({ name, phone }) {
  const { t } = useTranslation()
  if (!phone) return null
  return (
    <a
      href={`tel:${phone}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf underline-offset-4 hover:text-forest hover:underline"
    >
      <PhoneIcon size={14} aria-hidden="true" />
      {t('common.call', { name })}
    </a>
  )
}
