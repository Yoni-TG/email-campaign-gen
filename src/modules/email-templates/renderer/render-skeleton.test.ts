import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, type SkeletonManifest } from "../types";
import { blockRegistry } from "./block-registry";
import { renderSkeleton } from "./render-skeleton";
import type { RendererBlueprint } from "./types";

function makeBlueprint(overrides: Partial<RendererBlueprint> = {}): RendererBlueprint {
  return {
    campaign_id: "cmp_test",
    lead_value: "joy",
    lead_personalities: ["fun"],
    market: "us",
    free_top_text: "FREE DELIVERY",
    subject_variant: {
      subject: "Say it with meaning",
      preheader: "Pieces that mark a memory",
    },
    body_blocks: [
      {
        title: "Made just for you",
        description: "Every piece begins with a story.",
        cta: "Shop the edit",
      },
      {
        title: "The Season to Shine",
        description: "Daintily layered, deeply meaningful.",
        cta: "Find your piece",
      },
    ],
    sms: "Theo Grace: 20% off ends tonight.",
    nicky_quote: {
      quote: "These are the gifts I'd give my own mom.",
      response: "Thank you Nicky!",
    },
    products: [
      { title: "Heart Pendant", price: "$98", image_url: "https://cdn.example.com/p1.jpg", link: "https://theograce.com/p/1" },
      { title: "Stack Ring", price: "$76", image_url: "https://cdn.example.com/p2.jpg", link: "https://theograce.com/p/2" },
      { title: "Birth Stone Bracelet", price: "$112", image_url: "https://cdn.example.com/p3.jpg", link: "https://theograce.com/p/3" },
      { title: "Initial Necklace", price: "$84", image_url: "https://cdn.example.com/p4.jpg", link: "https://theograce.com/p/4" },
      { title: "Pearl Studs", price: "$68", image_url: "https://cdn.example.com/p5.jpg", link: "https://theograce.com/p/5" },
      { title: "Charm Anklet", price: "$58", image_url: "https://cdn.example.com/p6.jpg", link: "https://theograce.com/p/6" },
    ],
    assets: {
      hero: "https://cdn.example.com/hero.jpg",
      closing: "https://cdn.example.com/closing.jpg",
      portrait: "https://cdn.example.com/nicky.jpg",
    },
    ...overrides,
  };
}

// Manifest exercising every BlockType in the registry. If a new block is
// added, BLOCK_TYPES grows and this test fails — forcing the author to
// register the block here so it gets coverage.
const KITCHEN_SINK: SkeletonManifest = {
  id: "test/kitchen-sink",
  name: "Kitchen Sink",
  campaignTypes: ["editorial"],
  tags: ["test"],
  description: "Every block, exactly once, rendered in registry order.",
  requiredAssets: [
    { key: "hero", label: "Hero image", required: true },
    { key: "closing", label: "Closing image", required: false },
    { key: "portrait", label: "Nicky portrait", required: false },
  ],
  blocks: [
    { type: "logo_header", bind: {} },
    { type: "announcement_bar", bind: { text: "free_top_text" } },
    {
      type: "hero_lifestyle",
      bind: {
        imageUrl: "assets.hero",
        subLabel: "literal:THE EDIT",
        headline: "body_blocks[0].title",
        body: "body_blocks[0].description",
      },
    },
    {
      type: "hero_product",
      bind: {
        imageUrl: "assets.hero",
        headline: "body_blocks[0].title",
        body: "body_blocks[0].description",
      },
    },
    {
      type: "hero_typography",
      bind: {
        topline: "literal:LIMITED TIME",
        headline: "body_blocks[0].title",
      },
    },
    {
      type: "hero_tile_graphic",
      bind: {
        subLabel: "literal:YOUR MOMENT TO SHINE",
        headline: "body_blocks[0].title",
        tiles: [{ label: "$" }, { label: "?" }, { label: "%" }],
      },
    },
    {
      type: "text_block_centered",
      bind: {
        subLabel: "literal:DID YOU KNOW",
        headline: "body_blocks[1].title",
        body: "body_blocks[1].description",
      },
    },
    {
      type: "editorial_split",
      bind: {
        imageUrl: "assets.closing",
        subLabel: "literal:THE STORY",
        headline: "body_blocks[1].title",
        body: "body_blocks[1].description",
      },
    },
    { type: "product_grid_2x2", bind: { products: "products" } },
    { type: "product_grid_3x2", bind: { products: "products" } },
    {
      type: "nicky_quote_module",
      bind: {
        quote: "nicky_quote.quote",
        response: "nicky_quote.response",
        portraitUrl: "assets.portrait",
      },
    },
    { type: "cta_button", bind: { label: "literal:Shop now" } },
    { type: "section_label", bind: { text: "literal:JEWELLERY FOR MOM" } },
    {
      type: "closing_block",
      bind: {
        imageUrl: "assets.closing",
        headline: "body_blocks[1].title",
        body: "body_blocks[1].description",
      },
    },
    { type: "footer", bind: {} },
  ],
};

