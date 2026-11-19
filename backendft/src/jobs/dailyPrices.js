import cron from "node-cron";
import { env } from "../config/env.js";
import { refreshAllPrices } from "../modules/produce/marketPrice.service.js";

async function run(reason, force) {
  try {
    const { updated, skipped, notListed } = await refreshAllPrices({ force });
    console.log(
      `Market prices (${reason}): ${updated} updated, ${skipped} already up to date, ${notListed} not listed on the site`,
    );
  } catch (err) {
    console.error(`Market price fetch (${reason}) failed: ${err.message}`);
  }
}

/**
 * Fetches every produce item's market price once a day at PRICE_FETCH_TIME, so farmers
 * always see today's rate. On startup it also fills in any prices missing for today,
 * in case the server wasn't running at the scheduled time.
 */
export function startDailyPriceJob() {
  if (!env.priceFetchEnabled) return;

  const { hour, minute, text } = env.priceFetchTime;
  cron.schedule(`${minute} ${hour} * * *`, () => run("daily", true), {
    timezone: env.priceFetchTimezone,
    name: "daily-market-prices",
    noOverlap: true,
  });
  console.log(`Market prices are fetched daily at ${text} (${env.priceFetchTimezone})`);

  run("startup catch-up", false);
}
