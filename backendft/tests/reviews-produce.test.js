import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, createWarehouse, dayFromToday, login, PHONES } from "./helpers.js";

// Market price fixed at 42.5 so listings can be created without the website
vi.mock("../src/modules/produce/marketPrice.scraper.js", () => ({
  scrapeMarketPrice: vi.fn(async () => 42.5),
}));

let farmer, otherFarmer, buyer, otherBuyer, partner, owner, cabbageId;

beforeAll(async () => {
  [farmer, otherFarmer, buyer, otherBuyer, partner, owner] = await Promise.all([
    login(PHONES.farmer),
    login(PHONES.otherFarmer),
    login(PHONES.buyer),
    login(PHONES.otherRegionBuyer),
    login(PHONES.partner),
    login(PHONES.owner),
  ]);
  cabbageId = (await api.get("/api/produce")).body.find((p) => p.name === "Cabbage").id;
});

afterAll(() => pool.end());

/** A listing, an order for it, and the farmer's acceptance; optionally taken all the way to delivered. */
async function order({ deliver = false } = {}) {
  const listing = (await api.post("/api/listings").set(auth(farmer)).send({ produce_id: cabbageId, available_qty: 50 })).body;
  const placed = (await api.post("/api/orders").set(auth(buyer)).send({ items: [{ listing_id: listing.id, quantity: 2 }] })).body[0];
  await api.patch(`/api/orders/${placed.id}/confirm`).set(auth(farmer));
  if (deliver) {
    await api.patch(`/api/deliveries/${placed.id}/accept`).set(auth(partner));
    await api.patch(`/api/deliveries/${placed.id}/complete`).set(auth(partner));
  }
  return placed;
}

const partnerId = async () => (await api.get("/api/auth/me").set(auth(partner))).body.id;

describe("rating the delivery partner", () => {
  it("only after delivery, only by the buyer of the order, and only once", async () => {
    const waiting = await order();
    const early = await api.post(`/api/orders/${waiting.id}/partner-review`).set(auth(buyer)).send({ rating: 5 });
    expect(early.status).toBe(400);

    const delivered = await order({ deliver: true });
    const rate = (token, body = { rating: 4, comment: "On time" }) =>
      api.post(`/api/orders/${delivered.id}/partner-review`).set(auth(token)).send(body);

    expect((await rate(otherBuyer)).status).toBe(403);
    expect((await rate(farmer)).status).toBe(403);
    expect((await rate(buyer, { rating: 6 })).status).toBe(400);

    const done = await rate(buyer);
    expect(done.status).toBe(201);
    expect(done.body).toMatchObject({ rating: 4, comment: "On time", buyer_name: "Erumely", produce_name: "Cabbage" });
    expect((await rate(buyer)).status).toBe(409);
  });

  it("shows up in the partner's reviews, dashboard rating and the buyer's order list", async () => {
    const before = (await api.get("/api/dashboard").set(auth(partner))).body;
    const delivered = await order({ deliver: true });
    await api.post(`/api/orders/${delivered.id}/partner-review`).set(auth(buyer)).send({ rating: 2 });

    const reviews = (await api.get(`/api/reviews/partners?partner_id=${await partnerId()}`)).body;
    expect(reviews.find((r) => r.order_id === delivered.id)).toMatchObject({ rating: 2, buyer_name: "Erumely" });

    const after = (await api.get("/api/dashboard").set(auth(partner))).body;
    expect(after.review_count).toBe(before.review_count + 1);
    expect(after.rating).toBeGreaterThanOrEqual(1);

    const mine = (await api.get("/api/orders/mine").set(auth(buyer))).body.find((o) => o.id === delivered.id);
    expect(mine).toMatchObject({ is_partner_reviewed: true, partner_review_rating: 2 });
    expect((await api.get("/api/reviews/partners")).status).toBe(400);
  });
});

