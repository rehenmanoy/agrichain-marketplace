import request from "supertest";
import app from "../src/app.js";
import { DEMO_PASSWORD } from "../src/db/seed.js";

export const api = request(app);

// Seeded demo accounts (see src/db/seed.js)
export const PHONES = {
  farmer: "9991110001", // Erumely
  otherFarmer: "9661439890", // Kanjirapally
  buyer: "9791118801", // Erumely
  otherRegionBuyer: "9456439760", // Kanjirapally
  owner: "9771238800", // Erumely
  partner: "9000011111", // Erumely
  otherRegionPartner: "9000022222", // Kanjirapally
};

export async function login(phone) {
  const res = await api.post("/api/auth/login").send({ phone, password: DEMO_PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${phone}: ${res.status}`);
  return res.body.token;
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** "YYYY-MM-DD" for today plus n days (negative for the past), in the server's local time like the API */
export const dayFromToday = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA");

// The first bytes of a PNG followed by filler: enough to pass the upload's file-type check
const PNG_START = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const fakePng = () => Buffer.concat([PNG_START, Buffer.from("pretend picture data")]);

/** Creates a warehouse the way the app does: a multipart form with photos. */
export function createWarehouse(token, fields = {}, { photos = 2 } = {}) {
  const form = {
    name: "Test Store",
    location: "Main Road",
    total_capacity_kg: 500,
    price_per_kg_per_day: 3,
    is_cold_storage: false,
    ...fields,
  };
  let req = api.post("/api/warehouses").set(auth(token));
  for (const [key, value] of Object.entries(form)) req = req.field(key, String(value));
  for (let i = 0; i < photos; i++) {
    req = req.attach("photos", fakePng(), { filename: `photo${i}.png`, contentType: "image/png" });
  }
  return req;
}
