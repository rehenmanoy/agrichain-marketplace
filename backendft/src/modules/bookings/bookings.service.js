import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, conflict, forbidden, notFound } from "../../utils/AppError.js";
import { BOOKING_STATUS, EXTENSION_STATUS, MAX_BOOKING_DAYS, NOTIFICATION } from "../../utils/constants.js";
import { namesOf, notify } from "../notifications/notifications.service.js";
import { peakUsage } from "../warehouses/capacity.js";
import { daysBetween } from "./bookings.schemas.js";

// A booking is "overdue" when it was approved, its end date has passed, and the farmer has neither
// released it nor had an extension approved. It keeps holding the space and the daily charge goes on.
const OVERDUE = "(b.status = 'ACTIVE' AND b.end_date < CURRENT_DATE)";

const BOOKING_SELECT = `
  SELECT
    b.id, b.quantity_kg, b.start_date, b.end_date, b.status, b.created_at,
    b.rate_per_kg_per_day, b.decided_at, b.decision_note,
    (wrv.id IS NOT NULL) AS is_reviewed, wrv.rating AS review_rating,
    ${OVERDUE} AS is_overdue,
    CASE WHEN ${OVERDUE} THEN CURRENT_DATE - b.end_date ELSE 0 END AS overdue_days,
    CASE WHEN ${OVERDUE}
         THEN b.rate_per_kg_per_day * b.quantity_kg * ((CURRENT_DATE - b.start_date) + 1)
         ELSE b.amount_to_pay END AS amount_to_pay,
    w.id AS warehouse_id, w.name AS warehouse_name, w.location AS warehouse_location,
    w.is_cold_storage, w.price_per_kg_per_day,
    (SELECT '/uploads/warehouses/' || ph.filename FROM warehouse_photos ph
     WHERE ph.warehouse_id = w.id ORDER BY ph.position, ph.id LIMIT 1) AS warehouse_photo,
    ow.id AS owner_id, ow.name AS owner_name, ow.phone AS owner_phone,
    p.id AS produce_id, p.name AS produce_name,
    f.id AS farmer_id, f.name AS farmer_name, f.phone AS farmer_phone,
    (SELECT json_build_object('id', e.id, 'new_end_date', e.new_end_date, 'status', e.status,
                              'requested_at', e.requested_at, 'decided_at', e.decided_at)
     FROM booking_extensions e WHERE e.booking_id = b.id ORDER BY e.id DESC LIMIT 1) AS extension
  FROM warehouse_bookings b
  JOIN warehouses w ON w.id = b.warehouse_id
  JOIN users ow ON ow.id = w.owner_id
  JOIN users f ON f.id = b.farmer_id
  LEFT JOIN produce p ON p.id = b.produce_id
  LEFT JOIN warehouse_reviews wrv ON wrv.booking_id = b.id`;

/** Number of billable days, counting both the first and the last day (1 Nov to 15 Nov is 15 days). */
export function billableDays(startDate, endDate) {
  return Math.max(1, daysBetween(startDate, endDate));
}

export async function getBookingById(bookingId, db = pool) {
  const result = await db.query(`${BOOKING_SELECT} WHERE b.id = $1`, [bookingId]);
  if (result.rowCount === 0) throw notFound("Booking not found");
  return result.rows[0];
}

async function listBookings(column, userId, status) {
  const params = [userId];
  let sql = `${BOOKING_SELECT} WHERE ${column} = $1`;
  if (status) {
    params.push(status);
    sql += " AND b.status = $2";
  }
  const result = await pool.query(`${sql} ORDER BY b.created_at DESC`, params);
  return result.rows;
}

export const getFarmerBookings = (farmerId, { status }) => listBookings("b.farmer_id", farmerId, status);
export const getOwnerBookings = (ownerId, { status }) => listBookings("w.owner_id", ownerId, status);

