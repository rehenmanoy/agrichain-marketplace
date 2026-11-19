import pool from "../src/db/pool.js";
import { refreshAllPrices } from "../src/modules/produce/marketPrice.service.js";

// Fetch today's market prices now, the same as the daily job: npm run prices:fetch
try {
  const { updated, notListed } = await refreshAllPrices({ force: true });
  console.log(`${updated} prices updated, ${notListed} items not listed on the site today`);
} catch (err) {
  console.error("Price fetch failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
