// Must match PRICE_BAND in the backend (src/utils/constants.js)
export const PRICE_BAND = 0.2

export const round2 = (n) => Math.round(n * 100) / 100

/** The fair price range a farmer may sell at, given today's market price */
export function priceBand(marketPrice) {
  return {
    min: round2(marketPrice * (1 - PRICE_BAND)),
    max: round2(marketPrice * (1 + PRICE_BAND)),
  }
}

// The ruler shows 30% either side of the market price, so the ±20% band sits inside it
const RULER_SPAN = 0.3

/** Position (0–100) of a price on the fair-price ruler */
export function rulerPosition(price, marketPrice) {
  if (!marketPrice) return 50
  const low = marketPrice * (1 - RULER_SPAN)
  const pct = ((price - low) / (marketPrice * RULER_SPAN * 2)) * 100
  return Math.min(100, Math.max(0, pct))
}

export const BAND_START = ((RULER_SPAN - PRICE_BAND) / (RULER_SPAN * 2)) * 100
export const BAND_WIDTH = (PRICE_BAND / RULER_SPAN) * 100

// Must match DELIVERY_FEE in the backend (src/utils/constants.js): ₹20 plus ₹2 per kg
export const DELIVERY_FEE = { BASE: 20, PER_KG: 2 }

export const deliveryFee = (qty) => round2(DELIVERY_FEE.BASE + DELIVERY_FEE.PER_KG * qty)
