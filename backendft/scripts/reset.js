import pool from "../src/db/pool.js";
import { env } from "../src/config/env.js";
import { resetDatabase, runMigrations } from "../src/db/migrator.js";
import { runSeed } from "../src/db/seed.js";

// Wipes ALL data, so it needs an explicit confirmation flag: npm run db:reset -- --yes
const dbName = new URL(env.databaseUrl).pathname.slice(1);

if (env.nodeEnv === "production") {
  console.error("Refusing to reset a production database.");
  process.exit(1);
}
if (!process.argv.includes("--yes")) {
  console.error(`This drops every table in "${dbName}". Re-run with: npm run db:reset -- --yes`);
  process.exit(1);
}

try {
  await resetDatabase();
  console.log(`dropped all tables in ${dbName}`);
  await runMigrations();
  await runSeed();
} catch (err) {
  console.error("Reset failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
