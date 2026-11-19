import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BellIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/notifications'
import { errorMessage } from '@/lib/errors'
import { formatDate, timeAgo } from '@/lib/format'
import { notificationKey, notificationLink } from '@/lib/notifications'
import { Button } from './Button'
import { Panel } from './Dialogs'
import { EmptyState, ErrorState, SkeletonRows } from './Loader'

/** The sentence for one notification, written from its type and data in the reader's language */
function useNotificationText() {
  const { t, i18n } = useTranslation()
  return (n) =>
    t(`notifications.types.${notificationKey(n)}`, {
      ...n.data,
      reason: n.data.reason ? t(`delay.reason.${n.data.reason}`) : undefined,
      date: n.data.date ? formatDate(n.data.date, i18n.language) : undefined,
      defaultValue: t('notifications.unknown'),
    })
}

/** The bell's list. Clicking a notification marks it read and opens the page it is about. */
export function NotificationsPanel({ onClose }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const list = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const textOf = useNotificationText()

  const open = (n) => {
    if (!n.read_at) markRead.mutate(n.id)
    onClose()
    navigate(notificationLink(n, user.role))
  }

  return (
    <Panel
      open
      onClose={onClose}
      title={t('notifications.title')}
      footer={
        list.data?.unread_count > 0 ? (
          <Button variant="secondary" className="w-full" onClick={() => markAll.mutate()} loading={markAll.isPending}>
            {t('notifications.markAll')}
          </Button>
        ) : undefined
      }
    >
      {list.isPending ? (
        <SkeletonRows rows={4} />
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error, t)} onRetry={list.refetch} />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={BellIcon} title={t('notifications.emptyTitle')} body={t('notifications.emptyBody')} />
      ) : (
        <ul className="-mx-2 divide-y divide-line-soft">
          {list.data.items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                className="flex w-full items-start gap-3 rounded-lg px-2 py-3.5 text-left transition-colors hover:bg-paper"
              >
                <span
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-amber'}`}
                  aria-label={n.read_at ? undefined : t('notifications.unread')}
                />
                <span className="min-w-0">
                  <span className={`block text-[15px] leading-snug ${n.read_at ? 'text-muted' : 'font-medium text-ink'}`}>
                    {textOf(n)}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">{timeAgo(n.created_at, i18n.language)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
