import axios from "axios";
import * as cheerio from "cheerio";

// Daily Kerala market prices
const SOURCE_URLS = {
  VEGETABLE: "https://vegetablemarketprice.com/market/kerala/today",
  FRUIT: "https://vegetablemarketprice.com/fruits/kerala/today",
};

// Pages are cached briefly so creating several listings doesn't re-download them each time
const CACHE_TTL_MS = 30 * 60 * 1000;
const pageCache = new Map();

const normalize = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Finds the wholesale price for a produce item in the site's price table.
 * Rows look like: [image] [name] [₹price] [retail range] [unit]. The name must match exactly,
 * so "Potato" doesn't pick up "Sweet Potato".
 */
export function findPriceInHtml(html, produceName) {
  const $ = cheerio.load(html);
  const wanted = normalize(produceName);
  let price = null;

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3 || normalize($(cells[1]).text()) !== wanted) return;

    const value = Number($(cells[2]).text().replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value) && value > 0) price = value;
    return false; // stop at the matching row
  });

  return price;
}

/** Forget downloaded pages, so the next lookup fetches the site's latest prices */
export function clearPageCache() {
  pageCache.clear();
}

async function fetchHtml(url) {
  const cached = pageCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.html;

  const resp = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AgriChain/1.0)" },
  });
  pageCache.set(url, { html: resp.data, fetchedAt: Date.now() });
  return resp.data;
}

/**
 * Scrapes today's price for a produce item. Checks the page for its own category first.
 * Returns null if the item isn't listed; throws if no page could be fetched at all.
 */
export async function scrapeMarketPrice(produceName, category) {
  const urls = category === "FRUIT"
    ? [SOURCE_URLS.FRUIT, SOURCE_URLS.VEGETABLE]
    : [SOURCE_URLS.VEGETABLE, SOURCE_URLS.FRUIT];

  let lastError = null;
  let fetchedAny = false;
  for (const url of urls) {
    try {
      const price = findPriceInHtml(await fetchHtml(url), produceName);
      fetchedAny = true;
      if (price !== null) return price;
    } catch (err) {
      lastError = err;
    }
  }

  if (!fetchedAny && lastError) throw lastError;
  return null;
}
