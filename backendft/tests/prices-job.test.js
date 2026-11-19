import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import pool from "../src/db/pool.js";
import { refreshAllPrices } from "../src/modules/produce/marketPrice.service.js";
import { clearPageCache, scrapeMarketPrice } from "../src/modules/produce/marketPrice.scraper.js";

// Pretend the site lists Tomato and Mango only
vi.mock("../src/modules/produce/marketPrice.scraper.js", () => ({
  scrapeMarketPrice: vi.fn(),
  clearPageCache: vi.fn(),
}));

const SITE = { Tomato: 30, Mango: 90 };

async function todayPrice(name) {
  const res = await pool.query(
    `SELECT ph.market_price FROM price_history ph JOIN produce p ON p.id = ph.produce_id
     WHERE p.name = $1 AND ph.date = CURRENT_DATE`,
    [name],
  );
  return res.rows[0]?.market_price ?? null;
}

beforeEach(() => {
  vi.mocked(scrapeMarketPrice).mockImplementation(async (name) => SITE[name] ?? null);
  vi.mocked(clearPageCache).mockClear();
});

afterAll(() => pool.end());

describe("daily market price fetch", () => {
  it("stores today's price for every item the site lists", async () => {
    const result = await refreshAllPrices({ force: true });

    expect(await todayPrice("Tomato")).toBe(30);
    expect(await todayPrice("Mango")).toBe(90);
    expect(result.updated).toBeGreaterThanOrEqual(2);
    expect(result.notListed).toBeGreaterThan(0);
    expect(clearPageCache).toHaveBeenCalledOnce();
  });

  it("overwrites today's prices on the scheduled run", async () => {
    SITE.Tomato = 35;
    await refreshAllPrices({ force: true });
    expect(await todayPrice("Tomato")).toBe(35);
  });

  it("only fills in missing prices on the startup catch-up", async () => {
    SITE.Tomato = 99;
    const result = await refreshAllPrices({ force: false });

    expect(await todayPrice("Tomato")).toBe(35);
    expect(result.skipped).toBeGreaterThanOrEqual(2);
    expect(clearPageCache).not.toHaveBeenCalled();
  });
});
