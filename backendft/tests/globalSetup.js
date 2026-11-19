// Rebuilds the test database (TEST_DATABASE_URL) from scratch before the test run
export async function setup() {
  process.env.NODE_ENV = "test";
  const { default: pool } = await import("../src/db/pool.js");
  const { resetDatabase, runMigrations } = await import("../src/db/migrator.js");
  const { runSeed } = await import("../src/db/seed.js");

  const silent = () => {};
  await resetDatabase();
  await runMigrations({ log: silent });
  await runSeed({ log: silent });
  await pool.end();
}
