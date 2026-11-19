import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, forbidden, notFound } from "../../utils/AppError.js";
import { DELIVERY_FEE, NOTIFICATION, ORDER_STATUS, ROLES } from "../../utils/constants.js";
import { namesOf, notify, partnerIdsInRegion } from "../notifications/notifications.service.js";

// An order belongs to one farmer and holds one or more products (items)
export const ORDER_SELECT = `
  SELECT
    o.id, o.total_price, o.delivery_fee,
    o.total_price + o.delivery_fee AS grand_total,
    o.status, o.delivery_address, o.created_at, o.updated_at, o.picked_up_at, o.delivered_at,
    o.delay_reason, o.delay_minutes, o.delayed_at,
    (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id)::int AS total_kg,
    (SELECT COALESCE(
        json_agg(json_build_object(
          'listing_id', oi.listing_id, 'produce_id', p.id, 'produce_name', p.name,
          'produce_category', p.category, 'quantity', oi.quantity,
          'unit_price', oi.unit_price, 'line_total', oi.line_total
        ) ORDER BY oi.id), '[]'::json)
     FROM order_items oi
     JOIN listings l ON l.id = oi.listing_id
     JOIN produce p ON p.id = l.produce_id
     WHERE oi.order_id = o.id) AS items,
    f.id AS farmer_id, f.name AS farmer_name, f.phone AS farmer_phone,
    f.base_location AS farmer_location, f.region_id AS region_id,
    b.id AS buyer_id, b.name AS buyer_name, b.phone AS buyer_phone, b.base_location AS buyer_location,
    d.id AS delivery_partner_id, d.name AS delivery_partner_name, d.phone AS delivery_partner_phone,
    (r.id IS NOT NULL) AS is_reviewed, r.rating AS review_rating, r.comment AS review_comment,
    (pr.id IS NOT NULL) AS is_partner_reviewed, pr.rating AS partner_review_rating
  FROM orders o
  JOIN users f ON f.id = o.farmer_id
  JOIN users b ON b.id = o.buyer_id
  LEFT JOIN users d ON d.id = o.delivery_partner_id
  LEFT JOIN reviews r ON r.order_id = o.id
  LEFT JOIN partner_reviews pr ON pr.order_id = o.id`;

/** Delivery fee for one order: a base amount plus a rate per kg of everything in it */
export function deliveryFee(totalKg) {
  return Math.round((DELIVERY_FEE.BASE + DELIVERY_FEE.PER_KG * totalKg) * 100) / 100;
}

export async function getOrderById(orderId, db = pool) {
  const result = await db.query(`${ORDER_SELECT} WHERE o.id = $1`, [orderId]);
  if (result.rowCount === 0) throw notFound("Order not found");
  return result.rows[0];
}

async function listOrders(column, userId, status) {
  const params = [userId];
  let sql = `${ORDER_SELECT} WHERE ${column} = $1`;
  if (status) {
    params.push(status);
    sql += " AND o.status = $2";
  }
  const result = await pool.query(`${sql} ORDER BY o.created_at DESC`, params);
  return result.rows;
}

export const getBuyerOrders = (buyerId, { status }) => listOrders("o.buyer_id", buyerId, status);
export const getFarmerOrders = (farmerId, { status }) => listOrders("o.farmer_id", farmerId, status);

/** Adds up quantities when the same listing appears twice */
function mergeItems(items) {
  const byListing = new Map();
  for (const { listing_id, quantity } of items) {
    byListing.set(listing_id, (byListing.get(listing_id) ?? 0) + quantity);
  }
  return [...byListing].map(([listing_id, quantity]) => ({ listing_id, quantity }));
}

/**
 * Places the buyer's items inside an open transaction: one order per farmer, each holding all
 * of that farmer's items. Everything succeeds or nothing does. Returns the new orders.
 */
