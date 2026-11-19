import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, createWarehouse, dayFromToday, fakePng, login, PHONES } from "./helpers.js";

let farmer, otherFarmer, owner, otherOwner, buyer, partner;

async function register(role, phone, regionId = 1) {
  const res = await api.post("/api/auth/register").send({
    name: `WH ${role}`,
    phone,
    password: "supersecret",
    role,
    region_id: regionId,
    base_location: "Test Town",
  });
  expect(res.status).toBe(201);
  return res.body.token;
}

beforeAll(async () => {
  [farmer, otherFarmer, owner, buyer, partner] = await Promise.all([
    login(PHONES.farmer),
    login(PHONES.otherFarmer),
    login(PHONES.owner),
    login(PHONES.buyer),
    login(PHONES.partner),
  ]);
  otherOwner = await register("WAREHOUSE_OWNER", "9000000661");
});

afterAll(() => pool.end());

const newWarehouse = async (fields) => {
  const res = await createWarehouse(owner, fields);
  expect(res.status).toBe(201);
  return res.body;
};
const request = (warehouse, quantity_kg, start, end, token = farmer) =>
  api.post("/api/warehouse-bookings").set(auth(token)).send({
    warehouse_id: warehouse.id,
    quantity_kg,
    start_date: dayFromToday(start),
    end_date: dayFromToday(end),
  });
const approve = (booking, token = owner) => api.patch(`/api/warehouse-bookings/${booking.id}/approve`).set(auth(token));
const setDates = (booking, start, end) =>
  pool.query("UPDATE warehouse_bookings SET start_date = $1, end_date = $2 WHERE id = $3", [
    dayFromToday(start),
    dayFromToday(end),
    booking.id,
  ]);
const myBooking = async (booking, token = farmer) =>
  (await api.get("/api/warehouse-bookings/mine").set(auth(token))).body.find((b) => b.id === booking.id);
const freeKg = async (warehouse, from, to) =>
  (await api.get(`/api/warehouses/${warehouse.id}/availability?from=${dayFromToday(from)}&to=${dayFromToday(to)}`).set(auth(farmer)))
    .body.free_kg;

describe("warehouse photos", () => {
  it("needs at least 2 photos and refuses anything that is not a real image", async () => {
    expect((await createWarehouse(owner, {}, { photos: 0 })).status).toBe(400);
    const one = await createWarehouse(owner, {}, { photos: 1 });
    expect(one.status).toBe(400);
    expect(one.body.error.message).toMatch(/at least 2 photos/);

    // text pretending to be a picture
    const fake = await api
      .post("/api/warehouses")
      .set(auth(owner))
      .field("name", "Fake")
      .field("location", "Road")
      .field("total_capacity_kg", "100")
      .field("price_per_kg_per_day", "1")
      .attach("photos", Buffer.from("just some text"), { filename: "a.png", contentType: "image/png" })
      .attach("photos", fakePng(), { filename: "b.png", contentType: "image/png" });
    expect(fake.status).toBe(400);
    expect(fake.body.error.message).toMatch(/JPEG, PNG or WebP/);

    // nothing was created
    const mine = (await api.get("/api/warehouses/mine").set(auth(owner))).body;
    expect(mine.some((w) => w.name === "Fake")).toBe(false);
  });

  it("refuses a photo over 5 MB and a sixth photo", async () => {
    const big = await api
      .post("/api/warehouses")
      .set(auth(owner))
      .field("name", "Big")
      .field("location", "Road")
      .field("total_capacity_kg", "100")
      .field("price_per_kg_per_day", "1")
      .attach("photos", Buffer.concat([fakePng(), Buffer.alloc(5 * 1024 * 1024)]), { filename: "big.png", contentType: "image/png" })
      .attach("photos", fakePng(), { filename: "b.png", contentType: "image/png" });
    expect(big.status).toBe(400);
    expect(big.body.error.message).toMatch(/5 MB/);

    expect((await createWarehouse(owner, {}, { photos: 6 })).status).toBe(400);
  });

  it("creates a warehouse in the owner's region with photos that can be viewed", async () => {
    const warehouse = await newWarehouse({ name: "Photo Store", is_cold_storage: true });
    expect(warehouse).toMatchObject({ region_id: 1, is_cold_storage: true, is_active: true, available_capacity_kg: 500 });
    expect(warehouse.photos).toHaveLength(2);
    expect(warehouse.photos[0].url).toMatch(/^\/uploads\/warehouses\/.+\.png$/);

    const image = await api.get(warehouse.photos[0].url);
    expect(image.status).toBe(200);
    expect(image.headers["cross-origin-resource-policy"]).toBe("cross-origin");

    const browse = (await api.get("/api/warehouses?region_id=1")).body.find((w) => w.id === warehouse.id);
    expect(browse.photos).toHaveLength(2);
  });

  it("adds photos up to 5 and never lets a warehouse drop below 2", async () => {
    const warehouse = await newWarehouse();
    const add = (count) => {
      let req = api.post(`/api/warehouses/${warehouse.id}/photos`).set(auth(owner));
      for (let i = 0; i < count; i++) req = req.attach("photos", fakePng(), { filename: `x${i}.png`, contentType: "image/png" });
      return req;
    };

    expect((await add(4)).status).toBe(400); // 2 + 4 is more than 5
    const added = await add(1);
    expect(added.status).toBe(201);
    expect(added.body.photos).toHaveLength(3);

    const [first] = added.body.photos;
    const removed = await api.delete(`/api/warehouses/${warehouse.id}/photos/${first.id}`).set(auth(owner));
    expect(removed.status).toBe(200);
    expect(removed.body.photos).toHaveLength(2);
    expect((await api.get(first.url)).status).toBe(404); // the file is gone too

    const [last] = removed.body.photos;
    const tooFew = await api.delete(`/api/warehouses/${warehouse.id}/photos/${last.id}`).set(auth(owner));
    expect(tooFew.status).toBe(400);
    expect(tooFew.body.error.message).toMatch(/at least 2 photos/);

    // only the owner can change photos
    expect((await api.delete(`/api/warehouses/${warehouse.id}/photos/${last.id}`).set(auth(otherOwner))).status).toBe(403);
  });
});

