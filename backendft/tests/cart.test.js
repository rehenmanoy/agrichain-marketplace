import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, login, PHONES } from "./helpers.js";

// Market price fixed at 42.5
vi.mock("../src/modules/produce/marketPrice.scraper.js", () => ({
  scrapeMarketPrice: vi.fn(async () => 42.5),
}));

let farmer, secondFarmer, buyer, secondBuyer, otherRegionFarmer, carrotId, cabbageId;

async function register(role, phone) {
  const res = await api.post("/api/auth/register").send({
    name: `Cart ${role}`,
    phone,
    password: "supersecret",
    role,
    region_id: 1,
    base_location: "Cart Street",
  });
  expect(res.status).toBe(201);
  return res.body.token;
}

beforeAll(async () => {
  [farmer, buyer, otherRegionFarmer] = await Promise.all([
    login(PHONES.farmer),
    login(PHONES.buyer),
    login(PHONES.otherFarmer),
  ]);
  secondFarmer = await register("FARMER", "9000000771");
  secondBuyer = await register("BUYER", "9000000772");
  const produce = (await api.get("/api/produce")).body;
  carrotId = produce.find((p) => p.name === "Carrot").id;
  cabbageId = produce.find((p) => p.name === "Cabbage").id;
});

beforeEach(async () => {
  await api.delete("/api/cart").set(auth(buyer));
  await api.delete("/api/cart").set(auth(secondBuyer));
});

afterAll(() => pool.end());

const listing = async (token, produce_id, available_qty = 20) => {
  const res = await api.post("/api/listings").set(auth(token)).send({ produce_id, available_qty });
  expect(res.status).toBe(201);
  return res.body;
};
const addToCart = (token, listing_id, quantity) => api.post("/api/cart").set(auth(token)).send({ listing_id, quantity });
const getCart = async (token) => (await api.get("/api/cart").set(auth(token))).body;
const stock = async (id) => (await api.get(`/api/listings/${id}`)).body.available_qty;

