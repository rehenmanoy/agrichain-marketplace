import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, login, PHONES } from "./helpers.js";

// Market price fixed at 42.5, so the ±20% band is 34.00 – 51.00
vi.mock("../src/modules/produce/marketPrice.scraper.js", () => ({
  scrapeMarketPrice: vi.fn(async () => 42.5),
}));

let farmer, buyer, partner, otherRegionPartner, owner, produceId;

beforeAll(async () => {
  [farmer, buyer, partner, otherRegionPartner, owner] = await Promise.all([
    login(PHONES.farmer),
    login(PHONES.buyer),
    login(PHONES.partner),
    login(PHONES.otherRegionPartner),
    login(PHONES.owner),
  ]);
  produceId = (await api.get("/api/produce")).body.find((p) => p.name === "Cabbage").id;
});

afterAll(() => pool.end());

const createListing = (body = {}) =>
  api.post("/api/listings").set(auth(farmer)).send({ produce_id: produceId, available_qty: 50, ...body });

/** Creates a listing, places an order and has the farmer confirm it. */
async function confirmedOrder(quantity = 2) {
  const listing = (await createListing()).body;
  const order = (await api.post("/api/orders").set(auth(buyer)).send({ items: [{ listing_id: listing.id, quantity }] }))
    .body[0];
  await api.patch(`/api/orders/${order.id}/confirm`).set(auth(farmer));
  return order;
}

async function deliveredOrder(quantity = 2) {
  const order = await confirmedOrder(quantity);
  await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
  await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner));
  return order;
}

describe("price band", () => {
  it("accepts a farmer price inside the band", async () => {
    const res = await createListing({ listing_price: 45 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      listing_price: 45,
      market_price: 42.5,
      price_source: "FARMER",
      price_diff_pct: 5.9,
    });
  });

  it("rejects a price outside the band and names the range", async () => {
    const res = await createListing({ listing_price: 60 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("₹34.00 and ₹51.00");
  });

  it("re-checks the band when the price is updated", async () => {
    const listing = (await createListing()).body;
    expect(listing.price_source).toBe("SCRAPED");

    const tooLow = await api.patch(`/api/listings/${listing.id}`).set(auth(farmer)).send({ listing_price: 30 });
    expect(tooLow.status).toBe(400);

    const ok = await api.patch(`/api/listings/${listing.id}`).set(auth(farmer)).send({ listing_price: 38 });
    expect(ok.body).toMatchObject({ listing_price: 38, price_source: "FARMER" });
  });

  it("requires something to update", async () => {
    const listing = (await createListing()).body;
    const res = await api.patch(`/api/listings/${listing.id}`).set(auth(farmer)).send({});
    expect(res.status).toBe(400);
  });
});

describe("stopping and deleting listings", () => {
  const listingIds = async (token) => (await api.get("/api/listings/mine").set(auth(token))).body.map((l) => l.id);

  it("editing a stopped listing doesn't restart it, but Sell again does", async () => {
    const listing = (await createListing()).body;
    await api.patch(`/api/listings/${listing.id}/deactivate`).set(auth(farmer));

    const edited = await api.patch(`/api/listings/${listing.id}`).set(auth(farmer)).send({ available_qty: 30 });
    expect(edited.body).toMatchObject({ available_qty: 30, is_active: false });

    const again = await api.patch(`/api/listings/${listing.id}`).set(auth(farmer)).send({ is_active: true });
    expect(again.body).toMatchObject({ available_qty: 30, is_active: true });
  });

  it("deletes a listing and hides it everywhere", async () => {
    const listing = (await createListing()).body;

    const res = await api.delete(`/api/listings/${listing.id}`).set(auth(farmer));
    expect(res.status).toBe(204);

    expect(await listingIds(farmer)).not.toContain(listing.id);
    expect((await api.get(`/api/listings/${listing.id}`)).status).toBe(404);
    const browse = await api.get("/api/listings?region_id=1");
    expect(browse.body.some((l) => l.id === listing.id)).toBe(false);
    // and it can't be changed or deleted a second time
    expect((await api.patch(`/api/listings/${listing.id}`).set(auth(farmer)).send({ available_qty: 5 })).status).toBe(404);
    expect((await api.delete(`/api/listings/${listing.id}`).set(auth(farmer))).status).toBe(404);
  });

  it("only lets the owner delete a listing", async () => {
    const listing = (await createListing()).body;
    const otherFarmer = await login(PHONES.otherFarmer);
    expect((await api.delete(`/api/listings/${listing.id}`).set(auth(otherFarmer))).status).toBe(403);
    expect((await api.delete(`/api/listings/${listing.id}`).set(auth(buyer))).status).toBe(403);
    expect(await listingIds(farmer)).toContain(listing.id);
  });

  it("refuses to delete while orders are open, and allows it once they're finished", async () => {
    const order = await confirmedOrder();
    const listingId = order.items[0].listing_id;
    const blocked = await api.delete(`/api/listings/${listingId}`).set(auth(farmer));
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toMatch(/open orders/);

    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner));
    expect((await api.delete(`/api/listings/${listingId}`).set(auth(farmer))).status).toBe(204);

    // the delivered order is still there, and still counts as earnings
    const history = await api.get("/api/orders/incoming?status=DELIVERED").set(auth(farmer));
    expect(history.body.some((o) => o.id === order.id)).toBe(true);
  });
});

