import { describe, it, expect } from "vitest";
import { filterProducts } from "@/modules/products/utils/product-filter";
import type { DigestedProduct } from "@/lib/types";

function makeProduct(overrides: Partial<DigestedProduct>): DigestedProduct {
  return {
    sku: "SKU-000",
    name: "Product",
    description: "",
    productType: ["Necklace"],
    shopFor: ["Women"],
    occasion: [],
    collection: [],
    material: [],
    metalColor: "",
    price: "100.00",
    salePrice: "100.00",
    currency: "USD",
    link: "https://www.theograce.com/products/product",
    imageUrl: "",
    reviewCount: "0",
    reviewRate: "0",
    priceTier: "50_150",
    isOnSale: false,
    isClearance: false,
    primaryLanguage: "english",
    reviewTier: null,
    personalizationSummary: null,
    ...overrides,
  };
}

const NECKLACE = makeProduct({ sku: "NEC", productType: ["Necklace"] });
const NECKLACE_SALE = makeProduct({
  sku: "NEC-SALE",
  productType: ["Necklace"],
  price: "100.00",
  salePrice: "60.00",
  isOnSale: true,
});
const NECKLACE_BIG_SALE = makeProduct({
  sku: "NEC-BIG",
  productType: ["Necklace"],
  price: "200.00",
  salePrice: "100.00",
  isOnSale: true,
});
const RING = makeProduct({ sku: "RING", productType: ["Ring"] });
const NECKLACE_HIGHLY = makeProduct({
  sku: "NEC-HIGH",
  productType: ["Necklace"],
  reviewTier: "highly_reviewed",
});
const NECKLACE_WELL = makeProduct({
  sku: "NEC-WELL",
  productType: ["Necklace"],
  reviewTier: "well_reviewed",
});

describe("filterProducts", () => {
  it("filters by matching product type (case-insensitive)", () => {
    const result = filterProducts([NECKLACE, RING], {
      categories: ["NECKLACE"],
      campaignType: "editorial",
    });
    expect(result.map((p) => p.sku)).toEqual(["NEC"]);
  });

  it("keeps products matching any of multiple categories", () => {
    const result = filterProducts([NECKLACE, RING], {
      categories: ["Necklace", "Ring"],
      campaignType: "editorial",
    });
    expect(result).toHaveLength(2);
  });

  it("for sale_promo, drops products not on sale", () => {
    const result = filterProducts([NECKLACE, NECKLACE_SALE], {
      categories: ["Necklace"],
      campaignType: "sale_promo",
    });
    expect(result.map((p) => p.sku)).toEqual(["NEC-SALE"]);
  });

  it("for sale_promo, sorts by discount descending", () => {
    const result = filterProducts(
      [NECKLACE_SALE, NECKLACE_BIG_SALE],
      { categories: ["Necklace"], campaignType: "sale_promo" },
    );
    expect(result.map((p) => p.sku)).toEqual(["NEC-BIG", "NEC-SALE"]);
  });

  it("for collection_spotlight, sorts highly_reviewed first, then well_reviewed", () => {
    const result = filterProducts(
      [NECKLACE, NECKLACE_WELL, NECKLACE_HIGHLY],
      { categories: ["Necklace"], campaignType: "collection_spotlight" },
    );
    expect(result.map((p) => p.sku)).toEqual([
      "NEC-HIGH",
      "NEC-WELL",
      "NEC",
    ]);
  });

  it("removes pinned SKUs from the candidate pool", () => {
    const result = filterProducts([NECKLACE, NECKLACE_SALE], {
      categories: ["Necklace"],
      campaignType: "editorial",
      pinnedSkus: ["NEC"],
    });
    expect(result.map((p) => p.sku)).toEqual(["NEC-SALE"]);
  });

  it("caps candidates at maxCandidates (default 50)", () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      makeProduct({ sku: `SKU-${i}`, productType: ["Necklace"] }),
    );
    const result = filterProducts(many, {
      categories: ["Necklace"],
      campaignType: "editorial",
    });
    expect(result).toHaveLength(50);
  });

  it("respects a custom maxCandidates value", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      makeProduct({ sku: `SKU-${i}`, productType: ["Necklace"] }),
    );
    const result = filterProducts(many, {
      categories: ["Necklace"],
      campaignType: "editorial",
      maxCandidates: 10,
    });
    expect(result).toHaveLength(10);
  });

  it("returns empty array when no category matches", () => {
    const result = filterProducts([NECKLACE, RING], {
      categories: ["Bracelet"],
      campaignType: "editorial",
    });
    expect(result).toEqual([]);
  });

  describe("audience filter", () => {
    const MENS = makeProduct({
      sku: "NEC-MEN",
      productType: ["Necklace"],
      shopFor: ["Men"],
    });
    const WOMENS = makeProduct({
      sku: "NEC-WOMEN",
      productType: ["Necklace"],
      shopFor: ["Women", "Mother"],
    });
    const UNISEX = makeProduct({
      sku: "NEC-UNI",
      productType: ["Necklace"],
      shopFor: ["Men", "Women"],
    });
    const UNTAGGED = makeProduct({
      sku: "NEC-UNTAGGED",
      productType: ["Necklace"],
      shopFor: [],
    });

    it("keeps products with any audience overlap", () => {
      const result = filterProducts([MENS, WOMENS, UNISEX], {
        categories: ["Necklace"],
        campaignType: "editorial",
        audience: ["Men"],
      });
      expect(result.map((p) => p.sku).sort()).toEqual([
        "NEC-MEN",
        "NEC-UNI",
      ]);
    });

    it("OR-matches across multiple audience values", () => {
      const result = filterProducts([MENS, WOMENS, UNISEX], {
        categories: ["Necklace"],
        campaignType: "editorial",
        audience: ["Men", "Mother"],
      });
      expect(result.map((p) => p.sku).sort()).toEqual([
        "NEC-MEN",
        "NEC-UNI",
        "NEC-WOMEN",
      ]);
    });

    it("drops products with empty shop_for when audience is set", () => {
      const result = filterProducts([MENS, UNTAGGED], {
        categories: ["Necklace"],
        campaignType: "editorial",
        audience: ["Men"],
      });
      expect(result.map((p) => p.sku)).toEqual(["NEC-MEN"]);
    });

    it("keeps products with empty shop_for when audience is unset", () => {
      const result = filterProducts([MENS, UNTAGGED], {
        categories: ["Necklace"],
        campaignType: "editorial",
      });
      expect(result.map((p) => p.sku).sort()).toEqual([
        "NEC-MEN",
        "NEC-UNTAGGED",
      ]);
    });

    it("treats empty audience array as no filter", () => {
      const result = filterProducts([MENS, WOMENS, UNTAGGED], {
        categories: ["Necklace"],
        campaignType: "editorial",
        audience: [],
      });
      expect(result).toHaveLength(3);
    });
  });
});
