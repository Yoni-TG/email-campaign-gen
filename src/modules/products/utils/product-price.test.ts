import { describe, expect, it } from "vitest";
import { formatPrice, isOnSale } from "./product-price";

describe("isOnSale", () => {
  it("is true when salePrice is set and differs from price", () => {
    expect(isOnSale({ price: "180", salePrice: "120" })).toBe(true);
  });

  it("is false when salePrice is empty (the feed's 'no sale' sentinel)", () => {
    expect(isOnSale({ price: "180", salePrice: "" })).toBe(false);
  });

  it("is false when salePrice equals price", () => {
    expect(isOnSale({ price: "180", salePrice: "180" })).toBe(false);
  });
});

describe("formatPrice", () => {
  it("prefixes currency before amount", () => {
    expect(formatPrice("120", "USD")).toBe("USD 120");
  });
});
