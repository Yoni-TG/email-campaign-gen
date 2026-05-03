import type {
  BlockType,
  SkeletonManifest,
} from "@/modules/email-templates/types";
import { pathIsMultiline } from "@/modules/campaigns/components/edit-fields/path-helpers";

export type PropField =
  | {
      kind: "text";
      propName: string;
      label: string;
      path: string;
      multiline: boolean;
    }
  | {
      kind: "image:asset";
      propName: string;
      label: string;
      slotKey: string;
    }
  | { kind: "bg"; label: string; blockIndex: number }
  | { kind: "align"; label: string; blockIndex: number }
  | { kind: "buttonColor"; label: string; blockIndex: number };

// Block types whose React component currently honours an `align` prop —
// surfacing the editor anywhere else would persist an override the
// renderer ignores.
const ALIGN_CAPABLE: ReadonlySet<BlockType> = new Set([
  "text_block_centered",
  "cta_button",
]);

// Block types whose React component renders a CTA button and accepts a
// `buttonColor` prop. Same constraint: only surface the editor where
// the override actually paints.
const BUTTON_COLOR_CAPABLE: ReadonlySet<BlockType> = new Set([
  "text_block_centered",
  "cta_button",
]);

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  logo_header: "Logo bar",
  announcement_bar: "Announcement",
  hero_lifestyle: "Hero",
  hero_framed: "Hero",
  hero_product: "Hero",
  hero_typography: "Hero",
  hero_tile_graphic: "Hero",
  hero_titled_image: "Hero",
  hero_offer_overlay: "Hero",
  offer_panel: "Offer",
  text_block_centered: "Text",
  editorial_split: "Editorial",
  product_grid_2x2: "Product grid",
  product_grid_3x2: "Product grid",
  product_grid_3x1: "Product grid",
  product_grid_4x1: "Product grid",
  product_grid_magazine: "Product grid",
  product_grid_split: "Product grid",
  product_grid_best_sellers: "Product grid",
  nicky_quote_module: "Nicky quote",
  cta_button: "CTA",
  section_label: "Section label",
  closing_block: "Closing",
  footer: "Footer",
};

const PROP_LABELS: Record<string, string> = {
  headline: "Headline",
  title: "Headline",
  body: "Body",
  description: "Body",
  subLabel: "Sub-label",
  topline: "Intro",
  subhead: "Sub-headline",
  code: "Promo code",
  cta: "CTA label",
  ctaLabel: "CTA label",
  ctaHref: "CTA link",
  cta_href: "CTA link",
  imageUrl: "Image",
  portraitUrl: "Image",
  quote: "Quote",
  response: "Response",
  text: "Text",
};

export function propLabel(propName: string): string {
  if (PROP_LABELS[propName]) return PROP_LABELS[propName];
  // camelCase → "Camel Case"
  const spaced = propName.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const TEXT_PATH_PATTERN =
  /^(body_blocks\[\d+\]\.(title|description|cta|cta_href)|free_top_text|nicky_quote\.(quote|response)|subject_variant\.(subject|preheader)|sms)$/;

function isTextPath(path: string): boolean {
  return TEXT_PATH_PATTERN.test(path);
}

/**
 * Maps a click target back to the skeleton block that owns it.
 * Uses exact-equal matching on bind values so body_blocks[1] doesn't
 * accidentally match body_blocks[10].
 */
export function targetToBlockIndex(
  skeleton: SkeletonManifest,
  target: string,
): number | null {
  if (target.startsWith("bg:block:")) {
    const idx = parseInt(target.slice("bg:block:".length), 10);
    return Number.isNaN(idx) ? null : idx;
  }

  let bindPath: string | null = null;
  if (target.startsWith("text:")) {
    bindPath = target.slice("text:".length);
  } else if (target.startsWith("image:asset:")) {
    bindPath = "assets." + target.slice("image:asset:".length);
  } else {
    return null;
  }

  for (let i = 0; i < skeleton.blocks.length; i++) {
    const block = skeleton.blocks[i];
    for (const value of Object.values(block.bind)) {
      if (typeof value === "string" && value === bindPath) return i;
    }
  }
  return null;
}

/**
 * Lists the editable fields for a single block. Walks block.bind, drops
 * literals + the products binding, and always appends a bg field
 * (background is editable on every block per the renderer).
 */
export function resolveBlockProperties(
  skeleton: SkeletonManifest,
  blockIndex: number,
): PropField[] {
  const block = skeleton.blocks[blockIndex];
  if (!block) return [];

  const fields: PropField[] = [];

  for (const [propName, bindValue] of Object.entries(block.bind)) {
    if (typeof bindValue !== "string") continue;
    if (bindValue.startsWith("literal:")) continue;
    if (bindValue === "products") continue;

    if (bindValue.startsWith("assets.")) {
      const slotKey = bindValue.slice("assets.".length);
      fields.push({
        kind: "image:asset",
        propName,
        label: propLabel(propName),
        slotKey,
      });
      continue;
    }

    if (isTextPath(bindValue)) {
      fields.push({
        kind: "text",
        propName,
        label: propLabel(propName),
        path: bindValue,
        multiline: pathIsMultiline(bindValue),
      });
    }
  }

  fields.push({ kind: "bg", label: "Background", blockIndex });

  if (ALIGN_CAPABLE.has(block.type)) {
    fields.push({ kind: "align", label: "Alignment", blockIndex });
  }
  if (BUTTON_COLOR_CAPABLE.has(block.type)) {
    fields.push({ kind: "buttonColor", label: "Button colour", blockIndex });
  }

  return fields;
}
