import pool from "../src/db/pool.js";
import { runMigrations } from "../src/db/migrator.js";

try {
  await runMigrations();
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
