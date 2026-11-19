import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, createWarehouse, dayFromToday, login, PHONES } from "./helpers.js";

vi.mock("../src/modules/produce/marketPrice.scraper.js", () => ({
  scrapeMarketPrice: vi.fn(async () => 42.5),
}));

let farmer, buyer, partner, otherPartner, owner, cabbageId;

beforeAll(async () => {
  [farmer, buyer, partner, otherPartner, owner] = await Promise.all([
    login(PHONES.farmer),
    login(PHONES.buyer),
    login(PHONES.partner),
    login(PHONES.otherRegionPartner),
    login(PHONES.owner),
  ]);
  cabbageId = (await api.get("/api/produce")).body.find((p) => p.name === "Cabbage").id;
});

afterAll(() => pool.end());

const inbox = async (token) => (await api.get("/api/notifications?limit=100").set(auth(token))).body;
/** The notices of one type about one order or booking (they all carry its id in their data) */
const about = async (token, type, key, id) => (await inbox(token)).items.filter((n) => n.type === type && n.data[key] === id);

async function place() {
  const listing = (await api.post("/api/listings").set(auth(farmer)).send({ produce_id: cabbageId, available_qty: 50 })).body;
  const res = await api.post("/api/orders").set(auth(buyer)).send({ items: [{ listing_id: listing.id, quantity: 2 }] });
  return res.body[0];
}

describe("order notifications", () => {
  it("tells the right people at every step of an order", async () => {
    const order = await place();
    const id = order.id;

    // the farmer hears about the new order, with the buyer's name
    const fresh = await about(farmer, "ORDER_NEW", "orderId", id);
    expect(fresh).toHaveLength(1);
    expect(fresh[0].data.name).toBe("Erumely Buyer");
    expect(fresh[0].read_at).toBeNull();
    expect(await about(buyer, "ORDER_NEW", "orderId", id)).toHaveLength(0);

    // accepting tells the buyer, and every partner in that region (not another region's partner)
    await api.patch(`/api/orders/${id}/confirm`).set(auth(farmer));
    expect((await about(buyer, "ORDER_ACCEPTED", "orderId", id))[0].data.name).toBe("Erumely Farmer");
    expect(await about(partner, "DELIVERY_WAITING", "orderId", id)).toHaveLength(1);
    expect(await about(otherPartner, "DELIVERY_WAITING", "orderId", id)).toHaveLength(0);

    // pick-up, delay and delivery tell both the buyer and the farmer
    await api.patch(`/api/deliveries/${id}/accept`).set(auth(partner));
    for (const token of [buyer, farmer]) {
      expect((await about(token, "ORDER_PICKED_UP", "orderId", id))[0].data.name).toBe("Erumely Delivery");
    }
    await api.patch(`/api/deliveries/${id}/delay`).set(auth(partner)).send({ reason: "TRAFFIC", minutes: 30 });
    for (const token of [buyer, farmer]) {
      expect((await about(token, "ORDER_DELAYED", "orderId", id))[0].data).toMatchObject({ minutes: 30, reason: "TRAFFIC" });
    }
    await api.patch(`/api/deliveries/${id}/complete`).set(auth(partner));
    for (const token of [buyer, farmer]) expect(await about(token, "ORDER_DELIVERED", "orderId", id)).toHaveLength(1);

    // a review tells the farmer; a delivery rating tells the partner
    await api.post(`/api/orders/${id}/review`).set(auth(buyer)).send({ rating: 5 });
    await api.post(`/api/orders/${id}/partner-review`).set(auth(buyer)).send({ rating: 4 });
    expect((await about(farmer, "REVIEW_NEW", "orderId", id))[0].data).toMatchObject({ rating: 5, name: "Erumely" });
    expect((await about(partner, "PARTNER_REVIEW_NEW", "orderId", id))[0].data).toMatchObject({ rating: 4 });
  });

  it("tells partners again when a delivery is given back", async () => {
    const order = await place();
    await api.patch(`/api/orders/${order.id}/confirm`).set(auth(farmer));
    await api.patch(`/api/deliveries/${order.id}/accept`).set(auth(partner));
    await api.patch(`/api/deliveries/${order.id}/release`).set(auth(partner));
    expect(await about(partner, "DELIVERY_WAITING", "orderId", order.id)).toHaveLength(2);
  });

  it("tells the other side when an order is cancelled or rejected", async () => {
    const byBuyer = await place();
    await api.patch(`/api/orders/${byBuyer.id}/cancel`).set(auth(buyer));
    expect((await about(farmer, "ORDER_CANCELLED", "orderId", byBuyer.id))[0].data).toMatchObject({ by: "buyer", name: "Erumely Buyer" });
    expect(await about(buyer, "ORDER_CANCELLED", "orderId", byBuyer.id)).toHaveLength(0);

    const byFarmer = await place();
    await api.patch(`/api/orders/${byFarmer.id}/cancel`).set(auth(farmer));
    expect((await about(buyer, "ORDER_CANCELLED", "orderId", byFarmer.id))[0].data).toMatchObject({ by: "farmer", name: "Erumely Farmer" });
  });

  it("leaves no notice behind when the order fails", async () => {
    const listing = (await api.post("/api/listings").set(auth(farmer)).send({ produce_id: cabbageId, available_qty: 3 })).body;
    const before = (await inbox(farmer)).items.length;
    const res = await api.post("/api/orders").set(auth(buyer)).send({ items: [{ listing_id: listing.id, quantity: 999 }] });
    expect(res.status).toBe(400);
    expect((await inbox(farmer)).items.length).toBe(before);
  });
});

