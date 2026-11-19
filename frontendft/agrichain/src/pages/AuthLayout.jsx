import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HandshakeIcon, ScalesIcon, TruckIcon } from '@phosphor-icons/react'
import { LanguageSwitch, Logo } from '@/components/Brand'

/** Two-column layout for login and sign-up: the promise on the left, the form on the right */
export function AuthLayout({ children }) {
  const { t } = useTranslation()
  const points = [
    { icon: ScalesIcon, text: t('auth.point1') },
    { icon: HandshakeIcon, text: t('auth.point2') },
    { icon: TruckIcon, text: t('auth.point3') },
  ]

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Same deep green and field lines as beside the farmer pages */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest-deep bg-[url('/field-lines.svg')] px-14 py-12 text-white lg:flex">
        <Link to="/" aria-label={t('landing.backHome')} className="w-fit">
          <Logo inverted />
        </Link>
        <div className="relative z-10 max-w-md">
          <h1 className="text-[44px] leading-[1.12]">
            <span className="block text-white">{t('auth.sideTitle1')}</span>
            <span className="block text-sage-strong">{t('auth.sideTitle2')}</span>
          </h1>
          <ul className="mt-10 space-y-5">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4 text-[15px] text-white/90">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sage-strong">
                  <Icon size={20} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden="true" />
      </aside>

      <main className="flex flex-col px-8 py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" aria-label={t('landing.backHome')} className="lg:hidden">
            <Logo />
          </Link>
          <LanguageSwitch />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  )
}