describe("market prices board", () => {
  it("returns today's price and yesterday's for every produce item", async () => {
    await pool.query(
      `INSERT INTO price_history (produce_id, market_price, date) VALUES ($1, 40, CURRENT_DATE - 1)
       ON CONFLICT (produce_id, date) DO UPDATE SET market_price = 40`,
      [produceId],
    );

    const res = await api.get("/api/produce/prices");
    expect(res.status).toBe(200);
    const cabbage = res.body.find((p) => p.produce_id === produceId);
    expect(cabbage).toMatchObject({ name: "Cabbage", price: 42.5, source: "TODAY", yesterday_price: 40 });
    expect(res.body.length).toBeGreaterThan(5);
  });
});

describe("deliveries", () => {
  it("runs confirmed → out for delivery → delivered", async () => {
    const order = await confirmedOrder();

    const available = await api.get("/api/deliveries/available").set(auth(partner));
    expect(available.body.some((o) => o.id === order.id)).toBe(true);

    const accepted = await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({ status: "OUT_FOR_DELIVERY", delivery_partner_name: "Erumely Delivery" });
    expect(accepted.body.picked_up_at).toBeTruthy();

    const mine = await api.get("/api/deliveries/mine?status=OUT_FOR_DELIVERY").set(auth(partner));
    expect(mine.body.some((o) => o.id === order.id)).toBe(true);

    const done = await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner));
    expect(done.body).toMatchObject({ status: "DELIVERED" });
    expect(done.body.delivered_at).toBeTruthy();
  });

  it("hides orders from partners in other regions", async () => {
    const order = await confirmedOrder();
    const available = await api.get("/api/deliveries/available").set(auth(otherRegionPartner));
    expect(available.body.some((o) => o.id === order.id)).toBe(false);
    expect((await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(otherRegionPartner))).status).toBe(403);
  });

  it("lets only one partner win a race for the same order", async () => {
    const reg = await api.post("/api/auth/register").send({
      name: "Second Rider",
      phone: "9000033333",
      password: "supersecret",
      role: "DELIVERY_PARTNER",
      region_id: 1,
    });
    const secondPartner = reg.body.token;
    const order = await confirmedOrder();

    const results = await Promise.all([
      api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner)),
      api.patch(`/api/deliveries/${order.id}/accept`).set(auth(secondPartner)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });

  it("only allows partners, and only the assigned one, to complete", async () => {
    const order = await confirmedOrder();
    expect((await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(farmer))).status).toBe(403);
    // not picked up yet
    expect((await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner))).status).toBe(403);
  });

  it("lets a partner report a delay that the buyer and farmer can see", async () => {
    const order = await confirmedOrder();
    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));

    const res = await api.patch(`/api/deliveries/${order.id}/delay`).set(auth(partner)).send({ reason: "TRAFFIC", minutes: 30 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "OUT_FOR_DELIVERY", delay_reason: "TRAFFIC", delay_minutes: 30 });
    expect(res.body.delayed_at).toBeTruthy();

    const buyerView = (await api.get("/api/orders/mine").set(auth(buyer))).body.find((o) => o.id === order.id);
    const farmerView = (await api.get("/api/orders/incoming").set(auth(farmer))).body.find((o) => o.id === order.id);
    expect(buyerView).toMatchObject({ delay_reason: "TRAFFIC", delay_minutes: 30 });
    expect(farmerView).toMatchObject({ delay_reason: "TRAFFIC", delay_minutes: 30 });

    // a new report replaces the old one
    const again = await api.patch(`/api/deliveries/${order.id}/delay`).set(auth(partner)).send({ reason: "WEATHER", minutes: 60 });
    expect(again.body).toMatchObject({ delay_reason: "WEATHER", delay_minutes: 60 });
  });

  it("rejects an invalid delay, and a delay from anyone but the assigned partner", async () => {
    const order = await confirmedOrder();
    const send = (token, body) => api.patch(`/api/deliveries/${order.id}/delay`).set(auth(token)).send(body);

    // not picked up yet
    expect((await send(partner, { reason: "TRAFFIC", minutes: 30 })).status).toBe(403);

    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    expect((await send(partner, { reason: "LAZY", minutes: 30 })).status).toBe(400);
    expect((await send(partner, { reason: "TRAFFIC", minutes: 2 })).status).toBe(400);
    expect((await send(partner, { reason: "TRAFFIC", minutes: 500 })).status).toBe(400);
    expect((await send(otherRegionPartner, { reason: "TRAFFIC", minutes: 30 })).status).toBe(403);
    expect((await send(farmer, { reason: "TRAFFIC", minutes: 30 })).status).toBe(403);

    await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner));
    expect((await send(partner, { reason: "TRAFFIC", minutes: 30 })).status).toBe(400);
  });

  it("lets a partner give a delivery back so another partner can take it", async () => {
    const order = await confirmedOrder();
    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    await api.patch(`/api/deliveries/${order.id}/delay`).set(auth(partner)).send({ reason: "VEHICLE", minutes: 45 });

    const released = await api.patch(`/api/deliveries/${order.id}/release`).set(auth(partner));
    expect(released.status).toBe(200);
    expect(released.body).toMatchObject({
      status: "CONFIRMED",
      delivery_partner_id: null,
      picked_up_at: null,
      delay_reason: null,
      delay_minutes: null,
    });

    const mineNow = await api.get("/api/deliveries/mine?status=OUT_FOR_DELIVERY").set(auth(partner));
    expect(mineNow.body.some((o) => o.id === order.id)).toBe(false);
    const available = await api.get("/api/deliveries/available").set(auth(partner));
    expect(available.body.some((o) => o.id === order.id)).toBe(true);

    // and it can be taken (and finished) again
    expect((await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner))).status).toBe(200);
    expect((await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner))).body.status).toBe("DELIVERED");
  });

  it("only lets the assigned partner give a delivery back while it is out for delivery", async () => {
    const order = await confirmedOrder();
    const release = (token) => api.patch(`/api/deliveries/${order.id}/release`).set(auth(token));

    expect((await release(partner)).status).toBe(403); // nobody has it yet
    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    expect((await release(otherRegionPartner)).status).toBe(403);
    expect((await release(buyer)).status).toBe(403);

    await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner));
    expect((await release(partner)).status).toBe(400);
  });

  it("can't pick up a pending order", async () => {
    const listing = (await createListing()).body;
    const order = (await api.post("/api/orders").set(auth(buyer)).send({ items: [{ listing_id: listing.id, quantity: 1 }] }))
      .body[0];
    expect((await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner))).status).toBe(400);
  });
});

