import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, conflict, forbidden, notFound } from "../../utils/AppError.js";
import { PRICE_BAND } from "../../utils/constants.js";
import { getMarketPrice } from "../produce/marketPrice.service.js";
import { getProduceById } from "../produce/produce.service.js";
import { FARMER_RATINGS_JOIN } from "../reviews/reviews.queries.js";

const LISTING_SELECT = `
  SELECT
    l.id, l.available_qty, l.listing_price, l.market_price, l.price_source,
    ROUND((l.listing_price - l.market_price) / NULLIF(l.market_price, 0) * 100, 1) AS price_diff_pct,
    l.is_active, l.created_at,
    p.id AS produce_id, p.name AS produce_name, p.category AS produce_category, p.unit AS produce_unit,
    p.is_custom AS produce_is_custom,
    u.id AS farmer_id, u.name AS farmer_name, u.base_location AS farmer_location,
    u.region_id AS farmer_region_id,
    fr.farmer_rating, COALESCE(fr.farmer_review_count, 0) AS farmer_review_count
  FROM listings l
  JOIN produce p ON p.id = l.produce_id
  JOIN users u ON u.id = l.farmer_id
  ${FARMER_RATINGS_JOIN} = l.farmer_id`;

const round2 = (n) => Math.round(n * 100) / 100;

/** Throws unless price is within ±PRICE_BAND of the market price. */
export function assertPriceInBand(price, marketPrice) {
  const min = round2(marketPrice * (1 - PRICE_BAND));
  const max = round2(marketPrice * (1 + PRICE_BAND));
  if (price < min || price > max) {
    throw badRequest(
      `Price must be between ₹${min.toFixed(2)} and ₹${max.toFixed(2)} ` +
        `(within ${PRICE_BAND * 100}% of today's market price ₹${marketPrice})`,
    );
  }
}

export async function browseListings({ region_id, produce_id, category, search }) {
  const conditions = ["l.is_active = TRUE", "l.deleted_at IS NULL"];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  };

  if (region_id) add("u.region_id = ?", region_id);
  if (produce_id) add("p.id = ?", produce_id);
  if (category) add("p.category = ?", category);
  if (search) add("p.name ILIKE ?", `%${search}%`);

  const result = await pool.query(
    `${LISTING_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY l.created_at DESC`,
    params,
  );
  return result.rows;
}

export async function getListingById(listingId) {
  const result = await pool.query(`${LISTING_SELECT} WHERE l.id = $1 AND l.deleted_at IS NULL`, [listingId]);
  if (result.rowCount === 0) throw notFound("Listing not found");
  return result.rows[0];
}

export async function getFarmerListings(farmerId) {
  const result = await pool.query(
    `${LISTING_SELECT} WHERE l.farmer_id = $1 AND l.deleted_at IS NULL ORDER BY l.is_active DESC, l.created_at DESC`,
    [farmerId],
  );
  return result.rows;
}

export async function createListing(farmerId, { produce_id, available_qty, listing_price }) {
  const produce = await getProduceById(produce_id);

  // Produce a farmer added has no market price, so there is nothing to keep the price near: they set it
  let marketPrice = null;
  let price = listing_price;
  let source = "FARMER";
  if (produce.is_custom) {
    if (listing_price === undefined) throw badRequest("Enter your price for this produce");
  } else {
    marketPrice = (await getMarketPrice(produce)).price;
    price = marketPrice;
    source = "SCRAPED";
    if (listing_price !== undefined) {
      assertPriceInBand(listing_price, marketPrice);
      price = listing_price;
      source = "FARMER";
    }
  }

  const result = await pool.query(
    `INSERT INTO listings (farmer_id, produce_id, available_qty, listing_price, market_price, price_source)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [farmerId, produce.id, available_qty, price, marketPrice, source],
  );
  return getListingById(result.rows[0].id);
}

async function getOwnListing(listingId, farmerId) {
  const result = await pool.query(
    "SELECT farmer_id, produce_id, available_qty, is_active FROM listings WHERE id = $1 AND deleted_at IS NULL",
    [listingId],
  );
  if (result.rowCount === 0) throw notFound("Listing not found");
  if (result.rows[0].farmer_id !== farmerId) throw forbidden("You can only change your own listings");
  return result.rows[0];
}

export async function updateListing(listingId, farmerId, { available_qty, listing_price, is_active }) {
  const listing = await getOwnListing(listingId, farmerId);

  if (listing_price !== undefined) {
    // Re-check against today's rate, which may have moved since the listing was created
    const produce = await getProduceById(listing.produce_id);
    let marketPrice = null; // produce a farmer added has no market price and no band
    if (!produce.is_custom) {
      marketPrice = (await getMarketPrice(produce)).price;
      assertPriceInBand(listing_price, marketPrice);
    }
    await pool.query(
      `UPDATE listings SET listing_price = $1, market_price = $2, price_source = 'FARMER' WHERE id = $3`,
      [listing_price, marketPrice, listingId],
    );
  }

  if (available_qty !== undefined || is_active !== undefined) {
    const qty = available_qty ?? listing.available_qty;
    let active;
    if (qty <= 0) active = false; // nothing left to sell
    else if (is_active !== undefined) active = is_active; // "Sell again" asks for it explicitly
    // Restocking a sold-out listing reopens it; changing stock on one the farmer stopped doesn't
    else active = listing.available_qty === 0 ? true : listing.is_active;

    await pool.query("UPDATE listings SET available_qty = $1, is_active = $2 WHERE id = $3", [
      qty,
      active,
      listingId,
    ]);
  }

  return getListingById(listingId);
}

export async function deactivateListing(listingId, farmerId) {
  await getOwnListing(listingId, farmerId);
  await pool.query("UPDATE listings SET is_active = FALSE WHERE id = $1", [listingId]);
  return getListingById(listingId);
}

/**
 * Removes a listing for good from the farmer's list and from buyers. The row stays (marked
 * deleted) so past orders keep their history. Not allowed while orders are still open.
 */
export async function deleteListing(listingId, farmerId) {
  await withTransaction(async (client) => {
    // Same lock createOrder takes, so nobody can order this listing while it's being deleted
    const found = await client.query(
      "SELECT farmer_id FROM listings WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
      [listingId],
    );
    if (found.rowCount === 0) throw notFound("Listing not found");
    if (found.rows[0].farmer_id !== farmerId) throw forbidden("You can only delete your own listings");

    const open = await client.query(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE oi.listing_id = $1 AND o.status IN ('PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY') LIMIT 1`,
      [listingId],
    );
    if (open.rowCount > 0) {
      throw conflict("This listing has open orders. Accept, reject or finish them first.");
    }

    await client.query("UPDATE listings SET deleted_at = NOW(), is_active = FALSE WHERE id = $1", [listingId]);
  });
}
