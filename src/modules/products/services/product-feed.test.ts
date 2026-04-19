import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FeedProduct } from "@/lib/types";

const MOCK_RAW_FEED: FeedProduct[] = [
  {
    sku: "SKU-001",
    name: "Heart Necklace",
    product_type: ["Necklace"],
    shop_for: ["Women"],
    occasion: ["Valentine's Day"],
    collection: ["Hearts"],
    material: ["Sterling Silver"],
    metal_color: "Silver",
    stock_status: "In Stock",
    is_active: "Yes",
    price: "89.00",
    sale_price: "89.00",
    currency: "USD",
    link: "https://www.theograce.com/products/heart-necklace",
    image_url: "https://cdn.theograce.com/digital-asset/products/heart-necklace-1.jpg",
    review_count: "120",
    review_rate: "4.8",
  },
  {
    sku: "SKU-002",
    name: "Name Bracelet",
    product_type: ["Bracelet"],
    shop_for: ["Women"],
    occasion: [],
    collection: [],
    material: ["Gold Plated"],
    metal_color: "Gold",
    stock_status: "Out of Stock",
    is_active: "Yes",
    price: "79.00",
    sale_price: "59.00",
    currency: "USD",
    link: "https://www.theograce.com/products/name-bracelet",
    image_url: "https://cdn.theograce.com/digital-asset/products/name-bracelet-1.jpg",
    review_count: "45",
    review_rate: "4.5",
  },
  {
    sku: "SKU-003",
    name: "Date Ring",
    product_type: ["Ring"],
    shop_for: ["Women", "Men"],
    occasion: ["Anniversary"],
    collection: [],
    material: ["Rose Gold Plated"],
    metal_color: "Rose",
    stock_status: "In Stock",
    is_active: "Yes",
    price: "100.00",
    sale_price: "80.00",
    currency: "USD",
    link: "https://www.theograce.com/products/date-ring",
    image_url: "https://cdn.theograce.com/digital-asset/products/date-ring-1.jpg",
    review_count: "200",
    review_rate: "4.9",
  },
];

type ProductFeedModule = typeof import("@/modules/products/services/product-feed");

let productFeed: ProductFeedModule;
const originalFetch = globalThis.fetch;

beforeEach(async () => {
  vi.resetModules();

  // Default each test to "remote" mode with a populated URL.
  // Individual describes override for local-source tests.
  process.env.PRODUCT_FEED_URL =
    "https://static.myka.com/us-east-1/imported-feeds/51/email-marketing.json";
  delete process.env.PRODUCT_FEED_SOURCE;
  delete process.env.PRODUCT_FEED_LOCAL_PATH;

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => MOCK_RAW_FEED,
  }) as unknown as typeof fetch;

  productFeed = await import("@/modules/products/services/product-feed");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("refreshFeed (remote)", () => {
  it("fetches JSON from PRODUCT_FEED_URL and digests it", async () => {
    const products = await productFeed.refreshFeed();
    // SKU-002 is out of stock — filtered by digestion
    expect(products).toHaveLength(2);
    expect(products.find((p) => p.sku === "SKU-002")).toBeUndefined();
  });

  it("applies derived fields from digestion", async () => {
    const products = await productFeed.refreshFeed();
    const heart = products.find((p) => p.sku === "SKU-001")!;
    expect(heart.priceTier).toBe("50_150");
    expect(heart.reviewTier).toBe("highly_reviewed");
    expect(heart.isClearance).toBe(false);
  });

  it("throws a descriptive error when fetch returns non-ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    }) as unknown as typeof fetch;

    await expect(productFeed.refreshFeed()).rejects.toThrow(
      /Feed fetch failed.*503/,
    );
  });

  it("throws when PRODUCT_FEED_SOURCE=remote but URL is missing", async () => {
    vi.resetModules();
    process.env.PRODUCT_FEED_SOURCE = "remote";
    delete process.env.PRODUCT_FEED_URL;
    const freshModule = await import(
      "@/modules/products/services/product-feed"
    );
    await expect(freshModule.refreshFeed()).rejects.toThrow(
      /PRODUCT_FEED_URL/,
    );
  });

  it("populates the cache and lastLoadedAt after refresh", async () => {
    expect(productFeed.getCachedProducts()).toHaveLength(0);
    expect(productFeed.getFeedLastLoadedAt()).toBeNull();
    await productFeed.refreshFeed();
    expect(productFeed.getCachedProducts()).toHaveLength(2);
    expect(productFeed.getFeedLastLoadedAt()).toBeInstanceOf(Date);
    expect(productFeed.getFeedLastLoadedFrom()).toBe("remote");
  });
});