describe("reviews", () => {
  it("only allows a review after delivery, and only once", async () => {
    const pending = await confirmedOrder();
    const early = await api.post(`/api/orders/${pending.id}/review`).set(auth(buyer)).send({ rating: 5 });
    expect(early.status).toBe(400);

    const order = await deliveredOrder();
    const first = await api.post(`/api/orders/${order.id}/review`).set(auth(buyer)).send({
      rating: 4,
      comment: "Fresh cabbage",
    });
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ rating: 4, buyer_name: "Erumely", produce_name: "Cabbage" });

    const again = await api.post(`/api/orders/${order.id}/review`).set(auth(buyer)).send({ rating: 1 });
    expect(again.status).toBe(409);

    const mine = await api.get("/api/orders/mine").set(auth(buyer));
    const reviewed = mine.body.find((o) => o.id === order.id);
    expect(reviewed).toMatchObject({ is_reviewed: true, review_rating: 4, review_comment: "Fresh cabbage" });
  });

  it("validates the rating", async () => {
    const order = await deliveredOrder();
    const res = await api.post(`/api/orders/${order.id}/review`).set(auth(buyer)).send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it("shows the farmer's rating on listings and public reviews", async () => {
    const order = await deliveredOrder();
    await api.post(`/api/orders/${order.id}/review`).set(auth(buyer)).send({ rating: 2 });

    const farmerId = (await api.get("/api/auth/me").set(auth(farmer))).body.id;
    const reviews = await api.get(`/api/reviews?farmer_id=${farmerId}`);
    const ratings = reviews.body.map((r) => r.rating);
    const expected = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;

    const listing = (await createListing()).body;
    expect(listing.farmer_review_count).toBe(ratings.length);
    expect(listing.farmer_rating).toBe(expected);
  });
});

