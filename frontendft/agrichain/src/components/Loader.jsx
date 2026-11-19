import { useTranslation } from 'react-i18next'
import { SpinnerIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { Button } from './Button'

export function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60dvh] items-center justify-center text-muted" role="status">
      <SpinnerIcon size={28} className="animate-spin text-leaf" aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}

/** Grey placeholder rows shown while a list loads */
export function SkeletonRows({ rows = 3 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-line-soft px-6 py-4 first:border-t-0">
          <div className="size-10 animate-pulse rounded-full bg-line-soft" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-line-soft" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-line-soft" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-sage text-leaf">
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 text-lg text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center" role="alert">
      <WarningCircleIcon size={28} className="text-danger" aria-hidden="true" />
      <p className="mt-3 max-w-sm text-sm text-ink">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
