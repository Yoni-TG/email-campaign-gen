import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreativeSeed, DigestedProduct } from "@/lib/types";

function makeSeed(overrides: Partial<CreativeSeed>): CreativeSeed {
  return {
    targetCategories: ["Necklace"],
    mainMessage: "Valentine's Day gifts",
    includeSms: false,
    leadValue: "joy",
    leadPersonalities: ["joyfully_characterful"],
    ...overrides,
  };
}

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
    const seed = makeSeed({ mainMessage: "Valentine's Day gifts" });
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
    const seed = makeSeed({ mainMessage: "Valentine's Day gifts" });
    // 2 necklaces, ask for 1 → forces rerank path
    await productSelection.selectProducts(seed, "editorial", 1);

    expect(messagesCreate).toHaveBeenCalledTimes(1);
    const call = messagesCreate.mock.calls[0][0];
    expect(call.tools).toBeDefined();
    expect(call.tools[0].name).toBe("rank_products");
    expect(call.tool_choice).toEqual({ type: "tool", name: "rank_products" });
  });

  it("prepends pinned SKUs in the requested order", async () => {
    const seed = makeSeed({
      targetCategories: ["Necklace", "Ring"],
      mainMessage: "Valentine's Day gifts",
      pinnedSkus: ["SKU-003"],
    });
    const result = await productSelection.selectProducts(seed, "editorial", 10);

    expect(result[0].sku).toBe("SKU-003");
    // Pinned should not duplicate into LLM picks
    const uniqueSkus = new Set(result.map((p) => p.sku));
    expect(uniqueSkus.size).toBe(result.length);
  });

  it("skips the LLM rerank when candidates count <= requested count", async () => {
    const seed = makeSeed({ mainMessage: "Valentine's" });
    // Only 2 necklaces in FEED; ask for 10 — should bypass LLM.
    const result = await productSelection.selectProducts(seed, "editorial", 10);

    expect(messagesCreate).not.toHaveBeenCalled();
    const skus = result.map((p) => p.sku).sort();
    expect(skus).toEqual(["SKU-001", "SKU-004"]);
  });

  it("caps output at the requested count", async () => {
    const seed = makeSeed({
      targetCategories: ["Necklace", "Ring"],
      mainMessage: "Valentine's",
      pinnedSkus: ["SKU-003"],
    });
    const result = await productSelection.selectProducts(seed, "editorial", 2);
    expect(result).toHaveLength(2);
    expect(result[0].sku).toBe("SKU-003");
  });

  it("falls back to top candidates if the tool response is missing", async () => {
    messagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "no tool call" }],
    });
    const seed = makeSeed({ mainMessage: "Valentine's" });
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

  describe("validation + retry", () => {
    async function withFeed(
      feed: DigestedProduct[],
    ): Promise<typeof productSelection> {
      vi.doMock("@/modules/products/services/product-feed", () => ({
        getCachedProducts: vi.fn(() => feed),
        ensureFeedLoaded: vi.fn(async () => undefined),
        getProductBySku: vi.fn((sku: string) =>
          feed.find((p) => p.sku === sku),
        ),
      }));
      vi.resetModules();
      return import("@/modules/products/services/product-selection");
    }

    it("retries once when the LLM returns SKUs not in the candidate list", async () => {
      const feed = [
        HEART,
        CHARM,
        makeProduct({
          sku: "SKU-VALID",
          name: "Valid",
          productType: ["Necklace"],
        }),
      ];
      // First call: hallucinated SKU. Second call: valid.
      messagesCreate
        .mockResolvedValueOnce({
          content: [
            {
              type: "tool_use",
              name: "rank_products",
              input: { skus: ["SKU-HALLUCINATED-001", "SKU-VALID"] },
            },
          ],
        })
        .mockResolvedValueOnce({
          content: [
            {
              type: "tool_use",
              name: "rank_products",
              input: { skus: ["SKU-VALID", "SKU-001"] },
            },
          ],
        });

      const fresh = await withFeed(feed);
      const seed = makeSeed({ mainMessage: "valid" });
      const result = await fresh.selectProducts(seed, "editorial", 2);

      expect(messagesCreate).toHaveBeenCalledTimes(2);
      expect(result.map((p) => p.sku).sort()).toEqual(["SKU-001", "SKU-VALID"]);

      // The retry payload must include the previous (bad) tool_use + a
      // tool_result error citing the invalid SKUs, so the model has the
      // context it needs to correct.
      const retryCall = messagesCreate.mock.calls[1][0];
      const retryMessages = retryCall.messages as Array<{
        role: string;
        content: unknown;
      }>;
      expect(retryMessages).toHaveLength(3);
      expect(retryMessages[1].role).toBe("assistant");
      expect(retryMessages[2].role).toBe("user");
      const lastContent = retryMessages[2].content as Array<{
        type: string;
        is_error?: boolean;
        content?: string;
      }>;
      expect(lastContent[0].is_error).toBe(true);
      expect(lastContent[0].content).toContain("SKU-HALLUCINATED-001");
    });

    it("does not retry when all SKUs are valid", async () => {
      const fresh = await withFeed([HEART, CHARM]);
      const seed = makeSeed({ mainMessage: "Valentine's" });
      // 2 candidates, ask for 1 → forces rerank path
      messagesCreate.mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            name: "rank_products",
            input: { skus: ["SKU-001"] },
          },
        ],
      });
      await fresh.selectProducts(seed, "editorial", 1);
      expect(messagesCreate).toHaveBeenCalledTimes(1);
    });

    it("does not silently fall back to the full feed for hallucinated SKUs", async () => {
      // Catalog has a product not in the candidate pool (different category).
      // Even after retry, the LLM keeps hallucinating it. The strict filter
      // must drop it rather than re-fetching it via getProductBySku.
      const feed = [
        HEART,
        CHARM,
        makeProduct({
          sku: "RING-001",
          name: "Ring",
          productType: ["Ring"],
        }),
      ];
      messagesCreate.mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "rank_products",
            input: { skus: ["RING-001"] },
          },
        ],
      });

      const fresh = await withFeed(feed);
      const seed = makeSeed({
        targetCategories: ["Necklace"],
        mainMessage: "Necklaces",
      });
      const result = await fresh.selectProducts(seed, "editorial", 1);

      // RING-001 is not a Necklace candidate; it must NOT appear in result.
      expect(result.map((p) => p.sku)).not.toContain("RING-001");
    });

    it("backfills from deterministic order when retry still comes up short", async () => {
      const feed = [
        HEART,
        CHARM,
        makeProduct({
          sku: "SKU-FILL-A",
          name: "Filler A",
          productType: ["Necklace"],
        }),
      ];
      // First + retry: both return only one valid SKU. Service should
      // backfill from candidate order to honor count=3.
      messagesCreate.mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "rank_products",
            input: { skus: ["SKU-001"] },
          },
        ],
      });

      const fresh = await withFeed(feed);
      const seed = makeSeed({ mainMessage: "anything" });
      const result = await fresh.selectProducts(seed, "editorial", 3);

      expect(result).toHaveLength(3);
      // SKU-001 is the LLM pick; the rest come from candidate order.
      expect(result[0].sku).toBe("SKU-001");
    });
  });
});
