import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { homePathFor, useAuth } from '@/auth/AuthContext'
import { LanguageSwitch } from '@/components/Brand'
import { farmPhotoBackground, glassCardClasses } from '@/lib/ui'

// Slider panel for placing the card; loaded only in development
const CardTuner = import.meta.env.DEV ? lazy(() => import('@/components/CardTuner')) : null

/**
 * Where the card sits: x = space from the left edge (vw), y = shift up/down from the
 * vertical middle (vh), width in px. Adjust with the dev slider panel, then copy the values here.
 */
const CARD_POSITION = { x: 8, y: -5.5, width: 472 }
const TUNER_KEY = 'agrichain_card_position'

function savedPosition() {
  if (!import.meta.env.DEV) return CARD_POSITION
  try {
    return { ...CARD_POSITION, ...JSON.parse(localStorage.getItem(TUNER_KEY) ?? '{}') }
  } catch {
    return CARD_POSITION
  }
}

const STEPS = ['step1', 'step2', 'step3']

// The farm photo, darkened towards the left so the card's text stays readable
const HERO_BACKGROUND = farmPhotoBackground(
  'linear-gradient(90deg, rgb(12 32 17 / 0.45), rgb(12 32 17 / 0.1) 55%, transparent)',
)

export default function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [card, setCard] = useState(savedPosition)

  const moveCard = (next) => {
    setCard(next)
    try {
      localStorage.setItem(TUNER_KEY, JSON.stringify(next))
    } catch {
      // storage blocked: the position just won't survive a reload
    }
  }
  const resetCard = () => {
    setCard(CARD_POSITION)
    try {
      localStorage.removeItem(TUNER_KEY)
    } catch {
      // nothing saved
    }
  }

  return (
    <>
      <section className="relative flex min-h-dvh flex-col bg-forest-deep text-white" style={HERO_BACKGROUND}>
        <header className="relative flex items-center justify-center px-10 pt-10">
          {/* Centre pill: How it works */}
          <nav
            aria-label={t('nav.main')}
            className="flex items-center rounded-full border border-white/10 bg-ink/55 p-1.5 backdrop-blur-md"
          >
            <a
              href="#how-it-works"
              className="rounded-full bg-lime px-5 py-2.5 text-[13px] font-bold tracking-wide text-forest-deep uppercase hover:bg-lime-hover"
            >
              {t('landing.howItWorks')}
            </a>
          </nav>

          <div className="absolute top-9 right-10">
            <LanguageSwitch inverted />
          </div>
        </header>

        <div className="flex flex-1 items-center py-16 pr-[6vw]" style={{ paddingLeft: `${card.x}vw` }}>
          <div
            style={{ maxWidth: card.width, transform: card.y ? `translateY(${card.y}vh)` : undefined }}
            className={`w-full p-9 ${glassCardClasses}`}
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-sage-strong uppercase">{t('landing.eyebrow')}</p>
            <h1 className="mt-3 text-[42px] leading-[1.12] text-white">
              <span className="block">{t('landing.title1')}</span>
              <span className="block text-sage-strong">{t('landing.title2')}</span>
            </h1>

            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">{t('landing.loginHint')}</p>

            {/* One login for everyone: the account's role decides where they land */}
            <Link
              to={user ? homePathFor(user) : '/login'}
              className="group mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime text-[15px] font-bold text-forest-deep shadow-[0_0_24px_rgb(140_198_63/0.3)] transition-colors hover:bg-lime-hover"
            >
              {user ? t('landing.myDashboard') : t('landing.login')}
              <ArrowRightIcon
                size={18}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            {!user && (
              <p className="mt-4 text-center text-sm text-white/75">
                {t('landing.newHere')}{' '}
                <Link to="/signup" className="font-semibold text-white underline-offset-4 hover:underline">
                  {t('landing.createAccount')}
                </Link>
              </p>
            )}
          </div>
        </div>

        {CardTuner && (
          <Suspense fallback={null}>
            <CardTuner value={card} onChange={moveCard} onReset={resetCard} />
          </Suspense>
        )}
      </section>

      <section id="how-it-works" className="bg-paper px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-leaf uppercase">{t('landing.howItWorks')}</p>
          <h2 className="mt-2 max-w-xl text-[36px] leading-tight text-ink">{t('landing.howTitle')}</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step} className="rounded-2xl border border-line bg-white p-7">
                <span className="flex size-10 items-center justify-center rounded-full bg-sage font-serif text-lg text-forest">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl text-ink">{t(`landing.${step}Title`)}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{t(`landing.${step}Body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="bg-forest-deep bg-[url('/field-lines.svg')] px-8 py-8 text-center text-sm text-sage-strong">
        {t('app.name')}: {t('app.tagline')}
      </footer>
    </>
  )
}
