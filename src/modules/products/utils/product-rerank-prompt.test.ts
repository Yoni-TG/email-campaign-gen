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

const seed: CreativeSeed = makeSeed({
  secondaryMessage: "Show her how you feel",
  promoDetails: "20% off with code LOVE",
  additionalNotes: "Keep it warm and personal",
});

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
    const summary = toProductSummary(digested) as unknown as Record<
      string,
      unknown
    >;
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

  it("lists the ranking criteria (theme, social proof, price spread, personalization)", () => {
    const system = buildRerankSystemPrompt();
    expect(system).toMatch(/theme/i);
    expect(system).toMatch(/social proof/i);
    expect(system).toMatch(/price spread|price tier/i);
    expect(system).toMatch(/personalization/i);
  });

  it("separates hard constraints from soft preferences", () => {
    const system = buildRerankSystemPrompt();
    expect(system).toMatch(/hard constraint/i);
    expect(system).toMatch(/soft preference/i);
    // Hard constraints must include "must come from candidates"
    expect(system).toMatch(/MUST.+candidates/i);
  });

  it("is stable across calls (cacheability)", () => {
    expect(buildRerankSystemPrompt()).toBe(buildRerankSystemPrompt());
  });
});

describe("buildRerankUserPrompt", () => {
  it("includes the campaign brief, count, and product candidates", () => {
    const prompt = buildRerankUserPrompt(seed, "editorial", [digested], 5);
    expect(prompt).toContain("Editorial");
    expect(prompt).toContain("Valentine's Day gifts");
    expect(prompt).toContain("Show her how you feel");
    expect(prompt).toContain("20% off with code LOVE");
    expect(prompt).toContain("Keep it warm and personal");
    expect(prompt).toContain("SKU-001");
    expect(prompt).toMatch(/Pick the 5 best products/);
  });

  it("uses XML tags so the model sees structured fields", () => {
    const prompt = buildRerankUserPrompt(seed, "editorial", [digested], 5);
    expect(prompt).toContain("<brief>");
    expect(prompt).toContain("</brief>");
    expect(prompt).toContain("<candidates>");
    expect(prompt).toContain("<main_message>Valentine's Day gifts</main_message>");
    expect(prompt).toContain("<categories>Necklace</categories>");
  });

  it("threads lead value and personalities into the brief", () => {
    const prompt = buildRerankUserPrompt(
      makeSeed({
        leadValue: "family_first",
        leadPersonalities: ["warm_hearted", "joyfully_characterful"],
      }),
      "editorial",
      [digested],
      5,
    );
    expect(prompt).toMatch(/<lead_value>Family First/);
    expect(prompt).toMatch(/Warm-hearted/);
    expect(prompt).toMatch(/Joyfully Characterful/);
  });

  it("emits an audience tag when targetAudience is set", () => {
    const prompt = buildRerankUserPrompt(
      makeSeed({ targetAudience: ["Men", "Father"] }),
      "editorial",
      [digested],
      5,
    );
    expect(prompt).toContain("<audience>Men, Father</audience>");
  });

  it("omits the audience tag when targetAudience is empty or undefined", () => {
    const minimalSeed = makeSeed({
      targetCategories: ["Ring"],
      mainMessage: "Anniversary rings",
    });
    const prompt = buildRerankUserPrompt(minimalSeed, "editorial", [digested], 3);
    expect(prompt).not.toContain("<audience>");
  });

  it("skips optional fields when absent", () => {
    const minimalSeed = makeSeed({
      targetCategories: ["Ring"],
      mainMessage: "Anniversary rings",
    });
    const prompt = buildRerankUserPrompt(minimalSeed, "editorial", [digested], 3);
    expect(prompt).toContain("Anniversary rings");
    expect(prompt).not.toContain("<secondary_message>");
    expect(prompt).not.toContain("<promo_details>");
    expect(prompt).not.toContain("<notes>");
  });
});
