import { describe, it, expect } from "vitest";
import {
  buildRerankSystemPrompt,
  buildRerankUserPrompt,
  toProductSummary,
} from "@/modules/products/utils/product-rerank-prompt";
import type { CreativeSeed, DigestedProduct } from "@/lib/types";

const digested: DigestedProduct = {
  sku: "SKU-001",
  name: "Heart Necklace",
  description: "Lorem ipsum dolor sit amet ".repeat(40),
  productType: ["Necklace"],
  shopFor: ["Women"],
  occasion: ["Valentine's Day"],
  collection: ["Hearts"],
  material: ["Sterling Silver", "Birthstones"],
  metalColor: "Silver",
  price: "89.00",
  salePrice: "69.00",
  currency: "USD",
  link: "https://www.theograce.com/products/heart-necklace",
  imageUrl: "https://cdn.theograce.com/heart-necklace.jpg",
  reviewCount: "120",
  reviewRate: "4.8",
  priceTier: "50_150",
  isOnSale: true,
  isClearance: false,
  primaryLanguage: "english",
  reviewTier: "highly_reviewed",
  personalizationSummary: "1 inscription + birthstone",
};

const seed: CreativeSeed = {
  targetCategories: ["Necklace"],
  mainMessage: "Valentine's Day gifts",
  secondaryMessage: "Show her how you feel",
  promoDetails: "20% off with code LOVE",
  additionalNotes: "Keep it warm and personal",
  includeSms: false,
};

describe("toProductSummary", () => {
  it("returns a compact shape the LLM can reason about", () => {
    const summary = toProductSummary(digested);
    expect(summary.sku).toBe("SKU-001");
    expect(summary.name).toBe("Heart Necklace");
    expect(summary.priceTier).toBe("50_150");
    expect(summary.reviewTier).toBe("highly_reviewed");
    expect(summary.personalizationSummary).toBe(
      "1 inscription + birthstone",
    );
  });

  it("truncates description to 200 chars", () => {
    const summary = toProductSummary(digested);
    expect(summary.description.length).toBeLessThanOrEqual(200);
  });

  it("omits imageUrl and link and raw review counts to save tokens", () => {
    const summary = toProductSummary(digested) as Record<string, unknown>;
    expect(summary.imageUrl).toBeUndefined();
    expect(summary.link).toBeUndefined();
    expect(summary.reviewCount).toBeUndefined();
    expect(summary.reviewRate).toBeUndefined();
  });
});

describe("buildRerankSystemPrompt", () => {
  it("mentions Theo Grace and the merchandiser role", () => {
    const system = buildRerankSystemPrompt();
    expect(system).toMatch(/Theo Grace/);
    expect(system).toMatch(/merchandis/i);
  });

  it("lists the ranking criteria (theme, audience, social proof, price mix, personalization)", () => {
    const system = buildRerankSystemPrompt();
    expect(system).toMatch(/theme|message/i);
    expect(system).toMatch(/audience|shopFor/i);
    expect(system).toMatch(/reviewTier|social proof/i);
    expect(system).toMatch(/priceTier|price mix/i);
    expect(system).toMatch(/personalization/i);
  });

  it("is stable across calls (cacheability)", () => {
    expect(buildRerankSystemPrompt()).toBe(buildRerankSystemPrompt());
  });
});

describe("buildRerankUserPrompt", () => {
  it("includes the campaign brief, count, and product candidates", () => {
    const prompt = buildRerankUserPrompt(seed, "editorial", [digested], 5);
    expect(prompt).toContain("editorial");
    expect(prompt).toContain("Valentine's Day gifts");
    expect(prompt).toContain("Show her how you feel");
    expect(prompt).toContain("20% off with code LOVE");
    expect(prompt).toContain("Keep it warm and personal");
    expect(prompt).toContain("SKU-001");
    expect(prompt).toMatch(/\b5 most relevant\b/);
  });

  it("skips optional fields when absent", () => {
    const minimalSeed: CreativeSeed = {
      targetCategories: ["Ring"],
      mainMessage: "Anniversary rings",
      includeSms: false,
    };
    const prompt = buildRerankUserPrompt(minimalSeed, "editorial", [digested], 3);
    expect(prompt).toContain("Anniversary rings");
    expect(prompt).not.toMatch(/Secondary message:/);
    expect(prompt).not.toMatch(/Promo details:/);
    expect(prompt).not.toMatch(/Notes:/);
  });
});
