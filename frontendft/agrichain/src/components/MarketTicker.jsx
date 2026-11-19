import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react'
import { useMarketPrices } from '@/api/catalog'
import { rupees } from '@/lib/format'
import { round2 } from '@/lib/pricing'
import { produceName } from '@/lib/produce'

const ITEM_WIDTH = 216 // px, five items fill the page width
const SPEED = 36 // px per second

// A new random order on each page load (chosen once, outside of rendering)
const SEED = Math.floor(Math.random() * 2 ** 32)

/** Shuffles a copy of the list with a seeded generator, so re-renders keep the same order */
function shuffled(list, seed) {
  let s = seed
  const random = () => {
    s = (s + 0x6d2b79f5) | 0
    let x = Math.imul(s ^ (s >>> 15), 1 | s)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 2 ** 32
  }
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function PriceChange({ item }) {
  const { t } = useTranslation()
  // Nothing to compare with: show only the price
  if (item.source !== 'TODAY' || item.yesterday_price === null) return null

  const diff = round2(item.price - item.yesterday_price)
  if (diff === 0) return null

  const Icon = diff > 0 ? TrendUpIcon : TrendDownIcon
  return (
    <span className="flex items-center gap-1 text-xs whitespace-nowrap text-sage-strong">
      <Icon size={14} aria-hidden="true" />
      {t(diff > 0 ? 'dashboard.up' : 'dashboard.down', { amount: rupees(Math.abs(diff)) })}
    </span>
  )
}

function PriceList({ items, hidden = false }) {
  const { i18n } = useTranslation()
  return (
    <ul className={`flex ${hidden ? 'motion-reduce:hidden' : ''}`} aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li
          key={item.produce_id}
          className="shrink-0 border-l border-white/15 px-5 py-4 text-center"
          style={{ width: ITEM_WIDTH }}
        >
          <p className="truncate text-sm text-sage-strong">{produceName(item.name, i18n.language)}</p>
          {/* Price and its change from yesterday on one line */}
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-serif text-[28px] leading-tight">{rupees(item.price)}</span>
            <PriceChange item={item} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Today's market prices as a slowly moving ticker, in random order.
 * It pauses while hovered or focused with the keyboard, and becomes a plain scrollable row
 * for people who have reduced motion turned on.
 */
export function MarketTicker() {
  const { t } = useTranslation()
  const prices = useMarketPrices()

  const items = useMemo(
    () => shuffled((prices.data ?? []).filter((p) => p.price !== null), SEED),
    [prices.data],
  )
  const duration = (items.length * ITEM_WIDTH) / SPEED

  return (
    <section className="group mt-10" aria-labelledby="market-caption">
      {/* Same deep green and field lines as beside the page; bg-fixed lines them up with the sides */}
      <div className="overflow-hidden rounded-2xl bg-forest-deep bg-[url('/field-lines.svg')] bg-fixed text-white">
        {prices.isPending ? (
          <div className="grid h-[90px] grid-cols-5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="m-4 animate-pulse rounded-lg bg-white/10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-8 py-10 text-sm text-sage-strong">{t('dashboard.notAvailable')}</p>
        ) : (
          // Edges fade out, so prices drift in and out instead of being cut off.
          // Focusable, so keyboard users can stop it too (focus pauses it, like hovering).
          <div
            tabIndex={0}
            aria-label={t('dashboard.marketCaption')}
            className="overflow-hidden rounded-2xl [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] focus-visible:outline-offset-[-2px] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
          >
            <div
              className="flex w-max animate-[ticker_var(--ticker-duration)_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
              style={{ '--ticker-duration': `${duration}s` }}
            >
              {/* Two copies back to back: when the first has scrolled past, the loop restarts seamlessly */}
              <PriceList items={items} />
              <PriceList items={items} hidden />
            </div>
          </div>
        )}
      </div>

      <p id="market-caption" className="mt-2.5 text-xs text-muted">
        {t('dashboard.marketCaption')}
      </p>
    </section>
  )
}
