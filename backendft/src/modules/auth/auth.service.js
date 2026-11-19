import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { env } from "../../config/env.js";
import { badRequest, conflict, notFound, unauthorized } from "../../utils/AppError.js";
import { sendResetCode } from "../../utils/sms.js";
import { FARMER_RATINGS_JOIN } from "../reviews/reviews.queries.js";

const USER_COLUMNS = `u.id, u.name, u.phone, u.role, u.base_location, u.created_at,
                      u.region_id, r.name AS region_name,
                      fr.farmer_rating, COALESCE(fr.farmer_review_count, 0) AS farmer_review_count`;

const RESET_CODE_MINUTES = 10;
const RESET_MAX_ATTEMPTS = 5;
// The same answer for a wrong, expired, used or never-issued code, and for an unknown phone
const BAD_CODE = "That code is wrong or has expired";

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** auth_time is when the user really logged in; refreshed tokens keep it so the session has a hard cap */
function signToken(user, authTime = nowSeconds()) {
  return jwt.sign({ role: user.role, region_id: user.region_id, auth_time: authTime }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Swaps a still-valid token for a fresh one (the app does this while the user is active).
 * Refused once the original login is older than SESSION_MAX_HOURS, if the user no longer exists, or
 * if the password was changed after this login (every older login then has to sign in again).
 */
export async function refreshSession(userId, authTime) {
  if (nowSeconds() - authTime > env.sessionMaxHours * 3600) {
    throw unauthorized("Session expired, please log in again");
  }

  let user;
  try {
    user = await getUserById(userId);
  } catch {
    throw unauthorized("Account no longer exists");
  }

  const changed = await pool.query(
    "SELECT (password_changed_at IS NOT NULL AND EXTRACT(EPOCH FROM password_changed_at) > $2) AS changed FROM users WHERE id = $1",
    [userId, authTime],
  );
  if (changed.rows[0]?.changed) throw unauthorized("Your password was changed, please log in again");

  return { token: signToken(user, authTime), user };
}

export async function getUserById(userId) {
  const result = await pool.query(
    `SELECT ${USER_COLUMNS}
     FROM users u
     JOIN regions r ON r.id = u.region_id
     ${FARMER_RATINGS_JOIN} = u.id
     WHERE u.id = $1`,
    [userId],
  );
  if (result.rowCount === 0) throw notFound("User not found");
  return result.rows[0];
}

export async function register({ name, phone, password, role, region_id, base_location }) {
  const region = await pool.query("SELECT id FROM regions WHERE id = $1", [region_id]);
  if (region.rowCount === 0) throw badRequest("Region does not exist");

  const existing = await pool.query("SELECT 1 FROM users WHERE phone = $1", [phone]);
  if (existing.rowCount > 0) throw conflict("An account with this phone number already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await pool.query(
    `INSERT INTO users (name, phone, role, region_id, base_location, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [name, phone, role, region_id, base_location ?? null, passwordHash],
  );

  const user = await getUserById(inserted.rows[0].id);
  return { token: signToken(user), user };
}

export async function login({ phone, password }) {
  const result = await pool.query("SELECT id, password_hash FROM users WHERE phone = $1", [phone]);
  const row = result.rows[0];

  // Same message for unknown phone and wrong password, so accounts can't be probed
  const valid = row?.password_hash && (await bcrypt.compare(password, row.password_hash));
  if (!valid) throw unauthorized("Invalid phone number or password");

  const user = await getUserById(row.id);
  return { token: signToken(user), user };
}

/** Name and place only. The phone is the login and the area ties the user to their data. */
export async function updateProfile(userId, { name, base_location }) {
  await pool.query(
    "UPDATE users SET name = COALESCE($2, name), base_location = COALESCE($3, base_location) WHERE id = $1",
    [userId, name ?? null, base_location ?? null],
  );
  return getUserById(userId);
}

/** The user proves they know the current password. Returns a fresh login, since the old ones stop renewing. */
export async function changePassword(userId, { current_password, new_password }) {
  const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
  const hash = result.rows[0]?.password_hash;
  // A 400, not a 401: a 401 would make the app think the login expired and sign the user out
  if (!hash || !(await bcrypt.compare(current_password, hash))) throw badRequest("Your current password is wrong");
  if (await bcrypt.compare(new_password, hash)) throw badRequest("Choose a password different from your current one");

  const changed = await pool.query(
    `UPDATE users SET password_hash = $2, password_changed_at = NOW() WHERE id = $1
     RETURNING EXTRACT(EPOCH FROM password_changed_at) AS changed_at`,
    [userId, await bcrypt.hash(new_password, 10)],
  );

  // The fresh login is dated just after the change, so it is not one of the logins the change cuts off
  const user = await getUserById(userId);
  return { token: signToken(user, Math.ceil(changed.rows[0].changed_at)), user };
}

/**
 * Starts "forgot password": makes a 6-digit code for the phone, keeps only its hash, and sends it.
 * The answer is the same whether or not the phone has an account. When EXPOSE is on (development) the
 * code is also in the answer so the flow can be tried without an SMS service.
 */
export async function forgotPassword({ phone }) {
  const message = "If this phone number has an account, a code has been sent to it.";
  const result = await pool.query("SELECT id FROM users WHERE phone = $1", [phone]);
  if (result.rowCount === 0) return { message };

  const userId = result.rows[0].id;
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 8);

  await withTransaction(async (client) => {
    // A newer code replaces any older one that was not used
    await client.query("UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [userId]);
    await client.query(
      `INSERT INTO password_resets (user_id, code_hash, expires_at)
       VALUES ($1, $2, NOW() + make_interval(mins => $3))`,
      [userId, codeHash, RESET_CODE_MINUTES],
    );
  });
  await sendResetCode(phone, code);

  return env.exposeResetCode ? { message, dev_code: code } : { message };
}

/** Finishes "forgot password": a correct, unused, unexpired code sets the new password. */
export async function resetPassword({ phone, code, new_password }) {
  const outcome = await withTransaction(async (client) => {
    const found = await client.query(
      `SELECT r.id, r.code_hash, r.attempts, u.id AS user_id
       FROM users u
       JOIN password_resets r ON r.user_id = u.id
       WHERE u.phone = $1 AND r.used_at IS NULL AND r.expires_at > NOW()
       ORDER BY r.created_at DESC
       LIMIT 1
       FOR UPDATE OF r`,
      [phone],
    );
    if (found.rowCount === 0) return "bad";

    const reset = found.rows[0];
    if (!(await bcrypt.compare(code, reset.code_hash))) {
      // Count the wrong try, and cancel the code after too many. This is saved even though the request fails.
      const attempts = reset.attempts + 1;
      await client.query(
        "UPDATE password_resets SET attempts = $2::int, used_at = CASE WHEN $2::int >= $3::int THEN NOW() END WHERE id = $1",
        [reset.id, attempts, RESET_MAX_ATTEMPTS],
      );
      return "bad";
    }

    await client.query("UPDATE users SET password_hash = $2, password_changed_at = NOW() WHERE id = $1", [
      reset.user_id,
      await bcrypt.hash(new_password, 10),
    ]);
    await client.query("UPDATE password_resets SET used_at = NOW() WHERE id = $1", [reset.id]);
    return "ok";
  });

  if (outcome !== "ok") throw badRequest(BAD_CODE);
  return { message: "Your password has been changed. Log in with the new password." };
}
