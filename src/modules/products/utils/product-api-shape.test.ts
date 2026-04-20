import { describe, expect, it } from "vitest";
import { toProductSnapshot } from "./product-api-shape";
import type { DigestedProduct } from "@/lib/types";

const base: DigestedProduct = {
  sku: "SKU-1",
  name: "Initial Necklace",
  description: "",
  productType: ["Necklaces"],
  shopFor: ["For Her"],
  occasion: ["Mother's Day"],
  collection: ["Mom"],
  material: ["14k Gold"],
  metalColor: "gold",
  price: "180",
  salePrice: "120",
  currency: "USD",
  link: "https://theograce.com/products/initial-necklace",
  imageUrl: "https://cdn.theograce.com/digital-asset/product/initial-necklace-1.jpg?w=750",
  reviewCount: "128",
  reviewRate: "4.8",

  priceTier: "50_150",
  isOnSale: true,
  isClearance: false,
  primaryLanguage: "english",
  reviewTier: "well_reviewed",
  personalizationSummary: "1 inscription, up to 10 chars",
};

describe("toProductSnapshot", () => {
  it("projects the snapshot-facing fields from a digested product", () => {
    expect(toProductSnapshot(base)).toEqual({
      sku: "SKU-1",
      name: "Initial Necklace",
      imageUrl: base.imageUrl,
      price: "180",
      salePrice: "120",
      currency: "USD",
      link: base.link,
      productType: ["Necklaces"],
      priceTier: "50_150",
      isOnSale: true,
      reviewTier: "well_reviewed",
      personalizationSummary: "1 inscription, up to 10 chars",
    });
  });

  it("drops non-snapshot fields (description, shopFor, metalColor, isClearance, etc.)", () => {
    const snap = toProductSnapshot(base);
    expect(snap).not.toHaveProperty("description");
    expect(snap).not.toHaveProperty("shopFor");
    expect(snap).not.toHaveProperty("occasion");
    expect(snap).not.toHaveProperty("collection");
    expect(snap).not.toHaveProperty("material");
    expect(snap).not.toHaveProperty("metalColor");
    expect(snap).not.toHaveProperty("reviewCount");
    expect(snap).not.toHaveProperty("reviewRate");
    expect(snap).not.toHaveProperty("isClearance");
    expect(snap).not.toHaveProperty("primaryLanguage");
  });

  it("preserves null/empty snapshot fields as-is", () => {
    const snap = toProductSnapshot({
      ...base,
      salePrice: "",
      reviewTier: null,
      personalizationSummary: null,
      isOnSale: false,
    });
    expect(snap.salePrice).toBe("");
    expect(snap.reviewTier).toBeNull();
    expect(snap.personalizationSummary).toBeNull();
    expect(snap.isOnSale).toBe(false);
  });
});