/** Farmer asks for space for a date range. It holds the space until the owner answers. */
export async function createBooking(farmer, { warehouse_id, produce_id, quantity_kg, start_date, end_date }) {
  return withTransaction(async (client) => {
    // Lock the warehouse so concurrent requests can't over-fill it
    const whRes = await client.query(
      `SELECT id, owner_id, name, region_id, total_capacity_kg, is_active, price_per_kg_per_day
       FROM warehouses WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [warehouse_id],
    );
    if (whRes.rowCount === 0) throw notFound("Warehouse not found");

    const warehouse = whRes.rows[0];
    if (!warehouse.is_active) throw badRequest("This warehouse is not accepting bookings");
    if (warehouse.region_id !== farmer.regionId) {
      throw badRequest("You can only book warehouses in your region");
    }

    const free = warehouse.total_capacity_kg - (await peakUsage(client, warehouse_id, start_date, end_date));
    if (quantity_kg > free) {
      throw badRequest(`Not enough capacity for those dates. Available: ${Math.max(0, free)} kg`);
    }

    const rate = warehouse.price_per_kg_per_day;
    const amountToPay = billableDays(start_date, end_date) * quantity_kg * rate;

    const bookingRes = await client.query(
      `INSERT INTO warehouse_bookings
         (warehouse_id, farmer_id, produce_id, quantity_kg, start_date, end_date, amount_to_pay,
          rate_per_kg_per_day, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [warehouse_id, farmer.id, produce_id ?? null, quantity_kg, start_date, end_date, amountToPay, rate, BOOKING_STATUS.REQUESTED],
    );
    const farmerName = (await namesOf(client, [farmer.id]))[farmer.id];
    await notify(client, warehouse.owner_id, NOTIFICATION.BOOKING_REQUESTED, {
      bookingId: bookingRes.rows[0].id,
      name: farmerName,
      warehouse: warehouse.name,
    });
    return getBookingById(bookingRes.rows[0].id, client);
  });
}

/** Locks a booking row and returns it with its warehouse's owner and a few date checks. */
async function lockBooking(client, bookingId) {
  const result = await client.query(
    `SELECT b.id, b.status, b.farmer_id, b.warehouse_id, b.quantity_kg, b.start_date, b.end_date,
            b.rate_per_kg_per_day, w.owner_id, w.total_capacity_kg, w.name AS warehouse_name,
            (b.start_date > CURRENT_DATE) AS not_started,
            CURRENT_DATE::text AS today
     FROM warehouse_bookings b
     JOIN warehouses w ON w.id = b.warehouse_id
     WHERE b.id = $1
     FOR UPDATE OF b`,
    [bookingId],
  );
  if (result.rowCount === 0) throw notFound("Booking not found");
  return result.rows[0];
}

const assertOwner = (booking, ownerId) => {
  if (booking.owner_id !== ownerId) throw forbidden("This booking is not at one of your warehouses");
};
const assertFarmer = (booking, farmerId) => {
  if (booking.farmer_id !== farmerId) throw forbidden("This is not your booking");
};

/** Owner accepts a request: the space is now theirs for the dates. */
export async function approveBooking(bookingId, ownerId) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertOwner(booking, ownerId);
    if (booking.status !== BOOKING_STATUS.REQUESTED) throw badRequest("Only waiting requests can be accepted");

    await client.query("UPDATE warehouse_bookings SET status = $1, decided_at = NOW() WHERE id = $2", [
      BOOKING_STATUS.ACTIVE,
      bookingId,
    ]);
    await notify(client, booking.farmer_id, NOTIFICATION.BOOKING_APPROVED, { bookingId, warehouse: booking.warehouse_name });
    return getBookingById(bookingId, client);
  });
}