describe("changing, pausing and removing a warehouse", () => {
  it("lets only its owner change it", async () => {
    const warehouse = await newWarehouse();
    const edit = { price_per_kg_per_day: 4, total_capacity_kg: 800, name: "Renamed" };

    const done = await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send(edit);
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({ price_per_kg_per_day: 4, total_capacity_kg: 800, name: "Renamed" });
    expect(done.body.available_capacity_kg).toBe(800);

    expect((await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(otherOwner)).send(edit)).status).toBe(403);
    expect((await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(farmer)).send(edit)).status).toBe(403);
    expect((await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({})).status).toBe(400);
  });

  it("refuses to cut space below what is booked or requested", async () => {
    const warehouse = await newWarehouse();
    await request(warehouse, 300, 3, 6); // still only a request: it holds space already

    const cut = await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({ total_capacity_kg: 200 });
    expect(cut.status).toBe(400);
    expect(cut.body.error.message).toMatch(/300 kg/);

    const ok = await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({ total_capacity_kg: 300 });
    expect(ok.status).toBe(200);
  });

  it("can't be paused or removed while it has open bookings, and can be once it has none", async () => {
    const warehouse = await newWarehouse();
    const booking = (await request(warehouse, 50, 2, 4)).body;

    const pause = await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({ is_active: false });
    expect(pause.status).toBe(409);
    expect(pause.body.error.message).toMatch(/open bookings/);
    expect((await api.delete(`/api/warehouses/${warehouse.id}`).set(auth(owner))).status).toBe(409);

    await api.patch(`/api/warehouse-bookings/${booking.id}/reject`).set(auth(owner)).send({ note: "Closed for repairs" });

    const paused = await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({ is_active: false });
    expect(paused.status).toBe(200);
    expect(paused.body.is_active).toBe(false);
    // a paused warehouse is hidden from farmers and refuses requests
    expect((await api.get("/api/warehouses?region_id=1")).body.some((w) => w.id === warehouse.id)).toBe(false);
    expect((await request(warehouse, 10, 2, 3)).status).toBe(400);

    const reopened = await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({ is_active: true });
    expect(reopened.body.is_active).toBe(true);

    expect((await api.delete(`/api/warehouses/${warehouse.id}`).set(auth(otherOwner))).status).toBe(403);
    expect((await api.delete(`/api/warehouses/${warehouse.id}`).set(auth(owner))).status).toBe(204);

    // gone from every list, but the declined request keeps its history
    expect((await api.get(`/api/warehouses/${warehouse.id}`)).status).toBe(404);
    expect((await api.get("/api/warehouses/mine").set(auth(owner))).body.some((w) => w.id === warehouse.id)).toBe(false);
    const history = (await api.get("/api/warehouse-bookings/incoming?status=REJECTED").set(auth(owner))).body;
    expect(history.find((b) => b.id === booking.id)).toMatchObject({ decision_note: "Closed for repairs" });
  });
});

