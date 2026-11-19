import { Navigate, useRouteError } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PlantIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { Logo } from '@/components/Brand'
import { Button } from '@/components/Button'
import { EmptyState, PageLoader } from '@/components/Loader'

function CenteredPage({ children }) {
  return (
    <div className="flex min-h-dvh flex-col px-8 py-8">
      <Logo />
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  )
}

/** Shown instead of a blank screen if a page crashes */
export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  console.error(error)
  return (
    <CenteredPage>
      <EmptyState
        icon={WarningCircleIcon}
        title={t('errors.generic')}
        action={<Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>}
      />
    </CenteredPage>
  )
}

export function ComingSoon() {
  const { t } = useTranslation()
  const { user, isLoading, logout } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return (
    <CenteredPage>
      <EmptyState
        icon={PlantIcon}
        title={t('comingSoon.title')}
        body={t('comingSoon.body', { role: t(`roles.${user?.role ?? 'BUYER'}`) })}
        action={
          <Button variant="secondary" onClick={logout}>
            {t('comingSoon.logout')}
          </Button>
        }
      />
    </CenteredPage>
  )
}