describe("warehouse booking notifications", () => {
  it("tells the owner about requests and the farmer about answers", async () => {
    const wh = (await createWarehouse(owner, { name: "Notice Store" })).body;
    const request = (kg = 50) =>
      api.post("/api/warehouse-bookings").set(auth(farmer)).send({
        warehouse_id: wh.id,
        quantity_kg: kg,
        start_date: dayFromToday(0),
        end_date: dayFromToday(3),
      });

    const accepted = (await request()).body;
    expect((await about(owner, "BOOKING_REQUESTED", "bookingId", accepted.id))[0].data).toMatchObject({ name: "Erumely Farmer", warehouse: "Notice Store" });

    await api.patch(`/api/warehouse-bookings/${accepted.id}/approve`).set(auth(owner));
    expect((await about(farmer, "BOOKING_APPROVED", "bookingId", accepted.id))[0].data.warehouse).toBe("Notice Store");

    // an extension: requested (owner hears), approved (farmer hears)
    await api.post(`/api/warehouse-bookings/${accepted.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(6) });
    expect((await about(owner, "EXTENSION_REQUESTED", "bookingId", accepted.id))[0].data.date).toBe(dayFromToday(6));
    await api.patch(`/api/warehouse-bookings/${accepted.id}/extension/approve`).set(auth(owner));
    expect((await about(farmer, "EXTENSION_APPROVED", "bookingId", accepted.id))[0].data.date).toBe(dayFromToday(6));

    // another extension that is declined
    await api.post(`/api/warehouse-bookings/${accepted.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(9) });
    await api.patch(`/api/warehouse-bookings/${accepted.id}/extension/reject`).set(auth(owner));
    expect((await about(farmer, "EXTENSION_REJECTED", "bookingId", accepted.id))[0].data.date).toBe(dayFromToday(9));

    // taking the produce out tells the owner, and so does a rating
    await api.patch(`/api/warehouse-bookings/${accepted.id}/release`).set(auth(farmer));
    expect(await about(owner, "BOOKING_RELEASED", "bookingId", accepted.id)).toHaveLength(1);
    await api.post(`/api/warehouse-bookings/${accepted.id}/review`).set(auth(farmer)).send({ rating: 4 });
    expect((await about(owner, "WAREHOUSE_REVIEW_NEW", "bookingId", accepted.id))[0].data).toMatchObject({ rating: 4, warehouse: "Notice Store" });

    // a declined request, with the reason, and a cancelled one
    const declined = (await request()).body;
    await api.patch(`/api/warehouse-bookings/${declined.id}/reject`).set(auth(owner)).send({ note: "Full that week" });
    expect((await about(farmer, "BOOKING_REJECTED", "bookingId", declined.id))[0].data.note).toBe("Full that week");

    const cancelled = (await request()).body;
    await api.patch(`/api/warehouse-bookings/${cancelled.id}/cancel`).set(auth(farmer));
    expect(await about(owner, "BOOKING_CANCELLED", "bookingId", cancelled.id)).toHaveLength(1);
  });

  it("leaves no notice behind when a request is refused", async () => {
    const wh = (await createWarehouse(owner, { name: "Small Store", total_capacity_kg: 10 })).body;
    const before = (await inbox(owner)).items.length;
    const res = await api.post("/api/warehouse-bookings").set(auth(farmer)).send({
      warehouse_id: wh.id,
      quantity_kg: 500,
      start_date: dayFromToday(1),
      end_date: dayFromToday(2),
    });
    expect(res.status).toBe(400);
    expect((await inbox(owner)).items.length).toBe(before);
  });
});

describe("reading notifications", () => {
  it("lists newest first with an unread count, and marks one or all as read", async () => {
    const order = await place();
    await place();

    const list = await inbox(farmer);
    expect(list.unread_count).toBeGreaterThanOrEqual(2);
    const dates = list.items.map((n) => new Date(n.created_at).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));

    const target = (await about(farmer, "ORDER_NEW", "orderId", order.id))[0];
    const after = await api.patch(`/api/notifications/${target.id}/read`).set(auth(farmer));
    expect(after.status).toBe(200);
    expect(after.body.unread_count).toBe(list.unread_count - 1);
    expect(after.body.items.find((n) => n.id === target.id).read_at).not.toBeNull();
    // marking it again changes nothing
    expect((await api.patch(`/api/notifications/${target.id}/read`).set(auth(farmer))).body.unread_count).toBe(list.unread_count - 1);

    const all = await api.post("/api/notifications/read-all").set(auth(farmer));
    expect(all.body.unread_count).toBe(0);
    expect(all.body.items.every((n) => n.read_at !== null)).toBe(true);
  });

  it("keeps everyone's notifications private", async () => {
    const order = await place();
    const mine = (await about(farmer, "ORDER_NEW", "orderId", order.id))[0];

    expect((await api.patch(`/api/notifications/${mine.id}/read`).set(auth(buyer))).status).toBe(404);
    expect((await inbox(buyer)).items.some((n) => n.id === mine.id)).toBe(false);
    expect((await api.get("/api/notifications")).status).toBe(401);
    expect((await api.get("/api/notifications?limit=0").set(auth(farmer))).status).toBe(400);
    expect((await inbox(farmer)).items.find((n) => n.id === mine.id).read_at).toBeNull(); // the buyer's attempt did nothing
  });
});
