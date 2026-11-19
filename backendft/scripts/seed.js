import pool from "../src/db/pool.js";
import { runSeed } from "../src/db/seed.js";

try {
  await runSeed();
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