describe("ensureFeedLoaded", () => {
  it("loads the feed when cache is empty", async () => {
    expect(productFeed.getCachedProducts()).toHaveLength(0);
    await productFeed.ensureFeedLoaded();
    expect(productFeed.getCachedProducts()).toHaveLength(2);
  });

  it("does not reload when cache is already populated", async () => {
    await productFeed.refreshFeed();
    const firstLoadedAt = productFeed.getFeedLastLoadedAt();
    await productFeed.ensureFeedLoaded();
    expect(productFeed.getFeedLastLoadedAt()).toBe(firstLoadedAt);
  });
});

describe("getDistinctCategories", () => {
  it("returns unique product types across digested products", async () => {
    await productFeed.refreshFeed();
    const categories = productFeed.getDistinctCategories();
    expect(categories).toEqual(expect.arrayContaining(["Necklace", "Ring"]));
    // Bracelet (SKU-002) was filtered as OOS — not in digested products
    expect(categories).not.toContain("Bracelet");
  });

  it("returns sorted categories", async () => {
    await productFeed.refreshFeed();
    const categories = productFeed.getDistinctCategories();
    expect(categories).toEqual([...categories].sort());
  });

  it("returns empty array when cache is empty", () => {
    expect(productFeed.getDistinctCategories()).toEqual([]);
  });
});

describe("searchProducts", () => {
  beforeEach(async () => {
    await productFeed.refreshFeed();
  });

  it("finds products by name", () => {
    const results = productFeed.searchProducts("heart");
    expect(results).toHaveLength(1);
    expect(results[0].sku).toBe("SKU-001");
  });

  it("finds products by SKU", () => {
    const results = productFeed.searchProducts("SKU-003");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Date Ring");
  });

  it("is case insensitive", () => {
    expect(productFeed.searchProducts("HEART")).toHaveLength(1);
  });

  it("respects the limit parameter", () => {
    const results = productFeed.searchProducts("e", 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe("getProductBySku", () => {
  beforeEach(async () => {
    await productFeed.refreshFeed();
  });

  it("returns the product with an exact SKU match", () => {
    expect(productFeed.getProductBySku("SKU-001")?.name).toBe("Heart Necklace");
  });

  it("returns undefined for unknown SKU", () => {
    expect(productFeed.getProductBySku("SKU-999")).toBeUndefined();
  });
});

describe("resolveFeedSource", () => {
  it("honors PRODUCT_FEED_SOURCE=local", () => {
    process.env.PRODUCT_FEED_SOURCE = "local";
    expect(productFeed.resolveFeedSource()).toBe("local");
  });

  it("honors PRODUCT_FEED_SOURCE=remote", () => {
    process.env.PRODUCT_FEED_SOURCE = "remote";
    expect(productFeed.resolveFeedSource()).toBe("remote");
  });

  it("defaults to remote when PRODUCT_FEED_URL is set", () => {
    delete process.env.PRODUCT_FEED_SOURCE;
    process.env.PRODUCT_FEED_URL = "https://example.com/feed.json";
    expect(productFeed.resolveFeedSource()).toBe("remote");
  });

  it("defaults to local when PRODUCT_FEED_URL is unset", () => {
    delete process.env.PRODUCT_FEED_SOURCE;
    delete process.env.PRODUCT_FEED_URL;
    expect(productFeed.resolveFeedSource()).toBe("local");
  });

  it("is case insensitive", () => {
    process.env.PRODUCT_FEED_SOURCE = "LOCAL";
    expect(productFeed.resolveFeedSource()).toBe("local");
  });
});

describe("refreshFeed (local source)", () => {
  it("reads from PRODUCT_FEED_LOCAL_PATH and digests", async () => {
    process.env.PRODUCT_FEED_SOURCE = "local";
    process.env.PRODUCT_FEED_LOCAL_PATH =
      "data/product-feed.fixture.sample.json";

    const products = await productFeed.refreshFeed();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].sku).toMatch(/^SAMPLE/);
    expect(productFeed.getFeedLastLoadedFrom()).toBe("local");
  });

  it("throws a descriptive error when the local file does not exist", async () => {
    process.env.PRODUCT_FEED_SOURCE = "local";
    process.env.PRODUCT_FEED_LOCAL_PATH = "data/nope.json";

    await expect(productFeed.refreshFeed()).rejects.toThrow(
      /Failed to read local product feed/,
    );
  });
});
