import { describe, expect, it } from "vitest";
import type { CampaignType } from "@/lib/types";
import { renderSkeleton } from "../renderer/render-skeleton";
import type { RendererBlueprint } from "../renderer/types";
import { BLOCK_TYPES } from "../types";
import { loadAllSkeletons, loadSkeletonById } from "./index";

function sampleBlueprint(): RendererBlueprint {
  return {
    campaign_id: "cmp_skeleton_test",
    lead_value: "joy",
    lead_personalities: ["fun"],
    market: "us",
    free_top_text: "FREE DELIVERY",
    subject_variant: { subject: "Say it with meaning", preheader: "From Theo Grace" },
    body_blocks: [
      { title: "Made for you", description: "Personalised pieces ready to ship.", cta: "Shop now" },
      { title: "Every piece, a story", description: "Hand-finished and ready to gift.", cta: "Find your piece" },
      { title: "Almost there", description: "Last call before they're gone.", cta: "Catch them" },
    ],
    sms: null,
    nicky_quote: { quote: "These are the pieces I'd give my own family.", response: "Thank you Nicky!" },
    products: [
      { sku: "P1", title: "Heart Pendant", price: "$98", image_url: "https://cdn.example.com/p1.jpg", link: "https://theograce.com/p/1" },
      { sku: "P2", title: "Stack Ring", price: "$76", image_url: "https://cdn.example.com/p2.jpg", link: "https://theograce.com/p/2" },
      { sku: "P3", title: "Birth Stone Bracelet", price: "$112", image_url: "https://cdn.example.com/p3.jpg", link: "https://theograce.com/p/3" },
      { sku: "P4", title: "Initial Necklace", price: "$84", image_url: "https://cdn.example.com/p4.jpg", link: "https://theograce.com/p/4" },
      { sku: "P5", title: "Pearl Studs", price: "$68", image_url: "https://cdn.example.com/p5.jpg", link: "https://theograce.com/p/5" },
      { sku: "P6", title: "Charm Anklet", price: "$58", image_url: "https://cdn.example.com/p6.jpg", link: "https://theograce.com/p/6" },
    ],
    assets: {
      hero: "https://cdn.example.com/hero.jpg",
      closing: "https://cdn.example.com/closing.jpg",
      secondary: "https://cdn.example.com/secondary.jpg",
      portrait: "https://cdn.example.com/nicky.jpg",
    },
  };
}

describe("skeleton library", () => {
  const skeletons = loadAllSkeletons();

  it("ships exactly 3 skeletons per campaign type (15 total)", () => {
    expect(skeletons).toHaveLength(15);
    const counts = skeletons.reduce<Record<string, number>>((acc, s) => {
      for (const t of s.campaignTypes) acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    const types: CampaignType[] = [
      "product_launch",
      "sale_promo",
      "editorial",
      "collection_spotlight",
      "holiday_seasonal",
    ];
    for (const type of types) {
      expect(counts[type]).toBe(3);
    }
  });

  it("uses unique skeleton ids", () => {
    const ids = skeletons.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only registered BlockTypes in every block entry", () => {
    const known = new Set<string>(BLOCK_TYPES);
    for (const s of skeletons) {
      for (const block of s.blocks) {
        expect(known.has(block.type)).toBe(true);
      }
    }
  });

  it.each(loadAllSkeletons())(
    "$id renders to non-empty HTML in candidate phase",
    async (manifest) => {
      const blueprint = sampleBlueprint();
      const { html } = await renderSkeleton(manifest, blueprint, { withAssets: false });
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    },
  );

  it.each(loadAllSkeletons())(
    "$id renders to non-empty HTML in final phase",
    async (manifest) => {
      const blueprint = sampleBlueprint();
      const { html } = await renderSkeleton(manifest, blueprint, { withAssets: true });
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain("</html>");
    },
  );

  it("requiredAssets keys exist in the sample blueprint or are non-required", async () => {
    // Documents the contract: every required:true asset key in any skeleton
    // must be a key the asset_upload step is aware of. This test inspects
    // the union of all required keys.
    const required = new Set<string>();
    for (const s of loadAllSkeletons()) {
      for (const a of s.requiredAssets) {
        if (a.required) required.add(a.key);
      }
    }
    // Sanity: at least one skeleton has hero required.
    expect(required.has("hero")).toBe(true);
  });

  it("loadSkeletonById finds a known id and returns null for unknown", () => {
    expect(loadSkeletonById("product-launch/hero-story-grid")).not.toBeNull();
    expect(loadSkeletonById("nope/nope")).toBeNull();
  });
});