describe("requesting, approving and cancelling", () => {
  it("makes a request that the owner approves, priced for every day counted inclusively", async () => {
    const warehouse = await newWarehouse({ price_per_kg_per_day: 3 });
    const res = await request(warehouse, 100, 10, 24); // 15 days
    expect(res.status).toBe(201);
    // 15 days × 100 kg × ₹3
    expect(res.body).toMatchObject({ status: "REQUESTED", amount_to_pay: 4500, rate_per_kg_per_day: 3, is_overdue: false });
    expect(res.body.owner_phone).toBe(PHONES.owner);

    // a change of price afterwards does not touch the booking
    await api.patch(`/api/warehouses/${warehouse.id}`).set(auth(owner)).send({ price_per_kg_per_day: 9 });
    expect((await myBooking(res.body)).amount_to_pay).toBe(4500);

    expect((await approve(res.body, otherOwner)).status).toBe(403);
    expect((await approve(res.body, farmer)).status).toBe(403);
    const approved = await approve(res.body);
    expect(approved.body).toMatchObject({ status: "ACTIVE" });
    expect(approved.body.decided_at).toBeTruthy();
    expect((await approve(res.body)).status).toBe(400); // already answered
  });

  it("counts a same-day booking as one day", async () => {
    const warehouse = await newWarehouse({ price_per_kg_per_day: 2 });
    const res = await request(warehouse, 10, 1, 1);
    expect(res.body.amount_to_pay).toBe(20);
  });

  it("lets the owner decline with a reason and the farmer see it", async () => {
    const warehouse = await newWarehouse();
    const booking = (await request(warehouse, 100, 2, 5)).body;
    expect(await freeKg(warehouse, 2, 5)).toBe(400);

    const declined = await api
      .patch(`/api/warehouse-bookings/${booking.id}/reject`)
      .set(auth(owner))
      .send({ note: "No room for onions" });
    expect(declined.body).toMatchObject({ status: "REJECTED", decision_note: "No room for onions" });
    expect(await freeKg(warehouse, 2, 5)).toBe(500); // the space is free again
    expect((await myBooking(booking)).decision_note).toBe("No room for onions");
  });

  it("lets the farmer cancel a request, and an approved booking that has not started", async () => {
    const warehouse = await newWarehouse();
    const waiting = (await request(warehouse, 100, 2, 5)).body;
    const cancelled = await api.patch(`/api/warehouse-bookings/${waiting.id}/cancel`).set(auth(farmer));
    expect(cancelled.body.status).toBe("CANCELLED");
    expect((await api.patch(`/api/warehouse-bookings/${waiting.id}/cancel`).set(auth(farmer))).status).toBe(400);

    const later = (await request(warehouse, 100, 5, 8)).body;
    await approve(later);
    const dropped = await api.patch(`/api/warehouse-bookings/${later.id}/cancel`).set(auth(farmer));
    expect(dropped.body).toMatchObject({ status: "CANCELLED", amount_to_pay: 0 });

    expect((await api.patch(`/api/warehouse-bookings/${later.id}/cancel`).set(auth(otherFarmer))).status).toBe(403);
    expect(await freeKg(warehouse, 2, 8)).toBe(500);
  });

  it("only lets farmers in the warehouse's region request, and only farmers", async () => {
    const warehouse = await newWarehouse();
    expect((await request(warehouse, 10, 2, 3, otherFarmer)).status).toBe(400);
    expect((await request(warehouse, 10, 2, 3, buyer)).status).toBe(403);
    expect((await request(warehouse, 10, 2, 3, owner)).status).toBe(403);
    expect((await request(warehouse, 10, -2, 3)).status).toBe(400); // starts in the past
    expect((await api.post("/api/warehouse-bookings").set(auth(farmer)).send({
      warehouse_id: warehouse.id,
      quantity_kg: 10,
      start_date: dayFromToday(1),
      end_date: dayFromToday(400),
    })).status).toBe(400); // longer than a year
  });

  it("shows owners only the bookings at their own warehouses", async () => {
    const warehouse = await newWarehouse();
    const booking = (await request(warehouse, 10, 2, 3)).body;
    const mine = (await api.get("/api/warehouse-bookings/incoming").set(auth(owner))).body;
    expect(mine.some((b) => b.id === booking.id)).toBe(true);
    const theirs = (await api.get("/api/warehouse-bookings/incoming").set(auth(otherOwner))).body;
    expect(theirs.some((b) => b.id === booking.id)).toBe(false);
  });
});

