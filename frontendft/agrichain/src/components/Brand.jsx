import { useTranslation } from 'react-i18next'
import { LeafIcon, TranslateIcon } from '@phosphor-icons/react'

export function Logo({ inverted = false }) {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${inverted ? 'bg-white text-forest' : 'bg-forest text-white'}`}
      >
        <LeafIcon size={20} weight="fill" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className={`block font-serif text-lg ${inverted ? 'text-white' : 'text-forest'}`}>{t('app.name')}</span>
        <span className={`block text-[11px] whitespace-nowrap ${inverted ? 'text-sage-strong' : 'text-muted'}`}>{t('app.tagline')}</span>
      </span>
    </span>
  )
}

/** Switches between English and Malayalam; the label is the language you switch to */
export function LanguageSwitch({ inverted = false }) {
  const { t, i18n } = useTranslation()
  const next = i18n.language === 'ml' ? 'en' : 'ml'
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      lang={next}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
        inverted
          ? // On photos and dark green: a solid light pill, so it's easy to see
            'border-white bg-white/95 font-medium text-forest-deep shadow-md hover:bg-white'
          : 'border-line bg-white text-ink hover:border-leaf hover:text-forest'
      }`}
    >
      <TranslateIcon size={16} aria-hidden="true" />
      {t('nav.switchTo')}
    </button>
  )
}
