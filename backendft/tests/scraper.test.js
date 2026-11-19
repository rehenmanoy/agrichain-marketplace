import { describe, expect, it } from "vitest";
import { findPriceInHtml } from "../src/modules/produce/marketPrice.scraper.js";

// Same row layout as vegetablemarketprice.com: image, name, price, retail range, unit
const html = `
  <table class="table">
    <tr><th></th><th>Vegetable</th><th>Price</th><th>Retail Price</th><th>Units</th></tr>
    <tr><td><img></td><td>Sweet Potato</td><td>₹45</td><td>₹50 - 59</td><td>1kg</td></tr>
    <tr><td><img></td><td>Potato</td><td>₹31</td><td>₹34 - 40</td><td>1kg</td></tr>
    <tr><td><img></td><td>Cluster beans</td><td>₹49</td><td>₹54 - 64</td><td>1kg</td></tr>
    <tr><td><img></td><td> Lemon   (Lime) </td><td>₹82.5</td><td>₹90 - 107</td><td>1kg</td></tr>
  </table>`;

describe("findPriceInHtml", () => {
  it("matches the whole name, not part of another item's name", () => {
    expect(findPriceInHtml(html, "Potato")).toBe(31);
    expect(findPriceInHtml(html, "Sweet Potato")).toBe(45);
  });

  it("ignores case and extra spaces, and reads decimals", () => {
    expect(findPriceInHtml(html, "lemon (lime)")).toBe(82.5);
  });

  it("returns null when the item isn't listed", () => {
    expect(findPriceInHtml(html, "Beans")).toBeNull();
    expect(findPriceInHtml(html, "1")).toBeNull();
  });
});
