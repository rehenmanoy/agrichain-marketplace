import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { SignOutIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { LanguageSwitch, Logo } from './Brand'
import { NotificationBell } from './NotificationBell'

/**
 * The top bar shared by every role's pages.
 * links: [{ to, label, icon, end?, badge?: number, badgeLabel?: translation key }]
 */
export function AppHeader({ homePath, links }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    // Only the middle column is white, so the leaf pattern beside the page runs up to the top
    <header className="sticky top-0 z-30">
      <div className="mx-auto max-w-[1280px] border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-10 px-8">
          <NavLink to={homePath} aria-label={t('nav.home')}>
            <Logo />
          </NavLink>

          <nav aria-label={t('nav.main')} className="flex h-full items-stretch gap-1">
            {links.map(({ to, label, icon: Icon, end, badge, badgeLabel }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3 text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'font-semibold text-forest after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-forest'
                      : 'text-ink hover:text-forest'
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {t(label)}
                {badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-[11px] font-semibold text-white">
                    {badge}
                    {badgeLabel && <span className="sr-only"> {t(badgeLabel)}</span>}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <LanguageSwitch />
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-line pl-4">
              {/* The name opens the account page: profile and password */}
              <NavLink
                to="/account"
                aria-label={t('nav.account')}
                title={t('nav.account')}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg py-1 pr-2 transition-colors hover:bg-sage ${isActive ? 'bg-sage' : ''}`
                }
              >
                <span
                  className="flex size-9 items-center justify-center rounded-full bg-sage font-serif text-forest"
                  aria-hidden="true"
                >
                  {user?.name?.[0] ?? ''}
                </span>
                <span className="max-w-40 truncate text-sm font-medium text-ink">{user?.name}</span>
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
              >
                <SignOutIcon size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
