import pool from "../../db/pool.js";
import { serviceUnavailable } from "../../utils/AppError.js";
import { clearPageCache, scrapeMarketPrice } from "./marketPrice.scraper.js";

/** Stores (or replaces) today's price for one produce item */
async function saveTodayPrice(produceId, price) {
  const saved = await pool.query(
    `INSERT INTO price_history (produce_id, market_price) VALUES ($1, $2)
     ON CONFLICT (produce_id, date) DO UPDATE SET market_price = EXCLUDED.market_price
     RETURNING market_price, date`,
    [produceId, price],
  );
  return saved.rows[0];
}

async function tryScrape(produce) {
  try {
    return await scrapeMarketPrice(produce.name, produce.category);
  } catch (err) {
    console.warn(`Market price scrape failed for ${produce.name}: ${err.message}`);
    return null;
  }
}

/**
 * Today's market price for a produce row ({ id, name, category }).
 * Normally the daily job has already stored it; otherwise it's fetched now.
 *
 * 1. price already stored for today      → source "TODAY"
 * 2. otherwise scrape it and store it     → source "TODAY"
 * 3. scrape failed / item not on the site → last known price, source "LAST_KNOWN"
 * 4. nothing known at all                 → 503
 */
export async function getMarketPrice(produce) {
  const stored = await pool.query(
    "SELECT market_price, date FROM price_history WHERE produce_id = $1 AND date = CURRENT_DATE",
    [produce.id],
  );
  if (stored.rowCount > 0) {
    return { price: stored.rows[0].market_price, date: stored.rows[0].date, source: "TODAY" };
  }

  const scraped = await tryScrape(produce);
  if (scraped !== null) {
    const saved = await saveTodayPrice(produce.id, scraped);
    return { price: saved.market_price, date: saved.date, source: "TODAY" };
  }

  const lastKnown = await pool.query(
    `SELECT market_price, date FROM price_history
     WHERE produce_id = $1 ORDER BY date DESC LIMIT 1`,
    [produce.id],
  );
  if (lastKnown.rowCount > 0) {
    return { price: lastKnown.rows[0].market_price, date: lastKnown.rows[0].date, source: "LAST_KNOWN" };
  }

  throw serviceUnavailable(`Market price for ${produce.name} is not available right now`);
}

/**
 * Fetches today's price for every produce item and stores it. Used by the daily job.
 * force: true  → download fresh pages and overwrite today's prices (the scheduled run)
 * force: false → only fill in items that have no price for today yet (catch-up on startup)
 * Returns counts: { updated, skipped, notListed }.
 */
export async function refreshAllPrices({ force = false } = {}) {
  if (force) clearPageCache();

  const produce = await pool.query("SELECT id, name, category FROM produce WHERE NOT is_custom ORDER BY id");
  const today = await pool.query("SELECT produce_id FROM price_history WHERE date = CURRENT_DATE");
  const hasToday = new Set(today.rows.map((r) => r.produce_id));

  const result = { updated: 0, skipped: 0, notListed: 0 };
  // One at a time: the scraper reuses the two downloaded pages for every item
  for (const item of produce.rows) {
    if (!force && hasToday.has(item.id)) {
      result.skipped++;
      continue;
    }
    const price = await tryScrape(item);
    if (price === null) {
      result.notListed++;
      continue;
    }
    await saveTodayPrice(item.id, price);
    result.updated++;
  }
  return result;
}
