import jwt from "jsonwebtoken";
import { afterAll, describe, expect, it } from "vitest";
import { env } from "../src/config/env.js";
import pool from "../src/db/pool.js";
import { api, auth, login, PHONES } from "./helpers.js";

afterAll(() => pool.end());

describe("auth", () => {
  it("registers a new user and returns a token", async () => {
    const res = await api.post("/api/auth/register").send({
      name: "New Farmer",
      phone: "9000000001",
      password: "supersecret",
      role: "FARMER",
      region_id: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user).toMatchObject({ name: "New Farmer", role: "FARMER", region_id: 1 });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("rejects a duplicate phone number", async () => {
    const res = await api.post("/api/auth/register").send({
      name: "Copy",
      phone: PHONES.farmer,
      password: "supersecret",
      role: "BUYER",
      region_id: 1,
    });
    expect(res.status).toBe(409);
  });

  it("returns field errors for invalid input", async () => {
    const res = await api.post("/api/auth/register").send({ phone: "123", role: "ADMIN" });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["name", "phone", "password", "role"]));
  });

  it("rejects a wrong password", async () => {
    const res = await api.post("/api/auth/login").send({ phone: PHONES.farmer, password: "nope" });
    expect(res.status).toBe(401);
  });

  it("returns the current user from /me", async () => {
    const token = await login(PHONES.buyer);
    const res = await api.get("/api/auth/me").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ phone: PHONES.buyer, role: "BUYER", region_name: "Erumely" });
  });

  it("requires a valid token on protected routes", async () => {
    expect((await api.get("/api/auth/me")).status).toBe(401);
    expect((await api.get("/api/auth/me").set(auth("garbage"))).status).toBe(401);
  });

  describe("refreshing a session", () => {
    const decode = (token) => jwt.decode(token);
    const tokenWith = async (phone, claims, expiresIn = "1h") => {
      const session = await login(phone);
      const me = (await api.get("/api/auth/me").set(auth(session))).body;
      return jwt.sign({ role: me.role, region_id: me.region_id, ...claims }, env.jwtSecret, {
        subject: String(me.id),
        expiresIn,
      });
    };

    it("gives a working new token for the same user and keeps the original login time", async () => {
      const loginTime = Math.floor(Date.now() / 1000) - 3600; // logged in an hour ago
      const old = await tokenWith(PHONES.buyer, { auth_time: loginTime }, "2h");

      const res = await api.post("/api/auth/refresh").set(auth(old));
      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ phone: PHONES.buyer, role: "BUYER" });
      expect(decode(res.body.token).auth_time).toBe(loginTime);
      // a fresh lifetime starting now, not the old token's remaining time
      expect(decode(res.body.token).exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(decode(res.body.token).iat).toBeGreaterThanOrEqual(decode(old).iat);

      expect((await api.get("/api/auth/me").set(auth(res.body.token))).status).toBe(200);
    });

    it("stamps the login time on new tokens", async () => {
      const token = await login(PHONES.buyer);
      expect(Math.abs(decode(token).auth_time - Math.floor(Date.now() / 1000))).toBeLessThan(5);
    });

    it("refuses an expired or missing token", async () => {
      const expired = await tokenWith(PHONES.buyer, { auth_time: Math.floor(Date.now() / 1000) }, -10);
      expect((await api.post("/api/auth/refresh").set(auth(expired))).status).toBe(401);
      expect((await api.post("/api/auth/refresh")).status).toBe(401);
    });

    it("refuses to extend a login that is older than the session limit", async () => {
      const tooOld = Math.floor(Date.now() / 1000) - (env.sessionMaxHours * 3600 + 60);
      const token = await tokenWith(PHONES.buyer, { auth_time: tooOld });
      const res = await api.post("/api/auth/refresh").set(auth(token));
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/log in again/);
    });

    it("refuses when the account no longer exists", async () => {
      const signup = await api.post("/api/auth/register").send({
        name: "Gone Soon",
        phone: "9000000555",
        password: "supersecret",
        role: "BUYER",
        region_id: 1,
        base_location: "Nowhere",
      });
      expect((await api.post("/api/auth/refresh").set(auth(signup.body.token))).status).toBe(200);

      await pool.query("DELETE FROM users WHERE phone = $1", ["9000000555"]);
      expect((await api.post("/api/auth/refresh").set(auth(signup.body.token))).status).toBe(401);
    });
  });

  it("blocks the wrong role", async () => {
    const token = await login(PHONES.buyer);
    const res = await api.post("/api/listings").set(auth(token)).send({ produce_id: 1, available_qty: 5 });
    expect(res.status).toBe(403);
  });
});
