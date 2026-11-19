import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowClockwiseIcon, ArrowLeftIcon, HouseIcon } from '@phosphor-icons/react'
import { LanguageSwitch, Logo } from '@/components/Brand'

// The giant 404 is cut out of the farm photo, with a soft lime glow around it
const NUMBER_STYLE = {
  backgroundImage: "url('/hero-farm.webp')",
  backgroundSize: 'cover',
  backgroundPosition: 'center 60%',
  filter: 'drop-shadow(0 0 28px rgb(140 198 63 / 0.35)) drop-shadow(0 0 2px rgb(140 198 63 / 0.6))',
}

const PRIMARY_BUTTON =
  'inline-flex h-12 items-center gap-2 rounded-full bg-lime px-7 text-[15px] font-semibold text-forest-deep shadow-[0_0_24px_rgb(140_198_63/0.35)] transition-colors hover:bg-lime-hover'
const SECONDARY_BUTTON =
  'inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-white/10'

/**
 * Shown for addresses that don't exist, and when a page can't load because the server can't be
 * reached (the router passes state.reason === 'connection' and the page to return to in state.from).
 */
export default function Error404Page() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { state } = useLocation()
  const isConnection = state?.reason === 'connection'
  // React Router counts in-app history; "Go back" only makes sense if there's somewhere to go back to
  // The sign-in check lives above the router and wouldn't retry by itself, so ask it to
  const tryAgain = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] })
    navigate(state.from || '/', { replace: true })
  }
  const canGoBack = (window.history.state?.idx ?? 0) > 0

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-forest-deep bg-[url('/field-lines.svg')] text-white">
      {/* Warm light behind the numbers */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_42%,rgb(140_198_63/0.16),transparent_70%)]"
        aria-hidden="true"
      />

      <header className="relative flex items-center justify-between px-10 pt-9">
        <Link to="/" aria-label={t('notFound.home')}>
          <Logo inverted />
        </Link>
        <LanguageSwitch inverted />
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <p
          className="bg-clip-text font-sans text-[clamp(180px,26vw,400px)] leading-[0.85] font-extrabold tracking-[-0.05em] text-transparent select-none"
          style={NUMBER_STYLE}
          aria-hidden="true"
        >
          404
        </p>

        {isConnection ? (
          <>
            <p className="mt-8 text-[12px] font-semibold tracking-[0.16em] text-lime uppercase">
              {t('notFound.connectionEyebrow')}
            </p>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,3.4vw,46px)] leading-tight text-white [text-wrap:balance]">
              {t('notFound.connectionTitle')}
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-white/75">{t('notFound.connectionBody')}</p>
          </>
        ) : (
          <>
            <p className="mt-8 text-[12px] font-semibold tracking-[0.16em] text-lime uppercase">{t('notFound.eyebrow')}</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(32px,3.4vw,46px)] leading-tight [text-wrap:wrap]">
              <span className="block text-white">{t('notFound.title')}</span>
              <span className="block text-sage-strong">{t('notFound.subtitle')}</span>
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-white/75">{t('notFound.body')}</p>
          </>
        )}

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {isConnection ? (
            <>
              {/* Back to the page that couldn't load; it tries to load again */}
              <button type="button" onClick={tryAgain} className={PRIMARY_BUTTON}>
                <ArrowClockwiseIcon size={18} weight="bold" aria-hidden="true" />
                {t('notFound.tryAgain')}
              </button>
              <Link to="/" className={SECONDARY_BUTTON}>
                <HouseIcon size={18} weight="bold" aria-hidden="true" />
                {t('notFound.home')}
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={PRIMARY_BUTTON}>
                <HouseIcon size={18} weight="bold" aria-hidden="true" />
                {t('notFound.home')}
              </Link>
              {canGoBack && (
                <button type="button" onClick={() => navigate(-1)} className={SECONDARY_BUTTON}>
                  <ArrowLeftIcon size={18} weight="bold" aria-hidden="true" />
                  {t('notFound.back')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
