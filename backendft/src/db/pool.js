import pg from "pg";
import { env } from "../config/env.js";

// Return NUMERIC / BIGINT as JS numbers and DATE as a plain "YYYY-MM-DD" string,
// so routes don't need to convert every row by hand and dates don't shift with timezones.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

const pool = new pg.Pool({ connectionString: env.databaseUrl });

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

export default pool;