describe("cart", () => {
  it("starts empty", async () => {
    expect(await getCart(buyer)).toMatchObject({ farmers: [], item_count: 0, grand_total: 0 });
  });

  it("adds items, adds up repeats and groups them by farmer", async () => {
    const carrot = await listing(farmer, carrotId);
    const cabbage = await listing(farmer, cabbageId);
    const fromSecond = await listing(secondFarmer, carrotId);

    await addToCart(buyer, carrot.id, 2);
    await addToCart(buyer, carrot.id, 3); // same listing again
    await addToCart(buyer, cabbage.id, 1);
    const res = await addToCart(buyer, fromSecond.id, 4);
    expect(res.status).toBe(201);

    const cart = res.body;
    expect(cart.item_count).toBe(3);
    expect(cart.farmers).toHaveLength(2);

    const first = cart.farmers.find((g) => g.farmer_name === "Erumely Farmer");
    expect(first.items.map((i) => [i.produce_name, i.quantity])).toEqual([
      ["Carrot", 5],
      ["Cabbage", 1],
    ]);
    // 6 kg × 42.5, fee 20 + 2 × 6
    expect(first).toMatchObject({ total_kg: 6, subtotal: 255, delivery_fee: 32, total: 287 });
    expect(cart.farmers.find((g) => g.farmer_name === "Cart FARMER")).toMatchObject({ delivery_fee: 28 });
    expect(cart.grand_total).toBe(287 + 170 + 28);
  });

  it("refuses more than is in stock, counting what is already in the cart", async () => {
    const carrot = await listing(farmer, carrotId, 5);
    expect((await addToCart(buyer, carrot.id, 6)).status).toBe(400);

    await addToCart(buyer, carrot.id, 4);
    const res = await addToCart(buyer, carrot.id, 2);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Available: 5/);
  });

  it("refuses listings from another region and unknown listings", async () => {
    const far = await listing(otherRegionFarmer, carrotId);
    expect((await addToCart(buyer, far.id, 1)).status).toBe(400);
    expect((await addToCart(buyer, 999999, 1)).status).toBe(404);
  });

  it("changes a quantity and removes an item", async () => {
    const carrot = await listing(farmer, carrotId);
    const cart = (await addToCart(buyer, carrot.id, 2)).body;
    const itemId = cart.farmers[0].items[0].id;

    const changed = await api.patch(`/api/cart/items/${itemId}`).set(auth(buyer)).send({ quantity: 7 });
    expect(changed.body.farmers[0].items[0].quantity).toBe(7);
    expect((await api.patch(`/api/cart/items/${itemId}`).set(auth(buyer)).send({ quantity: 500 })).status).toBe(400);

    const removed = await api.delete(`/api/cart/items/${itemId}`).set(auth(buyer));
    expect(removed.body.item_count).toBe(0);
  });

  it("keeps carts private and for buyers only", async () => {
    const carrot = await listing(farmer, carrotId);
    const itemId = (await addToCart(buyer, carrot.id, 1)).body.farmers[0].items[0].id;

    expect((await api.patch(`/api/cart/items/${itemId}`).set(auth(secondBuyer)).send({ quantity: 2 })).status).toBe(404);
    expect((await api.delete(`/api/cart/items/${itemId}`).set(auth(secondBuyer))).status).toBe(404);
    expect((await getCart(secondBuyer)).item_count).toBe(0);
    expect((await api.get("/api/cart").set(auth(farmer))).status).toBe(403);
    expect((await api.get("/api/cart")).status).toBe(401);
  });

  it("flags items that can no longer be ordered", async () => {
    const carrot = await listing(farmer, carrotId, 10);
    await addToCart(buyer, carrot.id, 8);
    await api.patch(`/api/listings/${carrot.id}`).set(auth(farmer)).send({ available_qty: 3 });

    const cart = await getCart(buyer);
    expect(cart.has_problems).toBe(true);
    expect(cart.farmers[0].items[0].problem).toBe("NOT_ENOUGH_STOCK");
    expect((await api.post("/api/cart/checkout").set(auth(buyer)).send({})).status).toBe(400);

    await api.patch(`/api/listings/${carrot.id}/deactivate`).set(auth(farmer));
    expect((await getCart(buyer)).farmers[0].items[0].problem).toBe("UNAVAILABLE");
  });
});