describe("rating a warehouse", () => {
  const request = async (token = farmer) => {
    const wh = (await createWarehouse(owner, { name: "Review Store" })).body;
    const booking = (
      await api.post("/api/warehouse-bookings").set(auth(token)).send({
        warehouse_id: wh.id,
        quantity_kg: 50,
        start_date: dayFromToday(0),
        end_date: dayFromToday(2),
      })
    ).body;
    return { wh, booking };
  };

  it("only once the produce is out, only by the farmer who used it, and only once", async () => {
    const { wh, booking } = await request();
    const rate = (token, body = { rating: 5, comment: "Clean and cool" }) =>
      api.post(`/api/warehouse-bookings/${booking.id}/review`).set(auth(token)).send(body);

    expect((await rate(farmer)).status).toBe(400); // still only a request
    await api.patch(`/api/warehouse-bookings/${booking.id}/approve`).set(auth(owner));
    expect((await rate(farmer)).status).toBe(400); // approved but still in storage
    await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(farmer));

    expect((await rate(otherFarmer)).status).toBe(403);
    expect((await rate(buyer)).status).toBe(403);
    expect((await rate(farmer, { rating: 0 })).status).toBe(400);

    const done = await rate(farmer);
    expect(done.status).toBe(201);
    expect(done.body).toMatchObject({ rating: 5, comment: "Clean and cool", farmer_name: "Erumely", warehouse_name: "Review Store" });
    expect((await rate(farmer)).status).toBe(409);

    // the average and count are on the warehouse, in its public reviews, in the booking, and on the owner's dashboard
    const warehouse = (await api.get(`/api/warehouses/${wh.id}`)).body;
    expect(warehouse).toMatchObject({ rating: 5, review_count: 1 });
    expect((await api.get(`/api/reviews/warehouses?warehouse_id=${wh.id}`)).body).toHaveLength(1);
    const mine = (await api.get("/api/warehouse-bookings/mine").set(auth(farmer))).body.find((b) => b.id === booking.id);
    expect(mine).toMatchObject({ is_reviewed: true, review_rating: 5 });
    const dashboard = (await api.get("/api/dashboard").set(auth(owner))).body;
    expect(dashboard.review_count).toBeGreaterThanOrEqual(1);
  });

  it("shows no rating on a warehouse that has none yet", async () => {
    const wh = (await createWarehouse(owner, { name: "Unrated Store" })).body;
    expect(wh).toMatchObject({ rating: null, review_count: 0 });
  });
});

describe("produce added by a farmer", () => {
  let counter = 0;
  const addProduce = (token, name = `Own Produce ${Date.now()}-${counter++}`) =>
    api.post("/api/produce").set(auth(token)).send({ name, category: "VEGETABLE" });

  it("is marked custom, refuses duplicates, and is for farmers only", async () => {
    const res = await addProduce(farmer, "Drumstick Leaves");
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Drumstick Leaves", is_custom: true, category: "VEGETABLE" });

    expect((await addProduce(farmer, "drumstick leaves")).status).toBe(409); // same name, any case
    expect((await addProduce(farmer, "Cabbage")).status).toBe(409); // already in the market list
    expect((await addProduce(buyer, "Buyer Produce")).status).toBe(403);
  });

  it("is listed at the farmer's own price, with no market price and no fair-price band", async () => {
    const produce = (await addProduce(farmer)).body;

    expect((await api.post("/api/listings").set(auth(farmer)).send({ produce_id: produce.id, available_qty: 10 })).status).toBe(400);

    const listing = await api.post("/api/listings").set(auth(farmer)).send({ produce_id: produce.id, available_qty: 10, listing_price: 500 });
    expect(listing.status).toBe(201);
    expect(listing.body).toMatchObject({
      listing_price: 500,
      market_price: null,
      price_source: "FARMER",
      produce_is_custom: true,
      price_diff_pct: null,
    });

    // any price is fine when changing it too
    const changed = await api.patch(`/api/listings/${listing.body.id}`).set(auth(farmer)).send({ listing_price: 5 });
    expect(changed.status).toBe(200);
    expect(changed.body.listing_price).toBe(5);

    // buyers can order it like anything else
    const placed = await api.post("/api/orders").set(auth(buyer)).send({ items: [{ listing_id: listing.body.id, quantity: 2 }] });
    expect(placed.status).toBe(201);
    expect(placed.body[0].total_price).toBe(10);
  });

  it("has no market price: it is not on the price board and its price lookup says so", async () => {
    const produce = (await addProduce(farmer)).body;
    const board = (await api.get("/api/produce/prices")).body;
    expect(board.some((item) => item.produce_id === produce.id)).toBe(false);

    const price = await api.get(`/api/produce/${produce.id}/price`);
    expect(price.status).toBe(200);
    expect(price.body).toMatchObject({ is_custom: true, price: null });

    // market produce still has the band
    const market = await api.post("/api/listings").set(auth(farmer)).send({ produce_id: cabbageId, available_qty: 5, listing_price: 100 });
    expect(market.status).toBe(400);
  });

  it("is limited to 10 per farmer", async () => {
    const signup = await api.post("/api/auth/register").send({
      name: "Many Produce",
      phone: "9000008990",
      password: "supersecret",
      role: "FARMER",
      region_id: 1,
      base_location: "Test Town",
    });
    const token = signup.body.token;
    for (let i = 0; i < 10; i++) expect((await addProduce(token)).status).toBe(201);

    const eleventh = await addProduce(token);
    expect(eleventh.status).toBe(409);
    expect(eleventh.body.error.message).toMatch(/up to 10/);
    // another farmer is not affected
    expect((await addProduce(otherFarmer)).status).toBe(201);
  });
});
