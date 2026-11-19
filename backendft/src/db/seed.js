import bcrypt from "bcryptjs";
import pool from "./pool.js";

// Shared password for every demo account (documented in the README)
export const DEMO_PASSWORD = "AgriChain@123";

const REGIONS = ["Erumely", "Kanjirapally"];

// Every item on vegetablemarketprice.com's Kerala pages. Names must match the site exactly
// so live prices can be found.
const VEGETABLES = [
  "Onion Big", "Onion Small", "Tomato", "Green Chilli", "Beetroot", "Potato", "Raw Banana (Plantain)",
  "Amaranth Leaves", "Amla", "Ash gourd", "Baby Corn", "Banana Flower", "Capsicum", "Bitter Gourd",
  "Bottle Gourd", "Butter Beans", "Broad Beans", "Cabbage", "Carrot", "Cauliflower", "Cluster beans",
  "Coconut", "Colocasia Leaves", "Colocasia", "Coriander Leaves", "Corn", "Cucumber", "Curry Leaves",
  "Dill Leaves", "Drumsticks", "Brinjal", "Brinjal (Big)", "Elephant Yam", "Fenugreek Leaves",
  "French Beans", "Garlic", "Ginger", "Onion Green", "Green Peas", "Ivy Gourd", "Lemon (Lime)",
  "Mango Raw", "Mint Leaves", "Mushroom", "Mustard Leaves", "Ladies Finger", "Pumpkin", "Radish",
  "Ridge Gourd", "Shallot (Pearl Onion)", "Snake Gourd", "Sorrel Leaves", "Spinach", "Sweet Potato",
];

const FRUITS = [
  "Apple Washington", "Apple Shimla", "Apple Green", "Apricot", "Avocado", "Banana Morris", "Banana",
  "Banana Poovam", "Cantaloupe", "Custard Apple", "Gooseberry", "Grapes Black", "Grapes Green", "Guava",
  "Jackfruit", "Lychee", "Mango", "Orange", "Papaya", "Pears", "Pineapple", "Pomegranate Kabul", "Sapota",
  "Sugar Cane", "Sweet Lime(Mosumbi)", "Watermelon",
];

const PRODUCE = [
  ...VEGETABLES.map((name) => [name, "VEGETABLE"]),
  ...FRUITS.map((name) => [name, "FRUIT"]),
];

export const DEMO_USERS = [
  { name: "Erumely Farmer", phone: "9991110001", role: "FARMER", region: "Erumely", base_location: "Erumely Town" },
  { name: "Erumely Buyer", phone: "9791118801", role: "BUYER", region: "Erumely", base_location: "Erumely Market" },
  { name: "Erumely Warehouse Owner", phone: "9771238800", role: "WAREHOUSE_OWNER", region: "Erumely", base_location: "Erumely Town" },
  { name: "Kanjirapally Farmer", phone: "9661439890", role: "FARMER", region: "Kanjirapally", base_location: "Kanjirapally" },
  { name: "Kanjirapally Buyer", phone: "9456439760", role: "BUYER", region: "Kanjirapally", base_location: "Kanjirapally Junction" },
  { name: "Erumely Buyer 2", phone: "8891120981", role: "BUYER", region: "Erumely", base_location: "Erumely" },
  { name: "Erumely Delivery", phone: "9000011111", role: "DELIVERY_PARTNER", region: "Erumely", base_location: "Erumely" },
  { name: "Kanjirapally Delivery", phone: "9000022222", role: "DELIVERY_PARTNER", region: "Kanjirapally", base_location: "Kanjirapally" },
];

// Sample listings, only inserted into an empty listings table: [farmer phone, produce, qty, price]
const SAMPLE_LISTINGS = [
  ["9991110001", "Tomato", 50, 32],
  ["9991110001", "Banana", 80, 45],
  ["9661439890", "Potato", 120, 38],
  ["9661439890", "Onion Big", 100, 41],
];

/**
 * Idempotent seed: safe to run on a fresh or an existing database.
 * Existing users keep their password; users without one get the demo password.
 */
export async function runSeed({ log = console.log } = {}) {
  for (const name of REGIONS) {
    await pool.query("INSERT INTO regions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
  }

  for (const [name, category] of PRODUCE) {
    await pool.query(
      "INSERT INTO produce (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
      [name, category],
    );
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const user of DEMO_USERS) {
    await pool.query(
      `INSERT INTO users (name, phone, role, base_location, region_id, password_hash)
       VALUES ($1, $2, $3, $4, (SELECT id FROM regions WHERE name = $5), $6)
       ON CONFLICT (phone) DO UPDATE
         SET password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash)`,
      [user.name, user.phone, user.role, user.base_location, user.region, passwordHash],
    );
  }

  const { rows } = await pool.query("SELECT COUNT(*) AS count FROM warehouses");
  if (rows[0].count === 0) {
    await pool.query(
      // No photos here: they are real files, so the owner adds them (the app shows "No photos yet")
      `INSERT INTO warehouses (owner_id, region_id, name, location, total_capacity_kg,
                               price_per_kg_per_day, is_cold_storage)
       SELECT id, region_id, 'Erumely Cold Storage', 'Town Road', 2000, 1, TRUE
       FROM users WHERE phone = '9771238800'`,
    );
  }

  const listingCount = await pool.query("SELECT COUNT(*) AS count FROM listings");
  if (listingCount.rows[0].count === 0) {
    for (const [phone, produceName, qty, price] of SAMPLE_LISTINGS) {
      await pool.query(
        `INSERT INTO listings (farmer_id, produce_id, available_qty, listing_price, market_price)
         SELECT u.id, p.id, $3, $4, $4
         FROM users u, produce p
         WHERE u.phone = $1 AND p.name = $2`,
        [phone, produceName, qty, price],
      );
    }
  }

  log("seed complete");
}
