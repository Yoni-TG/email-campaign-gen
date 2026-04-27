import { describe, expect, it } from "vitest";
import { serializeForDb } from "./campaign-persistence";
import type {
  ApprovedCopy,
  CandidateVariant,
  CreativeSeed,
  FinalRenderResult,
  GeneratedCopy,
  ProductSnapshot,
} from "@/lib/types";

const sampleSeed: CreativeSeed = {
  targetCategories: ["Necklaces"],
  mainMessage: "Mother's Day collection launch",
  includeSms: false,
  leadValue: "family_first",
  leadPersonalities: ["warm_hearted"],
};

describe("serializeForDb", () => {
  it("omits fields that weren't set", () => {
    const out = serializeForDb({ name: "Spring Drop" });
    expect(out).toEqual({ name: "Spring Drop" });
  });

  it("passes scalar fields through unchanged", () => {
    const out = serializeForDb({
      name: "Spring Drop",
      status: "review",
      campaignType: "product_launch",
      createdBy: "yoni",
      heroImagePath: "/uploads/abc/hero.jpg",
      error: null,
    });
    expect(out).toEqual({
      name: "Spring Drop",
      status: "review",
      campaignType: "product_launch",
      createdBy: "yoni",
      heroImagePath: "/uploads/abc/hero.jpg",
      error: null,
    });
  });

  it("stringifies json fields", () => {
    const out = serializeForDb({ seed: sampleSeed });
    expect(typeof out.seed).toBe("string");
    expect(JSON.parse(out.seed as string)).toEqual(sampleSeed);
  });

  it("passes null through for nullable json fields", () => {
    const out = serializeForDb({
      generatedCopy: null,
      approvedCopy: null,
      generatedProducts: null,
      approvedProducts: null,
      assetPaths: null,
      candidateVariants: null,
      renderResult: null,
    });
    expect(out).toEqual({
      generatedCopy: null,
      approvedCopy: null,
      generatedProducts: null,
      approvedProducts: null,
      assetPaths: null,
      candidateVariants: null,
      renderResult: null,
    });
  });

  it("stringifies all json-backed fields when present", () => {
    const generatedCopy: GeneratedCopy = {
      campaign_id: "c1",
      free_top_text: null,
      body_blocks: [{ title: "Hi", description: null, cta: null }],
      subject_variants: [{ subject: "s", preheader: "p" }],
      sms: null,
      nicky_quote: null,
    };
    const approvedCopy: ApprovedCopy = {
      campaign_id: "c1",
      free_top_text: null,
      body_blocks: generatedCopy.body_blocks,
      subject_variant: generatedCopy.subject_variants[0],
      sms: null,
      nicky_quote: null,
    };
    const product: ProductSnapshot = {
      sku: "SKU-1",
      name: "Ring",
      imageUrl: "https://cdn/img.jpg",
      price: "120",
      salePrice: "",
      currency: "USD",
      link: "https://theograce.com/products/ring",
      productType: ["Rings"],
      priceTier: "50_150",
      isOnSale: false,
      reviewTier: null,
      personalizationSummary: null,
    };
    const candidateVariants: CandidateVariant[] = [
      {
        skeletonId: "product-launch/hero-story-grid",
        name: "Hero · Story · Grid",
        rationale: null,
        previewHtml: "<html><body>preview</body></html>",
      },
    ];
    const renderResult: FinalRenderResult = {
      skeletonId: "product-launch/hero-story-grid",
      html: "<html><body>final</body></html>",
      renderedAt: "2026-04-26T00:00:00.000Z",
    };
    const assetPaths = { hero: "/uploads/c1/hero.jpg" };

    const out = serializeForDb({
      generatedCopy,
      approvedCopy,
      generatedProducts: [product],
      approvedProducts: [product],
      assetPaths,
      candidateVariants,
      renderResult,
    });

    expect(JSON.parse(out.generatedCopy as string)).toEqual(generatedCopy);
    expect(JSON.parse(out.approvedCopy as string)).toEqual(approvedCopy);
    expect(JSON.parse(out.generatedProducts as string)).toEqual([product]);
    expect(JSON.parse(out.approvedProducts as string)).toEqual([product]);
    expect(JSON.parse(out.assetPaths as string)).toEqual(assetPaths);
    expect(JSON.parse(out.candidateVariants as string)).toEqual(
      candidateVariants,
    );
    expect(JSON.parse(out.renderResult as string)).toEqual(renderResult);
  });
});
