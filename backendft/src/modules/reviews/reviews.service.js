import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, conflict, forbidden, notFound } from "../../utils/AppError.js";
import { BOOKING_STATUS, NOTIFICATION, ORDER_STATUS } from "../../utils/constants.js";
import { namesOf, notify } from "../notifications/notifications.service.js";

// Reviewers are shown by first name only
const firstName = (name) => (name ?? "").split(" ")[0];

// The products of an order, as "Carrot, Cabbage"
const ORDER_PRODUCTS = (orderColumn) => `
  (SELECT STRING_AGG(p.name, ', ' ORDER BY oi.id)
   FROM order_items oi
   JOIN listings l ON l.id = oi.listing_id
   JOIN produce p ON p.id = l.produce_id
   WHERE oi.order_id = ${orderColumn})`;

const REVIEW_SELECT = `
  SELECT
    rv.id, rv.order_id, rv.rating, rv.comment, rv.created_at, rv.farmer_id,
    SPLIT_PART(b.name, ' ', 1) AS buyer_name,
    ${ORDER_PRODUCTS("rv.order_id")} AS produce_name
  FROM reviews rv
  JOIN users b ON b.id = rv.buyer_id`;

const PARTNER_REVIEW_SELECT = `
  SELECT
    pr.id, pr.order_id, pr.rating, pr.comment, pr.created_at, pr.partner_id,
    SPLIT_PART(b.name, ' ', 1) AS buyer_name,
    ${ORDER_PRODUCTS("pr.order_id")} AS produce_name
  FROM partner_reviews pr
  JOIN users b ON b.id = pr.buyer_id`;

const WAREHOUSE_REVIEW_SELECT = `
  SELECT
    wr.id, wr.booking_id, wr.rating, wr.comment, wr.created_at, wr.warehouse_id,
    SPLIT_PART(f.name, ' ', 1) AS farmer_name,
    w.name AS warehouse_name
  FROM warehouse_reviews wr
  JOIN users f ON f.id = wr.farmer_id
  JOIN warehouses w ON w.id = wr.warehouse_id`;

/** Buyer rates the farmer once their order has been delivered. */
export async function createReview(orderId, buyerId, { rating, comment }) {
  return withTransaction(async (client) => {
    const orderRes = await client.query("SELECT buyer_id, status, farmer_id FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rowCount === 0) throw notFound("Order not found");

    const order = orderRes.rows[0];
    if (order.buyer_id !== buyerId) throw forbidden("You can only review your own orders");
    if (order.status !== ORDER_STATUS.DELIVERED) throw badRequest("You can review an order once it is delivered");

    const inserted = await client.query(
      `INSERT INTO reviews (order_id, buyer_id, farmer_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id) DO NOTHING
       RETURNING id`,
      [orderId, buyerId, order.farmer_id, rating, comment ?? null],
    );
    if (inserted.rowCount === 0) throw conflict("You have already reviewed this order");

    const names = await namesOf(client, [buyerId]);
    await notify(client, order.farmer_id, NOTIFICATION.REVIEW_NEW, { orderId, rating, name: firstName(names[buyerId]) });

    const result = await client.query(`${REVIEW_SELECT} WHERE rv.id = $1`, [inserted.rows[0].id]);
    return result.rows[0];
  });
}

export async function getFarmerReviews(farmerId) {
  const result = await pool.query(`${REVIEW_SELECT} WHERE rv.farmer_id = $1 ORDER BY rv.created_at DESC`, [
    farmerId,
  ]);
  return result.rows;
}

/** Buyer rates the delivery partner of a delivered order (once per order). */
export async function createPartnerReview(orderId, buyerId, { rating, comment }) {
  return withTransaction(async (client) => {
    const orderRes = await client.query(
      "SELECT buyer_id, status, delivery_partner_id FROM orders WHERE id = $1",
      [orderId],
    );
    if (orderRes.rowCount === 0) throw notFound("Order not found");

    const order = orderRes.rows[0];
    if (order.buyer_id !== buyerId) throw forbidden("You can only review your own orders");
    if (order.status !== ORDER_STATUS.DELIVERED) throw badRequest("You can rate the delivery once the order is delivered");
    if (!order.delivery_partner_id) throw badRequest("This order had no delivery partner");

    const inserted = await client.query(
      `INSERT INTO partner_reviews (order_id, buyer_id, partner_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id) DO NOTHING
       RETURNING id`,
      [orderId, buyerId, order.delivery_partner_id, rating, comment ?? null],
    );
    if (inserted.rowCount === 0) throw conflict("You have already rated this delivery");

    const names = await namesOf(client, [buyerId]);
    await notify(client, order.delivery_partner_id, NOTIFICATION.PARTNER_REVIEW_NEW, {
      orderId,
      rating,
      name: firstName(names[buyerId]),
    });

    const result = await client.query(`${PARTNER_REVIEW_SELECT} WHERE pr.id = $1`, [inserted.rows[0].id]);
    return result.rows[0];
  });
}

export async function getPartnerReviews(partnerId) {
  const result = await pool.query(`${PARTNER_REVIEW_SELECT} WHERE pr.partner_id = $1 ORDER BY pr.created_at DESC`, [
    partnerId,
  ]);
  return result.rows;
}

/** Farmer rates a warehouse after taking the produce out (once per booking). */
export async function createWarehouseReview(bookingId, farmerId, { rating, comment }) {
  return withTransaction(async (client) => {
    const bookingRes = await client.query(
      `SELECT b.farmer_id, b.status, b.warehouse_id, w.owner_id, w.name AS warehouse_name
       FROM warehouse_bookings b JOIN warehouses w ON w.id = b.warehouse_id
       WHERE b.id = $1`,
      [bookingId],
    );
    if (bookingRes.rowCount === 0) throw notFound("Booking not found");

    const booking = bookingRes.rows[0];
    if (booking.farmer_id !== farmerId) throw forbidden("You can only rate warehouses you used");
    if (booking.status !== BOOKING_STATUS.RELEASED) {
      throw badRequest("You can rate a warehouse once you have taken your produce out");
    }

    const inserted = await client.query(
      `INSERT INTO warehouse_reviews (booking_id, farmer_id, warehouse_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (booking_id) DO NOTHING
       RETURNING id`,
      [bookingId, farmerId, booking.warehouse_id, rating, comment ?? null],
    );
    if (inserted.rowCount === 0) throw conflict("You have already rated this booking");

    const names = await namesOf(client, [farmerId]);
    await notify(client, booking.owner_id, NOTIFICATION.WAREHOUSE_REVIEW_NEW, {
      bookingId,
      rating,
      name: firstName(names[farmerId]),
      warehouse: booking.warehouse_name,
    });

    const result = await client.query(`${WAREHOUSE_REVIEW_SELECT} WHERE wr.id = $1`, [inserted.rows[0].id]);
    return result.rows[0];
  });
}

export async function getWarehouseReviews(warehouseId) {
  const result = await pool.query(
    `${WAREHOUSE_REVIEW_SELECT} WHERE wr.warehouse_id = $1 ORDER BY wr.created_at DESC`,
    [warehouseId],
  );
  return result.rows;
}
