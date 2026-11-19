import app from "./app.js";
import { env } from "./config/env.js";
import pool from "./db/pool.js";
import { startDailyPriceJob } from "./jobs/dailyPrices.js";

const server = app.listen(env.port, () => {
  console.log(`AgriChain API listening on http://localhost:${env.port}`);
  startDailyPriceJob();
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
