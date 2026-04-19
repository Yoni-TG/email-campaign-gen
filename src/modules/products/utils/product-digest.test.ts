import { describe, it, expect } from "vitest";
import {
  derivePriceTier,
  deriveReviewTier,
  derivePrimaryLanguage,
  derivePersonalizationSummary,
  digestProduct,
  digestFeed,
} from "@/modules/products/utils/product-digest";
import type { FeedProduct } from "@/lib/types";

describe("derivePriceTier", () => {
  it("returns under_50 for prices below 50", () => {
    expect(derivePriceTier("49.99")).toBe("under_50");
    expect(derivePriceTier("25.00")).toBe("under_50");
    expect(derivePriceTier("0")).toBe("under_50");
  });
  it("returns 50_150 for prices 50-149.99", () => {
    expect(derivePriceTier("50.00")).toBe("50_150");
    expect(derivePriceTier("149.99")).toBe("50_150");
  });
  it("returns 150_500 for prices 150-499.99", () => {
    expect(derivePriceTier("150.00")).toBe("150_500");
    expect(derivePriceTier("499.99")).toBe("150_500");
  });
  it("returns 500_plus for prices 500 and above", () => {
    expect(derivePriceTier("500.00")).toBe("500_plus");
    expect(derivePriceTier("1200.00")).toBe("500_plus");
  });
  it("falls back to under_50 for malformed inputs", () => {
    expect(derivePriceTier("")).toBe("under_50");
    expect(derivePriceTier("not a number")).toBe("under_50");
  });
});

describe("deriveReviewTier", () => {
  it("returns highly_reviewed for count>50 and rate>4.5", () => {
    expect(deriveReviewTier("100", "4.8")).toBe("highly_reviewed");
    expect(deriveReviewTier("51", "4.6")).toBe("highly_reviewed");
  });
  it("returns well_reviewed for count>10 and rate>4 (but not highly)", () => {
    expect(deriveReviewTier("20", "4.2")).toBe("well_reviewed");
    expect(deriveReviewTier("60", "4.1")).toBe("well_reviewed");
  });
  it("returns null when neither threshold is met", () => {
    expect(deriveReviewTier("5", "4.9")).toBeNull();
    expect(deriveReviewTier("100", "3.5")).toBeNull();
  });
  it("returns null for missing or malformed inputs", () => {
    expect(deriveReviewTier("", "")).toBeNull();
    expect(deriveReviewTier("abc", "xyz")).toBeNull();
  });
});

describe("derivePrimaryLanguage", () => {
  it("detects Arabic", () => {
    expect(derivePrimaryLanguage(["Hearts", "Arabic"])).toBe("arabic");
  });
  it("detects Non-Latin", () => {
    expect(derivePrimaryLanguage(["Non-Latin", "Summer"])).toBe("non_latin");
  });
  it("detects Non-English", () => {
    expect(derivePrimaryLanguage(["Non-English"])).toBe("non_english");
  });
  it("defaults to english when no language tag is present", () => {
    expect(derivePrimaryLanguage(["Hearts", "Summer"])).toBe("english");
    expect(derivePrimaryLanguage([])).toBe("english");
  });
  it("matches tags case-insensitively", () => {
    expect(derivePrimaryLanguage(["ARABIC"])).toBe("arabic");
  });
});

describe("derivePersonalizationSummary", () => {
  it("combines inscriptions and birthstone", () => {
    expect(
      derivePersonalizationSummary(
        ["1 Inscription"],
        ["Sterling Silver", "Birthstones"],
        "YES",
      ),
    ).toBe("1 inscription + birthstone");
  });
  it("picks the maximum count across multiple inscription options", () => {
    expect(
      derivePersonalizationSummary(
        ["1 Inscription", "2 Inscriptions"],
        [],
        "YES",
      ),
    ).toBe("2 inscriptions");
  });
  it("returns birthstone only when no inscriptions", () => {
    expect(
      derivePersonalizationSummary([], ["Birthstones"], "YES"),
    ).toBe("birthstone");
  });
  it("falls back to personalizable when only has_perosnalization is YES", () => {
    expect(derivePersonalizationSummary([], ["Sterling Silver"], "YES")).toBe(
      "personalizable",
    );
  });
  it("returns null when no personalization signals", () => {
    expect(
      derivePersonalizationSummary([], ["Sterling Silver"], "NO"),
    ).toBeNull();
    expect(
      derivePersonalizationSummary([], ["Sterling Silver"], undefined),
    ).toBeNull();
  });
});

