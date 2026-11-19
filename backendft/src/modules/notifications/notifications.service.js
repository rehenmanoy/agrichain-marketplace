import pool from "../../db/pool.js";
import { notFound } from "../../utils/AppError.js";

/**
 * Tells one or more users something happened. Call it with the transaction's client, inside the same
 * transaction as the change itself, so a notice never exists for something that was rolled back
 * (and a change never goes unannounced). No text is stored: only the type and a little data.
 */
export async function notify(db, userIds, type, data = {}) {
  const ids = [...new Set([userIds].flat().filter(Boolean))];
  if (ids.length === 0) return;
  await db.query(
    "INSERT INTO notifications (user_id, type, data) SELECT UNNEST($1::int[]), $2, $3::jsonb",
    [ids, type, JSON.stringify(data)],
  );
}

/** { id: name } for the given users, to put names into notice data */
export async function namesOf(db, userIds) {
  const result = await db.query("SELECT id, name FROM users WHERE id = ANY($1)", [userIds.filter(Boolean)]);
  return Object.fromEntries(result.rows.map((row) => [row.id, row.name]));
}

/** Ids of the delivery partners in a region (they are told when an order is ready to be taken) */
export async function partnerIdsInRegion(db, regionId) {
  const result = await db.query("SELECT id FROM users WHERE role = 'DELIVERY_PARTNER' AND region_id = $1", [regionId]);
  return result.rows.map((row) => row.id);
}

export async function listNotifications(userId, limit = 30) {
  const [items, unread] = await Promise.all([
    pool.query(
      `SELECT id, type, data, read_at, created_at FROM notifications
       WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [userId, limit],
    ),
    pool.query("SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL", [userId]),
  ]);
  return { items: items.rows, unread_count: unread.rows[0].count };
}

export async function markRead(userId, notificationId) {
  const result = await pool.query(
    "UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2 RETURNING id",
    [notificationId, userId],
  );
  if (result.rowCount === 0) throw notFound("Notification not found");
  return listNotifications(userId);
}

export async function markAllRead(userId) {
  await pool.query("UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL", [userId]);
  return listNotifications(userId);
}