describe("space is checked for every day", () => {
  it("lets bookings share a warehouse on different dates and refuses overlaps", async () => {
    const warehouse = await newWarehouse({ total_capacity_kg: 500 });
    expect((await request(warehouse, 400, 1, 5)).status).toBe(201);

    const overlap = await request(warehouse, 200, 3, 8);
    expect(overlap.status).toBe(400);
    expect(overlap.body.error.message).toMatch(/Available: 100 kg/);

    expect((await request(warehouse, 200, 6, 10)).status).toBe(201); // no common day
    expect((await request(warehouse, 100, 1, 5)).status).toBe(201); // exactly fills it

    expect(await freeKg(warehouse, 1, 5)).toBe(0);
    expect(await freeKg(warehouse, 6, 10)).toBe(300);
    expect(await freeKg(warehouse, 1, 10)).toBe(0); // the fullest day decides
  });

  it("holds space for a request that is waiting, and frees it when declined", async () => {
    const warehouse = await newWarehouse({ total_capacity_kg: 300 });
    const first = (await request(warehouse, 300, 2, 4)).body;
    expect((await request(warehouse, 10, 3, 3)).status).toBe(400);

    await api.patch(`/api/warehouse-bookings/${first.id}/reject`).set(auth(owner)).send({});
    expect((await request(warehouse, 10, 3, 3)).status).toBe(201);
  });
});

