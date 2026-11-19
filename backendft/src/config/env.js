import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";
const isTest = nodeEnv === "test";

export const env = {
  nodeEnv,
  isTest,
  port: Number(process.env.PORT) || 5000,
  // Tests run against a separate database so they can reset it freely
  databaseUrl: isTest ? required("TEST_DATABASE_URL") : required("DATABASE_URL"),
  // Uploaded photos live here (tests use a throwaway folder so they never touch real uploads)
  uploadDir: isTest
    ? path.join(os.tmpdir(), "agrichain-test-uploads")
    : path.resolve(process.env.UPLOAD_DIR || fileURLToPath(new URL("../../uploads", import.meta.url))),
  jwtSecret: required("JWT_SECRET"),
  // A token lasts this long; the app swaps it for a fresh one while the user is active
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  // The "forgot password" code is also returned in the response (so it can be tried without SMS).
  // On by default everywhere except production; set RESET_CODE_IN_RESPONSE=false to turn it off.
  exposeResetCode:
    process.env.RESET_CODE_IN_RESPONSE !== undefined
      ? process.env.RESET_CODE_IN_RESPONSE === "true"
      : nodeEnv !== "production",
  // However active the user is, one login cannot be extended past this many hours
  sessionMaxHours: Number(process.env.SESSION_MAX_HOURS) || 12,
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
  // Daily market price fetch: 24-hour "HH:MM" in the given timezone
  priceFetchTime: priceFetchTime(),
  priceFetchTimezone: process.env.PRICE_FETCH_TIMEZONE || "Asia/Kolkata",
  priceFetchEnabled: process.env.PRICE_FETCH_ENABLED !== "false" && !isTest,
};

function priceFetchTime() {
  const value = process.env.PRICE_FETCH_TIME || "06:00";
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error(`PRICE_FETCH_TIME must be HH:MM (24-hour), got "${value}"`);
  return { hour: Number(match[1]), minute: Number(match[2]), text: value };
}