export async function placeOrders(client, buyer, items, delivery_address) {
  const wanted = mergeItems(items);

  // Lock every listing (in id order, so two checkouts can't deadlock) so nobody oversells stock
  const found = await client.query(
    `SELECT l.id, l.available_qty, l.listing_price, l.is_active, l.deleted_at, l.farmer_id,
            u.region_id, p.name AS produce_name
     FROM listings l
     JOIN users u ON u.id = l.farmer_id
     JOIN produce p ON p.id = l.produce_id
     WHERE l.id = ANY($1)
     ORDER BY l.id
     FOR UPDATE OF l`,
    [wanted.map((item) => item.listing_id)],
  );
  const listings = new Map(found.rows.map((row) => [row.id, row]));

  const lines = wanted.map(({ listing_id, quantity }) => {
    const listing = listings.get(listing_id);
    if (!listing || listing.deleted_at) throw notFound("Listing not found");
    if (!listing.is_active) throw badRequest(`${listing.produce_name} is no longer available`);
    if (listing.region_id !== buyer.regionId) {
      throw badRequest("You can only order from farmers in your region");
    }
    if (quantity > listing.available_qty) {
      throw badRequest(`Not enough ${listing.produce_name}. Available: ${listing.available_qty}`);
    }
    return { listing, quantity, unitPrice: Number(listing.listing_price) };
  });

  let address = delivery_address;
  if (!address) {
    const buyerRes = await client.query("SELECT base_location FROM users WHERE id = $1", [buyer.id]);
    address = buyerRes.rows[0]?.base_location;
    if (!address) throw badRequest("delivery_address is required (no base location on your profile)");
  }

  const buyerName = (await namesOf(client, [buyer.id]))[buyer.id];

  const byFarmer = new Map();
  for (const line of lines) {
    const farmerId = line.listing.farmer_id;
    byFarmer.set(farmerId, [...(byFarmer.get(farmerId) ?? []), line]);
  }

  const orderIds = [];
  for (const [farmerId, farmerLines] of byFarmer) {
    const totalKg = farmerLines.reduce((sum, line) => sum + line.quantity, 0);
    const productCost = farmerLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

    const orderRes = await client.query(
      `INSERT INTO orders (buyer_id, farmer_id, total_price, delivery_fee, delivery_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [buyer.id, farmerId, Math.round(productCost * 100) / 100, deliveryFee(totalKg), address],
    );
    const orderId = orderRes.rows[0].id;
    orderIds.push(orderId);
    await notify(client, farmerId, NOTIFICATION.ORDER_NEW, { orderId, name: buyerName });

    for (const { listing, quantity, unitPrice } of farmerLines) {
      await client.query(
        `INSERT INTO order_items (order_id, listing_id, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, listing.id, quantity, unitPrice, Math.round(quantity * unitPrice * 100) / 100],
      );
      const remaining = listing.available_qty - quantity;
      await client.query("UPDATE listings SET available_qty = $1, is_active = $2 WHERE id = $3", [
        remaining,
        remaining > 0,
        listing.id,
      ]);
    }
  }

  const result = await client.query(`${ORDER_SELECT} WHERE o.id = ANY($1) ORDER BY o.id`, [orderIds]);
  return result.rows;
}

/** Orders the given items directly (the cart's checkout does the same through placeOrders). */
export function createOrders(buyer, { items, delivery_address }) {
  return withTransaction((client) => placeOrders(client, buyer, items, delivery_address));
}

/** Locks an order row and returns it with its farmer's region. */
export async function lockOrder(client, orderId) {
  const result = await client.query(
    `SELECT o.id, o.status, o.buyer_id, o.farmer_id, o.delivery_partner_id, f.region_id
     FROM orders o
     JOIN users f ON f.id = o.farmer_id
     WHERE o.id = $1
     FOR UPDATE OF o`,
    [orderId],
  );
  if (result.rowCount === 0) throw notFound("Order not found");
  return result.rows[0];
}

export async function setStatus(client, orderId, status) {
  await client.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [
    status,
    orderId,
  ]);
}

/** Buyer cancels their order, or the farmer rejects it. Only PENDING orders; stock goes back. */
export async function cancelOrder(orderId, user) {
  return withTransaction(async (client) => {
    const order = await lockOrder(client, orderId);

    const isBuyer = user.role === ROLES.BUYER && order.buyer_id === user.id;
    const isFarmer = user.role === ROLES.FARMER && order.farmer_id === user.id;
    if (!isBuyer && !isFarmer) throw forbidden("You can only cancel your own orders");
    if (order.status !== ORDER_STATUS.PENDING) {
      throw badRequest(`Only pending orders can be cancelled (this one is ${order.status})`);
    }

    await setStatus(client, orderId, ORDER_STATUS.CANCELLED);
    // Tell the other side: the farmer when the buyer cancels, the buyer when the farmer rejects
    const names = await namesOf(client, [order.buyer_id, order.farmer_id]);
    await notify(client, isBuyer ? order.farmer_id : order.buyer_id, NOTIFICATION.ORDER_CANCELLED, {
      orderId,
      name: isBuyer ? names[order.buyer_id] : names[order.farmer_id],
      by: isBuyer ? "buyer" : "farmer",
    });
    // Every item's stock goes back; lock in id order like checkout does
    const items = await client.query(
      "SELECT listing_id, quantity FROM order_items WHERE order_id = $1 ORDER BY listing_id",
      [orderId],
    );
    await client.query("SELECT 1 FROM listings WHERE id = ANY($1) ORDER BY id FOR UPDATE", [
      items.rows.map((item) => item.listing_id),
    ]);
    for (const { listing_id, quantity } of items.rows) {
      await client.query(
        `UPDATE listings SET available_qty = available_qty + $1, is_active = (deleted_at IS NULL) WHERE id = $2`,
        [quantity, listing_id],
      );
    }

    return getOrderById(orderId, client);
  });
}

/** Farmer accepts a pending order; it then waits for a delivery partner. */
export async function confirmOrder(orderId, farmerId) {
  return withTransaction(async (client) => {
    const order = await lockOrder(client, orderId);
    if (order.farmer_id !== farmerId) throw forbidden("This order is not for one of your listings");
    if (order.status !== ORDER_STATUS.PENDING) {
      throw badRequest(`Only PENDING orders can be confirmed (this one is ${order.status})`);
    }

    await setStatus(client, orderId, ORDER_STATUS.CONFIRMED);

    // The buyer hears it was accepted; partners in the region hear there is a delivery to take
    const farmerName = (await namesOf(client, [order.farmer_id]))[order.farmer_id];
    await notify(client, order.buyer_id, NOTIFICATION.ORDER_ACCEPTED, { orderId, name: farmerName });
    await notify(client, await partnerIdsInRegion(client, order.region_id), NOTIFICATION.DELIVERY_WAITING, {
      orderId,
      name: farmerName,
    });
    return getOrderById(orderId, client);
  });
}