describe("releasing, overdue bookings and extensions", () => {
  /** An approved booking whose dates are moved around so it is in progress, or overdue */
  async function approvedBooking(warehouse, kg, start, end) {
    const booking = (await request(warehouse, kg, 1, 2)).body;
    await approve(booking);
    await setDates(booking, start, end);
    return booking;
  }

  it("charges only the days used when released early", async () => {
    const warehouse = await newWarehouse({ price_per_kg_per_day: 2 });
    const booking = await approvedBooking(warehouse, 100, -4, 5); // planned for 10 days, 4 already used

    const released = await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(farmer));
    // started 4 days ago, so today is day 5: 5 × 100 kg × ₹2
    expect(released.body).toMatchObject({ status: "RELEASED", amount_to_pay: 1000, end_date: dayFromToday(0) });
    expect(await freeKg(warehouse, 0, 5)).toBe(500);
    expect((await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(farmer))).status).toBe(400);
  });

  it("sends a booking that has not started to cancel instead of release", async () => {
    const warehouse = await newWarehouse();
    const booking = (await request(warehouse, 10, 3, 5)).body;
    await approve(booking);
    expect((await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(farmer))).status).toBe(400);
    expect((await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(otherFarmer))).status).toBe(403);
  });

  it("marks a booking overdue, keeps the space held and keeps charging until released", async () => {
    const warehouse = await newWarehouse({ price_per_kg_per_day: 2, total_capacity_kg: 500 });
    const booking = await approvedBooking(warehouse, 200, -10, -3);

    const overdue = await myBooking(booking);
    expect(overdue).toMatchObject({ status: "ACTIVE", is_overdue: true, overdue_days: 3 });
    // charged from the start through today: 11 days × 200 kg × ₹2, not just the 8 days booked
    expect(overdue.amount_to_pay).toBe(4400);

    // the space is still taken, today and in the future
    expect(await freeKg(warehouse, 0, 0)).toBe(300);
    expect(await freeKg(warehouse, 20, 25)).toBe(300);
    expect((await request(warehouse, 400, 5, 6)).status).toBe(400);

    const dashboard = (await api.get("/api/dashboard").set(auth(owner))).body;
    expect(dashboard.overdue_bookings).toBeGreaterThanOrEqual(1);

    const released = await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(farmer));
    expect(released.body).toMatchObject({ status: "RELEASED", is_overdue: false, amount_to_pay: 4400 });
    expect(await freeKg(warehouse, 20, 25)).toBe(500);
  });

  it("extends a booking when the owner approves, and recalculates the amount", async () => {
    const warehouse = await newWarehouse({ price_per_kg_per_day: 2 });
    const booking = await approvedBooking(warehouse, 100, -2, 3); // 6 days

    const asked = await api.post(`/api/warehouse-bookings/${booking.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(10) });
    expect(asked.status).toBe(201);
    expect(asked.body.extension).toMatchObject({ status: "PENDING", new_end_date: dayFromToday(10) });
    expect(asked.body.end_date).toBe(dayFromToday(3)); // not changed until the owner agrees

    // the extra days are held while it waits
    expect(await freeKg(warehouse, 8, 10)).toBe(400);
    expect((await api.post(`/api/warehouse-bookings/${booking.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(12) })).status).toBe(409);

    expect((await api.patch(`/api/warehouse-bookings/${booking.id}/extension/approve`).set(auth(otherOwner))).status).toBe(403);
    expect((await api.patch(`/api/warehouse-bookings/${booking.id}/extension/approve`).set(auth(farmer))).status).toBe(403);

    const approved = await api.patch(`/api/warehouse-bookings/${booking.id}/extension/approve`).set(auth(owner));
    expect(approved.body.extension.status).toBe("APPROVED");
    // 13 days (2 days ago to 10 days ahead) × 100 kg × ₹2
    expect(approved.body).toMatchObject({ end_date: dayFromToday(10), amount_to_pay: 2600 });
    expect((await api.patch(`/api/warehouse-bookings/${booking.id}/extension/approve`).set(auth(owner))).status).toBe(404);
  });

  it("lets an overdue booking be extended, and be declined or withdrawn", async () => {
    const warehouse = await newWarehouse({ price_per_kg_per_day: 1 });
    const booking = await approvedBooking(warehouse, 50, -8, -2);
    expect((await myBooking(booking)).is_overdue).toBe(true);

    const send = (date) =>
      api.post(`/api/warehouse-bookings/${booking.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(date) });
    expect((await send(-3)).status).toBe(400); // not after the current end date
    expect((await send(-1)).status).toBe(400); // in the past

    expect((await send(4)).status).toBe(201);
    const declined = await api.patch(`/api/warehouse-bookings/${booking.id}/extension/reject`).set(auth(owner));
    expect(declined.body.extension.status).toBe("REJECTED");
    expect(declined.body.is_overdue).toBe(true); // still overdue after a no

    expect((await send(5)).status).toBe(201);
    const withdrawn = await api.patch(`/api/warehouse-bookings/${booking.id}/extension/cancel`).set(auth(farmer));
    expect(withdrawn.body.extension.status).toBe("CANCELLED");

    expect((await send(6)).status).toBe(201);
    await api.patch(`/api/warehouse-bookings/${booking.id}/extension/approve`).set(auth(owner));
    const renewed = await myBooking(booking);
    expect(renewed).toMatchObject({ end_date: dayFromToday(6), is_overdue: false });
    // 15 days (8 ago to 6 ahead) × 50 kg × ₹1
    expect(renewed.amount_to_pay).toBe(750);
  });

  it("refuses an extension when someone else needs the space", async () => {
    const warehouse = await newWarehouse({ total_capacity_kg: 300 });
    const booking = await approvedBooking(warehouse, 200, -1, 2);
    expect((await request(warehouse, 200, 5, 9, otherFarmer)).status).toBe(400); // other region, ignored
    const rival = (await api.post("/api/warehouse-bookings").set(auth(farmer)).send({
      warehouse_id: warehouse.id,
      quantity_kg: 200,
      start_date: dayFromToday(5),
      end_date: dayFromToday(9),
    })).body;
    expect(rival.status).toBe("REQUESTED");

    const res = await api.post(`/api/warehouse-bookings/${booking.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(7) });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Available: 100 kg/);
  });

  it("closes a waiting extension when the booking is released", async () => {
    const warehouse = await newWarehouse();
    const booking = await approvedBooking(warehouse, 20, -1, 1);
    await api.post(`/api/warehouse-bookings/${booking.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(5) });
    const released = await api.patch(`/api/warehouse-bookings/${booking.id}/release`).set(auth(farmer));
    expect(released.body.extension.status).toBe("CANCELLED");
  });
});

describe("owner dashboard", () => {
  it("counts waiting requests, extension requests and space in use", async () => {
    const warehouse = await newWarehouse({ total_capacity_kg: 1000 });
    const before = (await api.get("/api/dashboard").set(auth(owner))).body;

    const booking = (await request(warehouse, 100, 0, 3)).body;
    const mid = (await api.get("/api/dashboard").set(auth(owner))).body;
    expect(mid.pending_requests).toBe(before.pending_requests + 1);
    expect(mid.used_capacity_kg).toBe(before.used_capacity_kg + 100); // waiting requests hold space

    await approve(booking);
    await api.post(`/api/warehouse-bookings/${booking.id}/extend`).set(auth(farmer)).send({ new_end_date: dayFromToday(6) });
    const after = (await api.get("/api/dashboard").set(auth(owner))).body;
    expect(after.role).toBe("WAREHOUSE_OWNER");
    expect(after.pending_requests).toBe(before.pending_requests);
    expect(after.active_bookings).toBe(before.active_bookings + 1);
    expect(after.pending_extensions).toBe(before.pending_extensions + 1);
    expect(after.booking_revenue).toBeGreaterThan(before.booking_revenue);

    expect((await api.get("/api/dashboard").set(auth(partner))).body.role).toBe("DELIVERY_PARTNER");
  });
});
