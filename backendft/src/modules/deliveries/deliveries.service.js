import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, conflict, forbidden } from "../../utils/AppError.js";
import { NOTIFICATION, ORDER_STATUS } from "../../utils/constants.js";
import { namesOf, notify, partnerIdsInRegion } from "../notifications/notifications.service.js";
import { getOrderById, lockOrder, ORDER_SELECT } from "../orders/orders.service.js";

/** Confirmed orders in the partner's region that nobody has picked up yet. */
export async function getAvailableDeliveries(partner) {
  const result = await pool.query(
    `${ORDER_SELECT}
     WHERE o.status = $1 AND o.delivery_partner_id IS NULL AND f.region_id = $2
     ORDER BY o.updated_at ASC`,
    [ORDER_STATUS.CONFIRMED, partner.regionId],
  );
  return result.rows;
}

export async function getPartnerDeliveries(partnerId, { status }) {
  const params = [partnerId];
  let sql = `${ORDER_SELECT} WHERE o.delivery_partner_id = $1`;
  if (status) {
    params.push(status);
    sql += " AND o.status = $2";
  }
  const result = await pool.query(`${sql} ORDER BY o.updated_at DESC`, params);
  return result.rows;
}

/** Partner claims a confirmed order. The row lock makes sure only one partner can win. */
export async function acceptDelivery(orderId, partner) {
  return withTransaction(async (client) => {
    const order = await lockOrder(client, orderId);

    if (order.region_id !== partner.regionId) {
      throw forbidden("This order is outside your delivery region");
    }
    if (order.delivery_partner_id !== null) {
      throw conflict("This order has already been picked up by another partner");
    }
    if (order.status !== ORDER_STATUS.CONFIRMED) {
      throw badRequest(`Only CONFIRMED orders can be picked up (this one is ${order.status})`);
    }

    await client.query(
      `UPDATE orders
       SET delivery_partner_id = $1, status = $2, picked_up_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [partner.id, ORDER_STATUS.OUT_FOR_DELIVERY, orderId],
    );
    const partnerName = (await namesOf(client, [partner.id]))[partner.id];
    await notify(client, [order.buyer_id, order.farmer_id], NOTIFICATION.ORDER_PICKED_UP, { orderId, name: partnerName });
    return getOrderById(orderId, client);
  });
}

export async function completeDelivery(orderId, partnerId) {
  return withTransaction(async (client) => {
    const order = await lockOrder(client, orderId);

    if (order.delivery_partner_id !== partnerId) throw forbidden("This delivery is not assigned to you");
    if (order.status !== ORDER_STATUS.OUT_FOR_DELIVERY) {
      throw badRequest(`Only OUT_FOR_DELIVERY orders can be completed (this one is ${order.status})`);
    }

    await client.query(
      "UPDATE orders SET status = $1, delivered_at = NOW(), updated_at = NOW() WHERE id = $2",
      [ORDER_STATUS.DELIVERED, orderId],
    );
    await notify(client, [order.buyer_id, order.farmer_id], NOTIFICATION.ORDER_DELIVERED, { orderId });
    return getOrderById(orderId, client);
  });
}

/** The assigned partner tells everyone the delivery is running late. A new report replaces the old one. */
export async function reportDelay(orderId, partnerId, { reason, minutes }) {
  return withTransaction(async (client) => {
    const order = await lockOrder(client, orderId);

    if (order.delivery_partner_id !== partnerId) throw forbidden("This delivery is not assigned to you");
    if (order.status !== ORDER_STATUS.OUT_FOR_DELIVERY) {
      throw badRequest(`Only OUT_FOR_DELIVERY orders can be reported late (this one is ${order.status})`);
    }

    await client.query(
      `UPDATE orders
       SET delay_reason = $1, delay_minutes = $2, delayed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [reason, minutes, orderId],
    );
    await notify(client, [order.buyer_id, order.farmer_id], NOTIFICATION.ORDER_DELAYED, { orderId, minutes, reason });
    return getOrderById(orderId, client);
  });
}

/** The assigned partner gives the delivery back: it returns to the available list for every partner. */
export async function releaseDelivery(orderId, partnerId) {
  return withTransaction(async (client) => {
    const order = await lockOrder(client, orderId);

    if (order.delivery_partner_id !== partnerId) throw forbidden("This delivery is not assigned to you");
    if (order.status !== ORDER_STATUS.OUT_FOR_DELIVERY) {
      throw badRequest(`Only OUT_FOR_DELIVERY orders can be given back (this one is ${order.status})`);
    }

    // updated_at = NOW() puts it at the back of the available queue
    await client.query(
      `UPDATE orders
       SET status = $1, delivery_partner_id = NULL, picked_up_at = NULL,
           delay_reason = NULL, delay_minutes = NULL, delayed_at = NULL, updated_at = NOW()
       WHERE id = $2`,
      [ORDER_STATUS.CONFIRMED, orderId],
    );
    // It is waiting again: every partner in the region is told
    const farmerName = (await namesOf(client, [order.farmer_id]))[order.farmer_id];
    await notify(client, await partnerIdsInRegion(client, order.region_id), NOTIFICATION.DELIVERY_WAITING, {
      orderId,
      name: farmerName,
    });
    return getOrderById(orderId, client);
  });
}