describe("dashboard", () => {
  it("summarises a farmer's earnings", async () => {
    const before = (await api.get("/api/dashboard").set(auth(farmer))).body;
    await deliveredOrder(3); // 3 × 42.5

    const after = (await api.get("/api/dashboard").set(auth(farmer))).body;
    expect(after.role).toBe("FARMER");
    expect(after.total_earned).toBeCloseTo(before.total_earned + 127.5);
    expect(after.orders_by_status.DELIVERED).toBe(before.orders_by_status.DELIVERED + 1);
    expect(after.revenue_last_7_days).toHaveLength(7);
    expect(after.revenue_last_7_days.at(-1).revenue).toBeGreaterThanOrEqual(127.5);
    expect(after.top_produce[0]).toHaveProperty("produce_name");
  });

  it("summarises a delivery partner's earnings", async () => {
    const before = (await api.get("/api/dashboard").set(auth(partner))).body;
    await deliveredOrder(5); // fee 20 + 2 × 5
    const after = (await api.get("/api/dashboard").set(auth(partner))).body;
    expect(after.total_earned).toBeCloseTo(before.total_earned + 30);
    expect(after.completed_deliveries).toBe(before.completed_deliveries + 1);
    expect(after.earned_today).toBeCloseTo(before.earned_today + 30);
    expect(after.earnings_last_7_days).toHaveLength(7);
    expect(after.earnings_last_7_days.at(-1).earned).toBeCloseTo(before.earnings_last_7_days.at(-1).earned + 30);
  });

  it("summarises buyer spend and warehouse occupancy", async () => {
    const buyerStats = (await api.get("/api/dashboard").set(auth(buyer))).body;
    expect(buyerStats).toMatchObject({ role: "BUYER" });
    expect(buyerStats.total_spent).toBeGreaterThan(0);
    expect(buyerStats.favourite_farmers[0].farmer_name).toBe("Erumely Farmer");

    const ownerStats = (await api.get("/api/dashboard").set(auth(owner))).body;
    expect(ownerStats.role).toBe("WAREHOUSE_OWNER");
    const expectedPct =
      Math.round((ownerStats.used_capacity_kg / ownerStats.total_capacity_kg) * 1000) / 10;
    expect(ownerStats.occupancy_pct).toBe(expectedPct);
  });
});
