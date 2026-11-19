import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, notFound } from "../../utils/AppError.js";
import { deliveryFee, placeOrders } from "../orders/orders.service.js";

const round2 = (n) => Math.round(n * 100) / 100;

/** Why a cart item cannot be ordered right now, or null */
function problemFor(row, regionId) {
  if (row.deleted_at || !row.is_active) return "UNAVAILABLE";
  if (row.farmer_region_id !== regionId) return "OTHER_REGION";
  if (row.quantity > row.available_qty) return "NOT_ENOUGH_STOCK";
  return null;
}

/** The buyer's cart: items grouped by farmer (one order per farmer at checkout), with live prices. */
export async function getCart(buyerId, regionId) {
  const result = await pool.query(
    `SELECT c.id, c.listing_id, c.quantity,
            l.listing_price AS unit_price, l.available_qty, l.is_active, l.deleted_at,
            p.id AS produce_id, p.name AS produce_name, p.category AS produce_category,
            f.id AS farmer_id, f.name AS farmer_name, f.base_location AS farmer_location,
            f.region_id AS farmer_region_id
     FROM cart_items c
     JOIN listings l ON l.id = c.listing_id
     JOIN produce p ON p.id = l.produce_id
     JOIN users f ON f.id = l.farmer_id
     WHERE c.buyer_id = $1
     ORDER BY f.name, c.id`,
    [buyerId],
  );

  const groups = new Map();
  for (const row of result.rows) {
    const item = {
      id: row.id,
      listing_id: row.listing_id,
      produce_id: row.produce_id,
      produce_name: row.produce_name,
      produce_category: row.produce_category,
      quantity: row.quantity,
      unit_price: row.unit_price,
      line_total: round2(row.quantity * row.unit_price),
      available_qty: row.available_qty,
      problem: problemFor(row, regionId),
    };
    if (!groups.has(row.farmer_id)) {
      groups.set(row.farmer_id, {
        farmer_id: row.farmer_id,
        farmer_name: row.farmer_name,
        farmer_location: row.farmer_location,
        items: [],
      });
    }
    groups.get(row.farmer_id).items.push(item);
  }

  const farmers = [...groups.values()].map((group) => {
    const total_kg = group.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = round2(group.items.reduce((sum, item) => sum + item.line_total, 0));
    const fee = deliveryFee(total_kg);
    return { ...group, total_kg, subtotal, delivery_fee: fee, total: round2(subtotal + fee) };
  });

  return {
    farmers,
    item_count: result.rowCount,
    subtotal: round2(farmers.reduce((sum, g) => sum + g.subtotal, 0)),
    delivery_fee: round2(farmers.reduce((sum, g) => sum + g.delivery_fee, 0)),
    grand_total: round2(farmers.reduce((sum, g) => sum + g.total, 0)),
    has_problems: farmers.some((g) => g.items.some((item) => item.problem)),
  };
}

/** Checks the listing can be bought by this buyer in the wanted quantity. */
async function assertCanHold(client, buyer, listingId, quantity) {
  const res = await client.query(
    `SELECT l.available_qty, l.is_active, l.deleted_at, u.region_id, p.name AS produce_name
     FROM listings l
     JOIN users u ON u.id = l.farmer_id
     JOIN produce p ON p.id = l.produce_id
     WHERE l.id = $1`,
    [listingId],
  );
  const listing = res.rows[0];
  if (!listing || listing.deleted_at) throw notFound("Listing not found");
  if (!listing.is_active) throw badRequest(`${listing.produce_name} is no longer available`);
  if (listing.region_id !== buyer.regionId) throw badRequest("You can only order from farmers in your region");
  if (quantity > listing.available_qty) {
    throw badRequest(`Not enough ${listing.produce_name}. Available: ${listing.available_qty}`);
  }
}

/** Adds to the cart; adding the same listing again increases its quantity. */
export async function addToCart(buyer, { listing_id, quantity }) {
  await withTransaction(async (client) => {
    const existing = await client.query(
      "SELECT quantity FROM cart_items WHERE buyer_id = $1 AND listing_id = $2",
      [buyer.id, listing_id],
    );
    const total = quantity + (existing.rows[0]?.quantity ?? 0);
    await assertCanHold(client, buyer, listing_id, total);

    await client.query(
      `INSERT INTO cart_items (buyer_id, listing_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (buyer_id, listing_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
      [buyer.id, listing_id, total],
    );
  });
  return getCart(buyer.id, buyer.regionId);
}

export async function updateCartItem(buyer, itemId, quantity) {
  await withTransaction(async (client) => {
    const item = await client.query("SELECT listing_id FROM cart_items WHERE id = $1 AND buyer_id = $2", [
      itemId,
      buyer.id,
    ]);
    if (item.rowCount === 0) throw notFound("Cart item not found");

    await assertCanHold(client, buyer, item.rows[0].listing_id, quantity);
    await client.query("UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2", [quantity, itemId]);
  });
  return getCart(buyer.id, buyer.regionId);
}

export async function removeCartItem(buyer, itemId) {
  const result = await pool.query("DELETE FROM cart_items WHERE id = $1 AND buyer_id = $2", [itemId, buyer.id]);
  if (result.rowCount === 0) throw notFound("Cart item not found");
  return getCart(buyer.id, buyer.regionId);
}

export async function clearCart(buyer) {
  await pool.query("DELETE FROM cart_items WHERE buyer_id = $1", [buyer.id]);
  return getCart(buyer.id, buyer.regionId);
}

/** Orders everything in the cart (one order per farmer) and empties it. All or nothing. */
export async function checkout(buyer, { delivery_address }) {
  return withTransaction(async (client) => {
    const cart = await client.query(
      "SELECT listing_id, quantity FROM cart_items WHERE buyer_id = $1 ORDER BY id FOR UPDATE",
      [buyer.id],
    );
    if (cart.rowCount === 0) throw badRequest("Your cart is empty");

    const orders = await placeOrders(client, buyer, cart.rows, delivery_address);
    await client.query("DELETE FROM cart_items WHERE buyer_id = $1", [buyer.id]);
    return orders;
  });
}