/** Owner declines a request (with an optional reason); the space is free again. */
export async function rejectBooking(bookingId, ownerId, { note }) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertOwner(booking, ownerId);
    if (booking.status !== BOOKING_STATUS.REQUESTED) throw badRequest("Only waiting requests can be declined");

    await client.query(
      "UPDATE warehouse_bookings SET status = $1, decided_at = NOW(), decision_note = $2 WHERE id = $3",
      [BOOKING_STATUS.REJECTED, note ?? null, bookingId],
    );
    await notify(client, booking.farmer_id, NOTIFICATION.BOOKING_REJECTED, {
      bookingId,
      warehouse: booking.warehouse_name,
      note: note ?? null,
    });
    return getBookingById(bookingId, client);
  });
}

/** An extension waiting for an answer is closed when the booking itself ends or is withdrawn. */
async function closePendingExtension(client, bookingId, status) {
  await client.query(
    "UPDATE booking_extensions SET status = $1, decided_at = NOW() WHERE booking_id = $2 AND status = 'PENDING'",
    [status, bookingId],
  );
}

/** Farmer withdraws a request, or an approved booking that has not started (no charge). */
export async function cancelBooking(bookingId, farmerId) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertFarmer(booking, farmerId);

    const waiting = booking.status === BOOKING_STATUS.REQUESTED;
    const notStarted = booking.status === BOOKING_STATUS.ACTIVE && booking.not_started;
    if (!waiting && !notStarted) {
      throw badRequest("Only waiting requests, or approved bookings that have not started, can be cancelled");
    }

    await client.query("UPDATE warehouse_bookings SET status = $1, amount_to_pay = 0 WHERE id = $2", [
      BOOKING_STATUS.CANCELLED,
      bookingId,
    ]);
    await closePendingExtension(client, bookingId, EXTENSION_STATUS.CANCELLED);
    const farmerName = (await namesOf(client, [farmerId]))[farmerId];
    await notify(client, booking.owner_id, NOTIFICATION.BOOKING_CANCELLED, {
      bookingId,
      name: farmerName,
      warehouse: booking.warehouse_name,
    });
    return getBookingById(bookingId, client);
  });
}

/** Farmer takes the produce out: pays for the days used, counting overdue days, and the space frees up. */
export async function releaseBooking(bookingId, farmerId) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertFarmer(booking, farmerId);
    if (booking.status !== BOOKING_STATUS.ACTIVE) throw badRequest("Only approved bookings can be released");
    if (booking.not_started) throw badRequest("This booking has not started yet. Cancel it instead.");

    await client.query(
      `UPDATE warehouse_bookings
       SET status = $1,
           end_date = CURRENT_DATE,
           amount_to_pay = rate_per_kg_per_day * quantity_kg * ((CURRENT_DATE - start_date) + 1)
       WHERE id = $2`,
      [BOOKING_STATUS.RELEASED, bookingId],
    );
    await closePendingExtension(client, bookingId, EXTENSION_STATUS.CANCELLED);
    const farmerName = (await namesOf(client, [farmerId]))[farmerId];
    await notify(client, booking.owner_id, NOTIFICATION.BOOKING_RELEASED, {
      bookingId,
      name: farmerName,
      warehouse: booking.warehouse_name,
    });
    return getBookingById(bookingId, client);
  });
}

