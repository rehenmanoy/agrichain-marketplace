import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BellIcon } from '@phosphor-icons/react'
import { useNotifications } from '@/api/notifications'
import { NotificationsPanel } from './NotificationsPanel'

/** The bell in the top bar: a badge with the unread count, and the list in a side panel */
export function NotificationBell() {
  const { t } = useTranslation()
  const list = useNotifications()
  const [open, setOpen] = useState(false)
  const unread = list.data?.unread_count ?? 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex size-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-sage hover:text-forest"
        aria-label={unread > 0 ? t('notifications.bellUnread', { count: unread }) : t('notifications.title')}
        title={t('notifications.title')}
      >
        <BellIcon size={20} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </>
  )
}
