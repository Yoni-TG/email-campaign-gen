import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "@/modules/email-templates/types";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import {
  BLOCK_TYPE_LABELS,
  propLabel,
  resolveBlockProperties,
  targetToBlockIndex,
} from "./block-properties";

const SAMPLE_SKELETON: SkeletonManifest = {
  id: "test/sample",
  name: "Sample",
  campaignTypes: ["holiday_seasonal"],
  tags: [],
  description: "",
  requiredAssets: [
    { key: "hero", label: "Hero", required: true },
  ],
  blocks: [
    { type: "logo_header", bind: {} },
    { type: "announcement_bar", bind: { text: "free_top_text" } },
    {
      type: "hero_lifestyle",
      bind: {
        imageUrl: "assets.hero",
        subLabel: "literal:WITH LOVE",
        headline: "body_blocks[0].title",
        body: "body_blocks[0].description",
      },
    },
    {
      type: "product_grid_3x2",
      bind: { products: "products" },
    },
    {
      type: "closing_block",
      bind: {
        headline: "body_blocks[1].title",
        body: "body_blocks[1].description",
        ctaLabel: "body_blocks[1].cta",
        ctaHref: "literal:#",
      },
    },
    { type: "footer", bind: {} },
  ],
};

describe("BLOCK_TYPE_LABELS", () => {
  it("has a label for every BlockType", () => {
    for (const type of BLOCK_TYPES) {
      expect(BLOCK_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe("propLabel", () => {
  it("maps known prop names to friendly labels", () => {
    expect(propLabel("headline")).toBe("Headline");
    expect(propLabel("title")).toBe("Headline");
    expect(propLabel("body")).toBe("Body");
    expect(propLabel("description")).toBe("Body");
    expect(propLabel("ctaLabel")).toBe("CTA label");
    expect(propLabel("imageUrl")).toBe("Image");
    expect(propLabel("portraitUrl")).toBe("Image");
    expect(propLabel("subLabel")).toBe("Sub-label");
  });

  it("Title-cases unknown camelCase prop names", () => {
    expect(propLabel("badgeText")).toBe("Badge Text");
    expect(propLabel("foo")).toBe("Foo");
  });
});

describe("targetToBlockIndex", () => {
  it("maps bg:block:N to N", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "bg:block:0")).toBe(0);
    expect(targetToBlockIndex(SAMPLE_SKELETON, "bg:block:5")).toBe(5);
  });

  it("maps text:body_blocks[0].title to the hero block", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "text:body_blocks[0].title"),
    ).toBe(2);
  });

  it("maps text:body_blocks[1].title to the closing block", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "text:body_blocks[1].title"),
    ).toBe(4);
  });

  it("maps text:free_top_text to the announcement bar", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "text:free_top_text")).toBe(1);
  });

  it("maps image:asset:hero to the hero block", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "image:asset:hero")).toBe(2);
  });

  it("returns null for an unknown target prefix", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "weird:thing")).toBeNull();
  });

  it("returns null for an unmappable text path", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "text:body_blocks[42].title"),
    ).toBeNull();
  });

  it("returns null for an unmappable asset key", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "image:asset:nonexistent"),
    ).toBeNull();
  });

  it("uses exact-equal matching, not substring", () => {
    // body_blocks[1] must NOT match body_blocks[10]
    const skeleton: SkeletonManifest = {
      ...SAMPLE_SKELETON,
      blocks: [{ type: "text_block_centered", bind: { headline: "body_blocks[10].title" } }],
    };
    expect(targetToBlockIndex(skeleton, "text:body_blocks[1].title")).toBeNull();
    expect(targetToBlockIndex(skeleton, "text:body_blocks[10].title")).toBe(0);
  });
});

describe("resolveBlockProperties", () => {
  it("returns text fields, image fields, and a bg field for a hero block", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 2);
    expect(fields).toEqual([
      expect.objectContaining({
        kind: "image:asset",
        propName: "imageUrl",
        slotKey: "hero",
      }),
      expect.objectContaining({
        kind: "text",
        propName: "headline",
        path: "body_blocks[0].title",
        multiline: false,
      }),
      expect.objectContaining({
        kind: "text",
        propName: "body",
        path: "body_blocks[0].description",
        multiline: true,
      }),
      expect.objectContaining({ kind: "bg", blockIndex: 2 }),
    ]);
  });

  it("skips literal: bindings", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 2);
    expect(fields.some((f) => f.kind === "text" && f.propName === "subLabel")).toBe(
      false,
    );
  });

  it("skips the products binding on a grid block but still appends bg", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 3);
    expect(fields).toEqual([
      expect.objectContaining({ kind: "bg", blockIndex: 3 }),
    ]);
  });

  it("returns just bg for a block with no editable bindings", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 0);
    expect(fields).toEqual([
      expect.objectContaining({ kind: "bg", blockIndex: 0 }),
    ]);
  });

  it("returns [] for an out-of-range index", () => {
    expect(resolveBlockProperties(SAMPLE_SKELETON, 99)).toEqual([]);
  });
});