describe("renderSkeleton", () => {
  it("renders a manifest exercising every registered block type", async () => {
    const blueprint = makeBlueprint();

    const { html, missingAssets } = await renderSkeleton(KITCHEN_SINK, blueprint, {
      withAssets: true,
    });

    expect(html).toContain("<html");
    expect(html).toContain("theo grace");
    expect(html).toContain("FREE DELIVERY");
    expect(html).toContain("Made just for you");
    expect(html).toContain("Heart Pendant");
    expect(html).toContain("$98");
    expect(html).toContain("Thank you Nicky!");
    expect(html).toContain("Shop now");
    expect(html).toContain("JEWELLERY FOR MOM");
    expect(missingAssets).toEqual([]);
  });

  it("registers a component for every BlockType", () => {
    for (const type of BLOCK_TYPES) {
      expect(blockRegistry[type]).toBeTypeOf("function");
    }
  });

  it("reports missing assets when withAssets:true and a required key is unset", async () => {
    const manifest: SkeletonManifest = {
      id: "test/missing-assets",
      name: "Missing Assets",
      campaignTypes: ["editorial"],
      tags: [],
      description: "",
      requiredAssets: [
        { key: "hero", label: "Hero", required: true },
        { key: "closing", label: "Closing", required: true },
      ],
      blocks: [
        { type: "hero_lifestyle", bind: { imageUrl: "assets.hero", headline: "literal:Hi" } },
        { type: "closing_block", bind: { imageUrl: "assets.closing", headline: "literal:Bye" } },
      ],
    };
    const blueprint = makeBlueprint({ assets: {} });

    const { missingAssets } = await renderSkeleton(manifest, blueprint, {
      withAssets: true,
    });

    expect(missingAssets).toEqual(["hero", "closing"]);
  });

  it("uses placeholder URLs for asset paths when withAssets:false (no missingAssets reported)", async () => {
    const manifest: SkeletonManifest = {
      id: "test/preview",
      name: "Preview",
      campaignTypes: ["editorial"],
      tags: [],
      description: "",
      requiredAssets: [{ key: "hero", label: "Hero", required: true }],
      blocks: [{ type: "hero_lifestyle", bind: { imageUrl: "assets.hero", headline: "literal:Hi" } }],
    };
    const blueprint = makeBlueprint({ assets: {} });

    const { html, missingAssets } = await renderSkeleton(manifest, blueprint, {
      withAssets: false,
    });

    expect(missingAssets).toEqual([]);
    expect(html).toContain("data:image/svg+xml");
  });

  it("uses real asset URLs when withAssets:true and the blueprint supplies them", async () => {
    const manifest: SkeletonManifest = {
      id: "test/real-assets",
      name: "Real Assets",
      campaignTypes: ["editorial"],
      tags: [],
      description: "",
      requiredAssets: [{ key: "hero", label: "Hero", required: true }],
      blocks: [{ type: "hero_lifestyle", bind: { imageUrl: "assets.hero", headline: "literal:Hi" } }],
    };
    const blueprint = makeBlueprint({
      assets: { hero: "https://cdn.example.com/real-hero.jpg" },
    });

    const { html, missingAssets } = await renderSkeleton(manifest, blueprint, {
      withAssets: true,
    });

    expect(missingAssets).toEqual([]);
    expect(html).toContain("https://cdn.example.com/real-hero.jpg");
    expect(html).not.toContain("data:image/svg+xml");
  });

  it("walks dotted paths with array indexing into the blueprint", async () => {
    const manifest: SkeletonManifest = {
      id: "test/path-walker",
      name: "Path Walker",
      campaignTypes: ["editorial"],
      tags: [],
      description: "",
      requiredAssets: [],
      blocks: [
        {
          type: "text_block_centered",
          bind: {
            subLabel: "subject_variant.subject",
            headline: "body_blocks[1].title",
            body: "body_blocks[1].description",
          },
        },
      ],
    };
    const blueprint = makeBlueprint();

    const { html } = await renderSkeleton(manifest, blueprint, {
      withAssets: false,
    });

    expect(html).toContain("Say it with meaning");
    expect(html).toContain("The Season to Shine");
    expect(html).toContain("Daintily layered, deeply meaningful.");
  });

  it("renders literal: bind values verbatim", async () => {
    const manifest: SkeletonManifest = {
      id: "test/literal",
      name: "Literal",
      campaignTypes: ["editorial"],
      tags: [],
      description: "",
      requiredAssets: [],
      blocks: [
        { type: "section_label", bind: { text: "literal:LIMITED EDITION" } },
        { type: "cta_button", bind: { label: "literal:Shop the edit", href: "literal:https://theograce.com/edit" } },
      ],
    };
    const blueprint = makeBlueprint();

    const { html } = await renderSkeleton(manifest, blueprint, { withAssets: false });

    expect(html).toContain("LIMITED EDITION");
    expect(html).toContain("Shop the edit");
    expect(html).toContain("https://theograce.com/edit");
  });
});
