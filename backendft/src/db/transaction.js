import pool from "./pool.js";

/**
 * Runs fn(client) inside a transaction on a dedicated connection.
 * Commits if fn resolves, rolls back if it throws (the error is re-thrown).
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