describe("checkout", () => {
  it("makes one order per farmer, with all of that farmer's items and one delivery fee", async () => {
    const carrot = await listing(farmer, carrotId, 20);
    const cabbage = await listing(farmer, cabbageId, 20);
    const fromSecond = await listing(secondFarmer, carrotId, 20);
    await addToCart(buyer, carrot.id, 2);
    await addToCart(buyer, cabbage.id, 3);
    await addToCart(buyer, fromSecond.id, 4);

    const res = await api.post("/api/cart/checkout").set(auth(buyer)).send({ delivery_address: "12 Test Lane" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(2);

    const one = res.body.find((o) => o.farmer_name === "Erumely Farmer");
    expect(one).toMatchObject({
      status: "PENDING",
      total_kg: 5,
      total_price: 212.5,
      delivery_fee: 30, // 20 + 2 × 5, charged once for both items
      delivery_address: "12 Test Lane",
    });
    expect(one.items.map((i) => [i.produce_name, i.quantity])).toEqual([
      ["Carrot", 2],
      ["Cabbage", 3],
    ]);
    expect(res.body.find((o) => o.farmer_name === "Cart FARMER")).toMatchObject({ total_kg: 4, delivery_fee: 28 });

    // stock is reduced for every item, and the cart is empty
    expect(await stock(carrot.id)).toBe(18);
    expect(await stock(cabbage.id)).toBe(17);
    expect(await stock(fromSecond.id)).toBe(16);
    expect((await getCart(buyer)).item_count).toBe(0);

    // each farmer sees only their own order, the buyer sees both
    const farmerOrders = (await api.get("/api/orders/incoming").set(auth(farmer))).body;
    expect(farmerOrders.some((o) => o.id === one.id)).toBe(true);
    expect(farmerOrders.some((o) => o.farmer_name === "Cart FARMER")).toBe(false);
    const mine = (await api.get("/api/orders/mine").set(auth(buyer))).body;
    expect(res.body.every((o) => mine.some((m) => m.id === o.id))).toBe(true);
  });

  it("refuses an empty cart", async () => {
    const res = await api.post("/api/cart/checkout").set(auth(buyer)).send({});
    expect(res.status).toBe(400);
  });

  it("orders nothing when one item is short on stock, and keeps the cart", async () => {
    const carrot = await listing(farmer, carrotId, 10);
    const cabbage = await listing(farmer, cabbageId, 10);
    await addToCart(buyer, carrot.id, 5);
    await addToCart(buyer, cabbage.id, 5);
    await api.patch(`/api/listings/${cabbage.id}`).set(auth(farmer)).send({ available_qty: 2 });

    const res = await api.post("/api/cart/checkout").set(auth(buyer)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Not enough Cabbage/);
    expect(await stock(carrot.id)).toBe(10); // untouched
    expect((await getCart(buyer)).item_count).toBe(2);
  });

  it("does not oversell when two buyers check out the last stock together", async () => {
    const carrot = await listing(farmer, carrotId, 5);
    await addToCart(buyer, carrot.id, 4);
    await addToCart(secondBuyer, carrot.id, 4);

    const results = await Promise.all([
      api.post("/api/cart/checkout").set(auth(buyer)).send({}),
      api.post("/api/cart/checkout").set(auth(secondBuyer)).send({}),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(await stock(carrot.id)).toBe(1);
  });

  it("gives back every item's stock when a multi-item order is cancelled", async () => {
    const carrot = await listing(farmer, carrotId, 10);
    const cabbage = await listing(farmer, cabbageId, 10);
    await addToCart(buyer, carrot.id, 4);
    await addToCart(buyer, cabbage.id, 6);
    const order = (await api.post("/api/cart/checkout").set(auth(buyer)).send({})).body[0];
    expect(await stock(cabbage.id)).toBe(4);

    const cancelled = await api.patch(`/api/orders/${order.id}/cancel`).set(auth(buyer));
    expect(cancelled.body.status).toBe("CANCELLED");
    expect(await stock(carrot.id)).toBe(10);
    expect(await stock(cabbage.id)).toBe(10);
  });

  it("blocks deleting a listing that is in an open multi-item order", async () => {
    const carrot = await listing(farmer, carrotId);
    const cabbage = await listing(farmer, cabbageId);
    await addToCart(buyer, carrot.id, 1);
    await addToCart(buyer, cabbage.id, 1);
    await api.post("/api/cart/checkout").set(auth(buyer)).send({});

    expect((await api.delete(`/api/listings/${cabbage.id}`).set(auth(farmer))).status).toBe(409);
  });

  it("delivers a multi-item order through the partner flow and lets the buyer review it once", async () => {
    const partner = await login(PHONES.partner);
    const carrot = await listing(farmer, carrotId);
    const cabbage = await listing(farmer, cabbageId);
    await addToCart(buyer, carrot.id, 2);
    await addToCart(buyer, cabbage.id, 2);
    const order = (await api.post("/api/cart/checkout").set(auth(buyer)).send({})).body[0];

    await api.patch(`/api/orders/${order.id}/confirm`).set(auth(farmer));
    const available = (await api.get("/api/deliveries/available").set(auth(partner))).body;
    expect(available.find((o) => o.id === order.id).items).toHaveLength(2);

    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    const done = await api.patch(`/api/deliveries/${order.id}/complete`).set(auth(partner));
    expect(done.body.status).toBe("DELIVERED");

    const review = await api.post(`/api/orders/${order.id}/review`).set(auth(buyer)).send({ rating: 5 });
    expect(review.status).toBe(201);
    expect(review.body.produce_name).toBe("Carrot, Cabbage");
  });
});
