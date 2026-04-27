import { describe, expect, it } from "vitest";
import { buildBlueprint } from "./build-blueprint";
import type {
  ApprovedCopy,
  CreativeSeed,
  ProductSnapshot,
} from "@/lib/types";

const seed: CreativeSeed = {
  targetCategories: ["Necklaces"],
  mainMessage: "Mother's Day launch",
  includeSms: true,
  leadValue: "family_first",
  leadPersonalities: ["warm_hearted", "joyfully_characterful"],
};

const approvedCopy: ApprovedCopy = {
  campaign_id: "cmp_1",
  free_top_text: "TIMELESS. ALWAYS HAS BEEN",
  body_blocks: [
    { title: "For Mom", description: "Pieces she'll treasure", cta: "Shop Now" },
  ],
  subject_variant: { subject: "Mom deserves it", preheader: "Starts today" },
  sms: "Gifts she'll love: {link}",
  nicky_quote: null,
};

const snapshot = (overrides: Partial<ProductSnapshot> = {}): ProductSnapshot => ({
  sku: "SKU-1",
  name: "Initial Necklace",
  imageUrl: "https://cdn/a.jpg",
  price: "120",
  salePrice: "",
  currency: "USD",
  link: "https://theograce.com/products/initial-necklace",
  productType: ["Necklaces"],
  priceTier: "50_150",
  isOnSale: false,
  reviewTier: null,
  personalizationSummary: null,
  ...overrides,
});

describe("buildBlueprint", () => {
  it("maps approved data into the blueprint shape", () => {
    const out = buildBlueprint({
      campaignId: "cmp_1",
      seed,
      approvedCopy,
      approvedProducts: [snapshot()],
      assets: { hero: "/uploads/cmp_1/hero.jpg" },
    });

    expect(out.campaign_id).toBe("cmp_1");
    expect(out.lead_value).toBe("family_first");
    expect(out.lead_personalities).toEqual([
      "warm_hearted",
      "joyfully_characterful",
    ]);
    expect(out.free_top_text).toBe("TIMELESS. ALWAYS HAS BEEN");
    expect(out.subject_variant).toEqual(approvedCopy.subject_variant);
    expect(out.assets).toEqual({ hero: "/uploads/cmp_1/hero.jpg" });
    expect(out.body_blocks).toEqual(approvedCopy.body_blocks);
    expect(out.sms).toBe("Gifts she'll love: {link}");
  });

  it("prefers salePrice when present, falls back to price otherwise", () => {
    const out = buildBlueprint({
      campaignId: "cmp_1",
      seed,
      approvedCopy,
      approvedProducts: [
        snapshot({ sku: "ON-SALE", price: "120", salePrice: "99" }),
        snapshot({ sku: "FULL-PRICE", price: "180", salePrice: "" }),
      ],
    });

    expect(out.products[0].price).toBe("99");
    expect(out.products[1].price).toBe("180");
  });

  it("maps product fields to the snake_case blueprint shape", () => {
    const out = buildBlueprint({
      campaignId: "cmp_1",
      seed,
      approvedCopy,
      approvedProducts: [
        snapshot({ name: "Ring", imageUrl: "https://cdn/r.jpg" }),
      ],
      assets: { hero: "/uploads/cmp_1/hero.jpg" },
    });

    expect(out.products[0]).toEqual({
      sku: "SKU-1",
      title: "Ring",
      price: "120",
      image_url: "https://cdn/r.jpg",
      link: "https://theograce.com/products/initial-necklace",
    });
  });

  it("defaults to an empty assets map when none are supplied (candidate render phase)", () => {
    const out = buildBlueprint({
      campaignId: "cmp_1",
      seed,
      approvedCopy,
      approvedProducts: [],
    });
    expect(out.assets).toEqual({});
  });
});
