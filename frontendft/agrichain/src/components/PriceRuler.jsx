import { useTranslation } from 'react-i18next'
import { rupees } from '@/lib/format'
import { BAND_START, BAND_WIDTH, priceBand, rulerPosition } from '@/lib/pricing'

/**
 * The fair-price ruler: today's market price in the middle, the allowed ±20% band shaded,
 * and a marker for the farmer's price.
 */
export function PriceRuler({ price, marketPrice, size = 'sm' }) {
  const { t } = useTranslation()
  if (!marketPrice) return null

  const { min, max } = priceBand(marketPrice)
  const position = rulerPosition(price, marketPrice)
  const large = size === 'lg'
  const barHeight = large ? 'h-2.5' : 'h-1.5'
  const label = `${t('produce.yourPrice')} ${rupees(price)}, ${t('produce.market', { price: rupees(marketPrice) })}, ${t(
    'produce.priceRange',
    { min: rupees(min), max: rupees(max) },
  )}`

  return (
    // Padding + clip: the sliding layer can't cause scrollbars, and the marker stays whole at the ends
    <div role="img" aria-label={label} className="w-full overflow-x-clip px-2">
      <div className={`relative ${large ? 'h-7' : 'h-4'}`}>
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-line-soft ${barHeight}`} />
        <div
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-sage-strong ${barHeight}`}
          style={{ left: `${BAND_START}%`, width: `${BAND_WIDTH}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-forest/60" />
        {/* Full-width layer moved by transform, so the marker slides without layout work */}
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${position}%)` }}
        >
          <span
            className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-forest shadow-sm ${
              large ? 'h-6 w-4' : 'h-4 w-3'
            }`}
          />
        </div>
      </div>

      {large && (
        <div className="relative mt-2 h-4 text-xs text-muted" aria-hidden="true">
          <span className="absolute -translate-x-1/2" style={{ left: `${BAND_START}%` }}>
            {rupees(min)}
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold whitespace-nowrap text-forest">
            {t('produce.market', { price: rupees(marketPrice) })}
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${BAND_START + BAND_WIDTH}%` }}>
            {rupees(max)}
          </span>
        </div>
      )}
    </div>
  )
}
