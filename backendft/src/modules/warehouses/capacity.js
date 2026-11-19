import { conflict } from "../../utils/AppError.js";

// Space in a warehouse is worked out from its bookings, day by day, not from a running counter.
// A booking holds space while it is REQUESTED (waiting for the owner) or ACTIVE (approved).
export const SPACE_HOLDING = "('REQUESTED', 'ACTIVE')";

/**
 * SQL for the last day a booking `b` holds its space. An approved booking left past its end date
 * (overdue) keeps its space until the farmer releases it; one with an extension waiting holds the
 * space through the new end date.
 */
export const HOLD_END = `
  CASE
    WHEN b.status = 'ACTIVE' AND b.end_date < CURRENT_DATE THEN 'infinity'::date
    ELSE COALESCE(
      (SELECT MAX(e.new_end_date) FROM booking_extensions e WHERE e.booking_id = b.id AND e.status = 'PENDING'),
      b.end_date
    )
  END`;

/**
 * The most kilograms held on any single day between `from` and `to` (both "YYYY-MM-DD", inclusive).
 * Pass excludeBookingId to leave one booking out (when checking an extension of that booking).
 * Call it inside a transaction that holds the warehouse row lock, so the answer can't go stale.
 */
export async function peakUsage(db, warehouseId, from, to, excludeBookingId = null) {
  const result = await db.query(
    `SELECT COALESCE(MAX(t.total), 0) AS peak
     FROM (
       SELECT SUM(b.quantity_kg) AS total
       FROM generate_series($2::date, $3::date, INTERVAL '1 day') AS d(day)
       JOIN warehouse_bookings b
         ON b.warehouse_id = $1
        AND b.status IN ${SPACE_HOLDING}
        AND ($4::int IS NULL OR b.id <> $4)
        AND b.start_date <= d.day::date
        AND d.day::date <= ${HOLD_END}
       GROUP BY d.day
     ) t`,
    [warehouseId, from, to, excludeBookingId],
  );
  return result.rows[0].peak;
}

/** Today and two years ahead: the window used to check that a warehouse is not shrunk below what is booked */
export async function capacityWindow(db) {
  const result = await db.query("SELECT CURRENT_DATE::text AS today, (CURRENT_DATE + 730)::text AS horizon");
  return result.rows[0];
}

/** A warehouse with bookings waiting or approved can be neither paused nor removed */
export async function assertNoOpenBookings(db, warehouseId) {
  const open = await db.query(
    `SELECT 1 FROM warehouse_bookings WHERE warehouse_id = $1 AND status IN ${SPACE_HOLDING} LIMIT 1`,
    [warehouseId],
  );
  if (open.rowCount > 0) {
    throw conflict("This warehouse has open bookings. Finish or decline them first.");
  }
}
