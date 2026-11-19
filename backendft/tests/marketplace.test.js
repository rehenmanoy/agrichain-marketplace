import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, login, PHONES } from "./helpers.js";

// Never hit the real website from tests
vi.mock("../src/modules/produce/marketPrice.scraper.js", () => ({
  scrapeMarketPrice: vi.fn(async () => 42.5),
}));

let farmer, otherFarmer, buyer, otherRegionBuyer;

beforeAll(async () => {
  [farmer, otherFarmer, buyer, otherRegionBuyer] = await Promise.all([
    login(PHONES.farmer),
    login(PHONES.otherFarmer),
    login(PHONES.buyer),
    login(PHONES.otherRegionBuyer),
  ]);
});

afterAll(() => pool.end());

async function createListing(qty = 20) {
  const produce = await api.get("/api/produce");
  const carrot = produce.body.find((p) => p.name === "Carrot");
  const res = await api.post("/api/listings").set(auth(farmer)).send({
    produce_id: carrot.id,
    available_qty: qty,
  });
  expect(res.status).toBe(201);
  return res.body;
}

async function placeOrder(listingId, quantity, token = buyer) {
  return api.post("/api/orders").set(auth(token)).send({ items: [{ listing_id: listingId, quantity }] });
}

describe("listings", () => {
  it("prices a new listing at today's market price", async () => {
    const listing = await createListing();
    expect(listing).toMatchObject({ listing_price: 42.5, market_price: 42.5, produce_name: "Carrot" });
  });

  it("filters the public browse by region", async () => {
    const res = await api.get("/api/listings?region_id=2");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((l) => l.farmer_region_id === 2)).toBe(true);
  });

  it("stops a farmer from editing another farmer's listing", async () => {
    const listing = await createListing();
    const res = await api.patch(`/api/listings/${listing.id}`).set(auth(otherFarmer)).send({ available_qty: 1 });
    expect(res.status).toBe(403);
  });
});

describe("orders", () => {
  it("reduces stock when an order is placed", async () => {
    const listing = await createListing(10);
    const res = await placeOrder(listing.id, 4);

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ total_kg: 4, total_price: 170, status: "PENDING" });
    expect(res.body[0].items).toEqual([
      expect.objectContaining({ listing_id: listing.id, quantity: 4, unit_price: 42.5, line_total: 170 }),
    ]);
    expect((await api.get(`/api/listings/${listing.id}`)).body.available_qty).toBe(6);
  });

  it("rejects ordering more than is available", async () => {
    const listing = await createListing(3);
    const res = await placeOrder(listing.id, 5);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Available: 3/);
  });

  it("deactivates a sold-out listing", async () => {
    const listing = await createListing(2);
    await placeOrder(listing.id, 2);
    const after = await api.get(`/api/listings/${listing.id}`);
    expect(after.body).toMatchObject({ available_qty: 0, is_active: false });
  });

  it("only lets buyers order from their own region", async () => {
    const listing = await createListing();
    const res = await placeOrder(listing.id, 1, otherRegionBuyer);
    expect(res.status).toBe(400);
  });

  it("restores stock when a pending order is cancelled", async () => {
    const listing = await createListing(10);
    const order = (await placeOrder(listing.id, 7)).body[0];

    const res = await api.patch(`/api/orders/${order.id}/cancel`).set(auth(buyer));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
    expect((await api.get(`/api/listings/${listing.id}`)).body.available_qty).toBe(10);
  });

  it("lets only the listing's farmer confirm, and blocks cancelling after that", async () => {
    const listing = await createListing();
    const order = (await placeOrder(listing.id, 1)).body[0];

    expect((await api.patch(`/api/orders/${order.id}/confirm`).set(auth(otherFarmer))).status).toBe(403);

    const confirmed = await api.patch(`/api/orders/${order.id}/confirm`).set(auth(farmer));
    expect(confirmed.body.status).toBe("CONFIRMED");
    expect((await api.patch(`/api/orders/${order.id}/confirm`).set(auth(farmer))).status).toBe(400);
    expect((await api.patch(`/api/orders/${order.id}/cancel`).set(auth(buyer))).status).toBe(400);

    const incoming = await api.get("/api/orders/incoming").set(auth(farmer));
    expect(incoming.body.some((o) => o.id === order.id)).toBe(true);
  });

  it("adds a delivery fee and defaults the address to the buyer's location", async () => {
    const listing = await createListing();
    const res = await placeOrder(listing.id, 5);
    // fee = 20 + 2 × 5
    expect(res.body[0]).toMatchObject({
      delivery_fee: 30,
      total_price: 212.5,
      grand_total: 242.5,
      delivery_address: "Erumely Market",
    });
  });

  it("doesn't oversell when two orders race for the last stock", async () => {
    const listing = await createListing(5);
    const results = await Promise.all([placeOrder(listing.id, 4), placeOrder(listing.id, 4)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 400]);
    expect((await api.get(`/api/listings/${listing.id}`)).body.available_qty).toBe(1);
  });
});

describe("warehouse bookings (basic checks; the full flow is in warehouses.test.js)", () => {
  it("rejects bookings over capacity and in another region", async () => {
    const [warehouse] = (await api.get("/api/warehouses?region_id=1")).body;

    const tooBig = await api.post("/api/warehouse-bookings").set(auth(farmer)).send({
      warehouse_id: warehouse.id,
      quantity_kg: 999999,
    });
    expect(tooBig.status).toBe(400);

    const wrongRegion = await api.post("/api/warehouse-bookings").set(auth(otherFarmer)).send({
      warehouse_id: warehouse.id,
      quantity_kg: 1,
    });
    expect(wrongRegion.status).toBe(400);
  });

  it("rejects an end date before the start date", async () => {
    const res = await api.post("/api/warehouse-bookings").set(auth(farmer)).send({
      warehouse_id: 1,
      quantity_kg: 1,
      start_date: "2099-01-10",
      end_date: "2099-01-05",
    });
    expect(res.status).toBe(400);
  });
});