/** Farmer asks to keep the produce longer. The extra days are held while the owner decides. */
export async function extendBooking(bookingId, farmerId, { new_end_date }) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertFarmer(booking, farmerId);
    if (booking.status !== BOOKING_STATUS.ACTIVE) throw badRequest("Only approved bookings can be extended");

    const pending = await client.query("SELECT 1 FROM booking_extensions WHERE booking_id = $1 AND status = 'PENDING'", [
      bookingId,
    ]);
    if (pending.rowCount > 0) throw conflict("You have already asked to extend this booking");

    if (new_end_date <= booking.end_date) {
      throw badRequest(`The new end date must be after the current end date (${booking.end_date})`);
    }
    if (new_end_date < booking.today) throw badRequest("The new end date can't be in the past");
    if (daysBetween(booking.start_date, new_end_date) > MAX_BOOKING_DAYS) {
      throw badRequest(`A booking can be at most ${MAX_BOOKING_DAYS} days`);
    }

    // Lock the warehouse, then check the extra days. This booking's own space is left out of the count.
    await client.query("SELECT 1 FROM warehouses WHERE id = $1 FOR UPDATE", [booking.warehouse_id]);
    const firstExtraDay = await client.query("SELECT GREATEST(($1::date + 1), $2::date)::text AS day", [
      booking.end_date,
      booking.today,
    ]);
    const peak = await peakUsage(client, booking.warehouse_id, firstExtraDay.rows[0].day, new_end_date, bookingId);
    const free = booking.total_capacity_kg - peak;
    if (booking.quantity_kg > free) {
      throw badRequest(`Not enough capacity for those extra days. Available: ${Math.max(0, free)} kg`);
    }

    await client.query("INSERT INTO booking_extensions (booking_id, new_end_date) VALUES ($1, $2)", [
      bookingId,
      new_end_date,
    ]);
    const farmerName = (await namesOf(client, [farmerId]))[farmerId];
    await notify(client, booking.owner_id, NOTIFICATION.EXTENSION_REQUESTED, {
      bookingId,
      name: farmerName,
      warehouse: booking.warehouse_name,
      date: new_end_date,
    });
    return getBookingById(bookingId, client);
  });
}

/** Farmer withdraws an extension request that has not been answered. */
export async function cancelExtension(bookingId, farmerId) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertFarmer(booking, farmerId);
    const result = await client.query(
      "UPDATE booking_extensions SET status = $1, decided_at = NOW() WHERE booking_id = $2 AND status = 'PENDING'",
      [EXTENSION_STATUS.CANCELLED, bookingId],
    );
    if (result.rowCount === 0) throw notFound("No extension is waiting for an answer");
    return getBookingById(bookingId, client);
  });
}

/** Owner accepts an extension: the end date moves and the amount is worked out again. */
export async function approveExtension(bookingId, ownerId) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertOwner(booking, ownerId);

    const pending = await client.query(
      "SELECT id, new_end_date FROM booking_extensions WHERE booking_id = $1 AND status = 'PENDING' FOR UPDATE",
      [bookingId],
    );
    if (pending.rowCount === 0) throw notFound("No extension is waiting for an answer");

    const extension = pending.rows[0];
    await client.query(
      `UPDATE warehouse_bookings
       SET end_date = $1, amount_to_pay = rate_per_kg_per_day * quantity_kg * (($1::date - start_date) + 1)
       WHERE id = $2`,
      [extension.new_end_date, bookingId],
    );
    await client.query("UPDATE booking_extensions SET status = $1, decided_at = NOW() WHERE id = $2", [
      EXTENSION_STATUS.APPROVED,
      extension.id,
    ]);
    await notify(client, booking.farmer_id, NOTIFICATION.EXTENSION_APPROVED, {
      bookingId,
      warehouse: booking.warehouse_name,
      date: extension.new_end_date,
    });
    return getBookingById(bookingId, client);
  });
}

/** Owner declines an extension: the booking stays as it was (and may be overdue). */
export async function rejectExtension(bookingId, ownerId) {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, bookingId);
    assertOwner(booking, ownerId);
    const result = await client.query(
      "UPDATE booking_extensions SET status = $1, decided_at = NOW() WHERE booking_id = $2 AND status = 'PENDING' RETURNING new_end_date",
      [EXTENSION_STATUS.REJECTED, bookingId],
    );
    if (result.rowCount === 0) throw notFound("No extension is waiting for an answer");
    await notify(client, booking.farmer_id, NOTIFICATION.EXTENSION_REJECTED, {
      bookingId,
      warehouse: booking.warehouse_name,
      date: result.rows[0].new_end_date,
    });
    return getBookingById(bookingId, client);
  });
}
