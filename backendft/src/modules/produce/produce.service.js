import pool from "../../db/pool.js";
import { conflict, notFound } from "../../utils/AppError.js";
import { MAX_CUSTOM_PRODUCE_PER_FARMER } from "../../utils/constants.js";
import { getMarketPrice } from "./marketPrice.service.js";

export async function listProduce({ category }) {
  const result = category
    ? await pool.query("SELECT * FROM produce WHERE category = $1 ORDER BY name", [category])
    : await pool.query("SELECT * FROM produce ORDER BY name");
  return result.rows;
}

export async function getProduceById(produceId) {
  const result = await pool.query("SELECT * FROM produce WHERE id = $1", [produceId]);
  if (result.rowCount === 0) throw notFound("Produce not found");
  return result.rows[0];
}

/**
 * A farmer adds a produce type that is not in the market list. It has no market price, so the fair-price
 * band does not apply to it; the farmer sets the price. Each farmer can add a limited number.
 */
export async function createProduce(farmerId, { name, category, unit }) {
  const existing = await pool.query("SELECT 1 FROM produce WHERE LOWER(name) = LOWER($1)", [name]);
  if (existing.rowCount > 0) throw conflict(`${name} already exists`);

  const added = await pool.query("SELECT COUNT(*) AS count FROM produce WHERE created_by = $1", [farmerId]);
  if (added.rows[0].count >= MAX_CUSTOM_PRODUCE_PER_FARMER) {
    throw conflict(`You can add up to ${MAX_CUSTOM_PRODUCE_PER_FARMER} produce types of your own`);
  }

  const result = await pool.query(
    "INSERT INTO produce (name, category, unit, is_custom, created_by) VALUES ($1, $2, $3, TRUE, $4) RETURNING *",
    [name, category, unit, farmerId],
  );
  return result.rows[0];
}

/**
 * Today's market price for every produce item, plus yesterday's for comparison.
 * An item whose price is unavailable gets price: null instead of failing the whole list.
 */
export async function listMarketPrices() {
  // Produce farmers added themselves has no market price, so it is not on the board
  const produce = (await listProduce({})).filter((item) => !item.is_custom);
  const yesterday = await pool.query(
    "SELECT produce_id, market_price FROM price_history WHERE date = CURRENT_DATE - 1",
  );
  const yesterdayByProduce = new Map(yesterday.rows.map((r) => [r.produce_id, r.market_price]));

  // One at a time so the scraper's page cache is reused instead of fetching in parallel
  const prices = [];
  for (const item of produce) {
    let today = null;
    try {
      today = await getMarketPrice(item);
    } catch {
      // no price known for this item yet
    }
    prices.push({
      produce_id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      price: today?.price ?? null,
      date: today?.date ?? null,
      source: today?.source ?? null,
      yesterday_price: yesterdayByProduce.get(item.id) ?? null,
    });
  }
  return prices;
}

export async function getProducePrice(produceId) {
  const produce = await getProduceById(produceId);
  // No market price for it: the farmer sets the price
  if (produce.is_custom) {
    return { produce_id: produce.id, name: produce.name, unit: produce.unit, is_custom: true, price: null, date: null, source: "FARMER" };
  }
  const marketPrice = await getMarketPrice(produce);
  return { produce_id: produce.id, name: produce.name, unit: produce.unit, ...marketPrice };
}