describe("digestProduct", () => {
  const baseFeedProduct: FeedProduct = {
    sku: "SKU-001",
    name: "Heart Necklace",
    product_type: ["Necklace"],
    product_type_singular: "Necklaces",
    shop_for: ["Women"],
    occasion: ["Valentine's Day"],
    collection: ["Hearts", "Clearance"],
    material: ["Sterling Silver", "Birthstones"],
    metal_color: "Silver",
    has_perosnalization: "YES",
    num_of_inscriptions: ["1 Inscription"],
    stock_status: "In Stock",
    is_active: "Yes",
    price: "89.00",
    sale_price: "69.00",
    currency: "USD",
    link: "https://www.theograce.com/products/heart-necklace",
    image_url: "https://cdn.theograce.com/digital-asset/products/heart-necklace-1.jpg",
    review_count: "120",
    review_rate: "4.8",
  };

  it("returns null for out-of-stock products", () => {
    expect(
      digestProduct({ ...baseFeedProduct, stock_status: "Out of Stock" }),
    ).toBeNull();
  });

  it("returns null for inactive products", () => {
    expect(digestProduct({ ...baseFeedProduct, is_active: "No" })).toBeNull();
  });

  it("produces a DigestedProduct with all derived fields", () => {
    const result = digestProduct(baseFeedProduct)!;
    expect(result).not.toBeNull();
    expect(result.sku).toBe("SKU-001");
    expect(result.priceTier).toBe("50_150");
    expect(result.isOnSale).toBe(true);
    expect(result.reviewTier).toBe("highly_reviewed");
    expect(result.personalizationSummary).toBe("1 inscription + birthstone");
  });

  it("uses image_url from the feed when present", () => {
    const result = digestProduct(baseFeedProduct)!;
    expect(result.imageUrl).toBe(baseFeedProduct.image_url);
  });

  it("derives image URL from link when feed image_url is missing", () => {
    const result = digestProduct({ ...baseFeedProduct, image_url: "" })!;
    expect(result.imageUrl).toContain("cdn.theograce.com");
  });

  it("removes Clearance from collection and promotes to isClearance", () => {
    const result = digestProduct(baseFeedProduct)!;
    expect(result.collection).not.toContain("Clearance");
    expect(result.collection).toContain("Hearts");
    expect(result.isClearance).toBe(true);
  });

  it("sets isClearance false when Clearance is absent", () => {
    const result = digestProduct({
      ...baseFeedProduct,
      collection: ["Hearts"],
    })!;
    expect(result.isClearance).toBe(false);
  });

  it("handles missing optional fields gracefully", () => {
    const minimal: FeedProduct = {
      sku: "SKU-MIN",
      name: "Minimal",
      product_type: ["Ring"],
      shop_for: [],
      occasion: [],
      collection: [],
      material: [],
      metal_color: "",
      stock_status: "In Stock",
      is_active: "Yes",
      price: "100.00",
      sale_price: "100.00",
      currency: "USD",
      link: "https://www.theograce.com/products/minimal",
      image_url: "",
      review_count: "0",
      review_rate: "0",
    };
    const result = digestProduct(minimal)!;
    expect(result).not.toBeNull();
    expect(result.isOnSale).toBe(false);
    expect(result.reviewTier).toBeNull();
    expect(result.personalizationSummary).toBeNull();
    expect(result.primaryLanguage).toBe("english");
    expect(result.isClearance).toBe(false);
  });
});

describe("digestFeed", () => {
  const active: FeedProduct = {
    sku: "A",
    name: "A",
    product_type: ["Ring"],
    shop_for: [],
    occasion: [],
    collection: [],
    material: [],
    metal_color: "",
    stock_status: "In Stock",
    is_active: "Yes",
    price: "100.00",
    sale_price: "100.00",
    currency: "USD",
    link: "https://www.theograce.com/products/a",
    image_url: "",
    review_count: "0",
    review_rate: "0",
  };
  const oos: FeedProduct = {
    ...active,
    sku: "B",
    stock_status: "Out of Stock",
  };
  const inactive: FeedProduct = { ...active, sku: "C", is_active: "No" };

  it("drops filtered-out products", () => {
    const result = digestFeed([active, oos, inactive]);
    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe("A");
  });

  it("returns empty array for empty input", () => {
    expect(digestFeed([])).toEqual([]);
  });
});
