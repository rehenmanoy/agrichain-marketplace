import fs from "node:fs/promises";
import pool from "./pool.js";
import { withTransaction } from "./transaction.js";

const MIGRATIONS_DIR = new URL("./migrations/", import.meta.url);

// Dropped in reverse dependency order by resetDatabase()
const TABLES = [
  "notifications",
  "password_resets",
  "partner_reviews",
  "warehouse_reviews",
  "reviews",
  "booking_extensions",
  "warehouse_bookings",
  "warehouse_photos",
  "warehouses",
  "cart_items",
  "order_items",
  "orders",
  "listings",
  "price_history",
  "produce",
  "users",
  "regions",
  "schema_migrations",
];

/** Applies every .sql file in migrations/ that hasn't been applied yet, in filename order. */
export async function runMigrations({ log = console.log } = {}) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  const applied = new Set(
    (await pool.query("SELECT name FROM schema_migrations")).rows.map((row) => row.name),
  );
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await fs.readFile(new URL(file, MIGRATIONS_DIR), "utf8");
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    });
    log(`applied ${file}`);
    count++;
  }
  log(count ? `${count} migration(s) applied` : "database is up to date");
}

/** Drops every AgriChain table. Only used by `npm run db:reset` and the test setup. */
export async function resetDatabase() {
  await pool.query(`DROP TABLE IF EXISTS ${TABLES.join(", ")} CASCADE`);
}
