import { afterAll, describe, expect, it } from "vitest";
import pool from "../src/db/pool.js";
import { api, auth, PHONES } from "./helpers.js";

afterAll(() => pool.end());

let counter = 0;
/** A fresh account for each test, so the demo accounts' passwords are never touched */
async function newUser(role = "BUYER") {
  const phone = `9000008${String(10 + counter++).padStart(3, "0")}`;
  const res = await api.post("/api/auth/register").send({
    name: "Account Tester",
    phone,
    password: "oldpassword1",
    role,
    region_id: 1,
    base_location: "Test Town",
  });
  expect(res.status).toBe(201);
  return { phone, token: res.body.token, id: res.body.user.id };
}

const login = (phone, password) => api.post("/api/auth/login").send({ phone, password });

describe("editing the profile", () => {
  it("changes the name and place, and nothing else", async () => {
    const user = await newUser();
    const res = await api
      .patch("/api/auth/me")
      .set(auth(user.token))
      .send({ name: "New Name", base_location: "New Place", phone: "9999999999", region_id: 2, role: "FARMER" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "New Name", base_location: "New Place", phone: user.phone, region_id: 1, role: "BUYER" });
    expect((await api.get("/api/auth/me").set(auth(user.token))).body.name).toBe("New Name");
  });

  it("can change one field at a time and rejects empty or bad input", async () => {
    const user = await newUser();
    const onlyName = await api.patch("/api/auth/me").set(auth(user.token)).send({ name: "Just Name" });
    expect(onlyName.body).toMatchObject({ name: "Just Name", base_location: "Test Town" });

    expect((await api.patch("/api/auth/me").set(auth(user.token)).send({})).status).toBe(400);
    expect((await api.patch("/api/auth/me").set(auth(user.token)).send({ name: "x" })).status).toBe(400);
    expect((await api.patch("/api/auth/me").send({ name: "Nobody" })).status).toBe(401);
  });
});

describe("changing the password", () => {
  it("refuses a wrong current password (as a 400, not a log-out) and an unchanged one", async () => {
    const user = await newUser();
    const change = (body) => api.post("/api/auth/change-password").set(auth(user.token)).send(body);

    const wrong = await change({ current_password: "notmypassword", new_password: "brandnew123" });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.message).toMatch(/current password is wrong/);

    expect((await change({ current_password: "oldpassword1", new_password: "oldpassword1" })).status).toBe(400);
    expect((await change({ current_password: "oldpassword1", new_password: "short" })).status).toBe(400);
    // nothing changed
    expect((await login(user.phone, "oldpassword1")).status).toBe(200);
  });

  it("sets the new password, returns a fresh login, and cuts off older logins", async () => {
    const user = await newUser();
    const done = await api
      .post("/api/auth/change-password")
      .set(auth(user.token))
      .send({ current_password: "oldpassword1", new_password: "brandnew123" });
    expect(done.status).toBe(200);
    expect(done.body.user.phone).toBe(user.phone);

    expect((await login(user.phone, "oldpassword1")).status).toBe(401);
    expect((await login(user.phone, "brandnew123")).status).toBe(200);

    // the login returned by the change keeps working and renewing; the one from before cannot renew
    expect((await api.get("/api/auth/me").set(auth(done.body.token))).status).toBe(200);
    expect((await api.post("/api/auth/refresh").set(auth(done.body.token))).status).toBe(200);
    const old = await api.post("/api/auth/refresh").set(auth(user.token));
    expect(old.status).toBe(401);
    expect(old.body.error.message).toMatch(/password was changed/);
  });
});

describe("forgot password", () => {
  const forgot = (phone) => api.post("/api/auth/forgot-password").send({ phone });
  const reset = (phone, code, new_password = "resetpass123") =>
    api.post("/api/auth/reset-password").send({ phone, code, new_password });

  it("answers the same for a phone with no account, and gives no code", async () => {
    const user = await newUser();
    const known = await forgot(user.phone);
    const unknown = await forgot("9000000012");
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body.message).toBe(known.body.message);
    expect(unknown.body.dev_code).toBeUndefined();
    expect(known.body.dev_code).toMatch(/^\d{6}$/); // shown in development and tests only
    expect((await api.post("/api/auth/forgot-password").send({ phone: "123" })).status).toBe(400);
  });

  it("resets the password with the right code, once, and signs out older logins", async () => {
    const user = await newUser();
    const { dev_code } = (await forgot(user.phone)).body;

    expect((await reset(user.phone, dev_code, "short")).status).toBe(400); // password rules still apply
    const done = await reset(user.phone, dev_code);
    expect(done.status).toBe(200);

    expect((await login(user.phone, "oldpassword1")).status).toBe(401);
    expect((await login(user.phone, "resetpass123")).status).toBe(200);
    expect((await api.post("/api/auth/refresh").set(auth(user.token))).status).toBe(401);

    // a code works once
    const again = await reset(user.phone, dev_code, "anotherpass123");
    expect(again.status).toBe(400);
    expect(again.body.error.message).toMatch(/wrong or has expired/);
  });

  it("refuses a wrong code, an unknown phone and an expired code with the same message", async () => {
    const user = await newUser();
    const { dev_code } = (await forgot(user.phone)).body;
    const wrongCode = dev_code === "000000" ? "111111" : "000000";

    const wrong = await reset(user.phone, wrongCode);
    const unknownPhone = await reset("9000000013", dev_code);
    expect(wrong.status).toBe(400);
    expect(unknownPhone.status).toBe(400);
    expect(unknownPhone.body.error.message).toBe(wrong.body.error.message);

    await pool.query("UPDATE password_resets SET expires_at = NOW() - INTERVAL '1 minute' WHERE user_id = $1", [user.id]);
    const expired = await reset(user.phone, dev_code);
    expect(expired.status).toBe(400);
    expect(expired.body.error.message).toBe(wrong.body.error.message);
    expect((await login(user.phone, "oldpassword1")).status).toBe(200); // password untouched
  });

  it("locks a code after 5 wrong tries, even for the right code", async () => {
    const user = await newUser();
    const { dev_code } = (await forgot(user.phone)).body;
    const wrongCode = dev_code === "000000" ? "111111" : "000000";

    for (let i = 0; i < 5; i++) expect((await reset(user.phone, wrongCode)).status).toBe(400);
    expect((await reset(user.phone, dev_code)).status).toBe(400);
    expect((await login(user.phone, "oldpassword1")).status).toBe(200);
  });

  it("lets a newer code replace the older one", async () => {
    const user = await newUser();
    const first = (await forgot(user.phone)).body.dev_code;
    let second = (await forgot(user.phone)).body.dev_code;
    // two random codes can be equal; ask again so the test is not flaky
    while (second === first) second = (await forgot(user.phone)).body.dev_code;

    expect((await reset(user.phone, first)).status).toBe(400);
    expect((await reset(user.phone, second)).status).toBe(200);
  });

  it("works for the demo accounts without changing their password", async () => {
    // only asks for a code; never completes the reset
    const res = await forgot(PHONES.farmer);
    expect(res.status).toBe(200);
    expect((await login(PHONES.farmer, "AgriChain@123")).status).toBe(200);
  });
});
