import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreativeSeed, DigestedProduct } from "@/lib/types";

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
    imageUrl: "https://cdn.theograce.com/p.jpg",
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

const HEART = makeProduct({
  sku: "SKU-001",
  name: "Heart Necklace",
  productType: ["Necklace"],
  reviewTier: "highly_reviewed",
  isOnSale: true,
  salePrice: "69.00",
  personalizationSummary: "1 inscription",
});
const CHARM = makeProduct({
  sku: "SKU-004",
  name: "Charm Necklace",
  productType: ["Necklace"],
  reviewTier: "well_reviewed",
});
const DATE_RING = makeProduct({
  sku: "SKU-003",
  name: "Date Ring",
  productType: ["Ring"],
  reviewTier: "highly_reviewed",
});

const FEED = [HEART, CHARM, DATE_RING];

type SelectionModule = typeof import("@/modules/products/services/product-selection");

let productSelection: SelectionModule;
let messagesCreate: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock("@/modules/products/services/product-feed", () => ({
    getCachedProducts: vi.fn(() => FEED),
    ensureFeedLoaded: vi.fn(async () => undefined),
    getProductBySku: vi.fn((sku: string) => FEED.find((p) => p.sku === sku)),
  }));

  messagesCreate = vi.fn().mockResolvedValue({
    content: [
      {
        type: "tool_use",
        name: "rank_products",
        input: { skus: ["SKU-001", "SKU-004"] },
      },
    ],
  });

  vi.doMock("@anthropic-ai/sdk", () => {
    class MockAnthropic {
      messages = { create: messagesCreate };
    }
    return { default: MockAnthropic };
  });

  productSelection = await import(
    "@/modules/products/services/product-selection"
  );
});

describe("selectProducts", () => {
  it("returns ProductSnapshot entries with derived fields preserved", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Valentine's Day gifts",
      includeSms: false,
    };
    const result = await productSelection.selectProducts(seed, "editorial", 10);

    expect(result.length).toBeGreaterThan(0);
    const first = result[0];
    expect(first.sku).toBe("SKU-001");
    expect(first.imageUrl).toContain("cdn.theograce.com");
    expect(first.priceTier).toBe("50_150");
    expect(first.reviewTier).toBe("highly_reviewed");
    expect(first.personalizationSummary).toBe("1 inscription");
  });

  it("calls the Anthropic messages.create tool-use endpoint when rerank is needed", async () => {
    messagesCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "rank_products",
          input: { skus: ["SKU-001"] },
        },
      ],
    });
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Valentine's Day gifts",
      includeSms: false,
    };
    // 2 necklaces, ask for 1 → forces rerank path
    await productSelection.selectProducts(seed, "editorial", 1);

    expect(messagesCreate).toHaveBeenCalledTimes(1);
    const call = messagesCreate.mock.calls[0][0];
    expect(call.tools).toBeDefined();
    expect(call.tools[0].name).toBe("rank_products");
    expect(call.tool_choice).toEqual({ type: "tool", name: "rank_products" });
  });

  it("prepends pinned SKUs in the requested order", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace", "Ring"],
      mainMessage: "Valentine's Day gifts",
      pinnedSkus: ["SKU-003"],
      includeSms: false,
    };
    const result = await productSelection.selectProducts(seed, "editorial", 10);

    expect(result[0].sku).toBe("SKU-003");
    // Pinned should not duplicate into LLM picks
    const uniqueSkus = new Set(result.map((p) => p.sku));
    expect(uniqueSkus.size).toBe(result.length);
  });

  it("skips the LLM rerank when candidates count <= requested count", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Valentine's",
      includeSms: false,
    };
    // Only 2 necklaces in FEED; ask for 10 — should bypass LLM.
    const result = await productSelection.selectProducts(seed, "editorial", 10);

    expect(messagesCreate).not.toHaveBeenCalled();
    const skus = result.map((p) => p.sku).sort();
    expect(skus).toEqual(["SKU-001", "SKU-004"]);
  });

  it("caps output at the requested count", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace", "Ring"],
      mainMessage: "Valentine's",
      pinnedSkus: ["SKU-003"],
      includeSms: false,
    };
    const result = await productSelection.selectProducts(seed, "editorial", 2);
    expect(result).toHaveLength(2);
    expect(result[0].sku).toBe("SKU-003");
  });

  it("falls back to top candidates if the tool response is missing", async () => {
    messagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "no tool call" }],
    });
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Valentine's",
      includeSms: false,
    };
    // Force LLM path by requesting fewer than candidates and providing 3 candidates in one category
    const manyNecklaces: DigestedProduct[] = [
      HEART,
      CHARM,
      makeProduct({
        sku: "SKU-EXTRA",
        name: "Extra",
        productType: ["Necklace"],
      }),
    ];
    vi.doMock("@/modules/products/services/product-feed", () => ({
      getCachedProducts: vi.fn(() => manyNecklaces),
      ensureFeedLoaded: vi.fn(async () => undefined),
      getProductBySku: vi.fn((sku: string) =>
        manyNecklaces.find((p) => p.sku === sku),
      ),
    }));
    vi.resetModules();
    const freshSelection = await import(
      "@/modules/products/services/product-selection"
    );

    const result = await freshSelection.selectProducts(seed, "editorial", 2);
    expect(result).toHaveLength(2);
  });
});
