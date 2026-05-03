// Types for the email-templates module — atomic blocks, skeleton manifests,
// renderer + selection contracts. Names mirror the wireframe-guide (§8 module
// library) where possible so the brand vocabulary stays coherent across the
// copy agent, wireframe spec, and the actual rendered output.

import type { CampaignType } from "@/lib/types";

// ─── Block taxonomy ───
//
// One BlockType per atomic React-Email component. Manifests reference these
// by string id; the renderer maps id → component via blockRegistry.

export const BLOCK_TYPES = [
  "logo_header",
  "announcement_bar",
  "hero_lifestyle",
  "hero_framed",
  "hero_product",
  "hero_typography",
  "hero_tile_graphic",
  "hero_titled_image",
  "hero_offer_overlay",
  "offer_panel",
  "text_block_centered",
  "editorial_split",
  "product_grid_2x2",
  "product_grid_3x2",
  "product_grid_3x1",
  "product_grid_4x1",
  "product_grid_magazine",
  "product_grid_split",
  "product_grid_best_sellers",
  "nicky_quote_module",
  "cta_button",
  "section_label",
  "closing_block",
  "footer",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

// ─── Content paths ───
//
// A ContentPath is a string the renderer resolves against the CampaignBlueprint
// to produce a block prop value. Five forms:
//   - "seed.<key>"               → blueprint[key from seed]
//   - "approvedCopy.<dotted>"    → blueprint approvedCopy field, supports nested + array indexing
//   - "products[<n>]"            → product object at index
//   - "products[<n>].<key>"      → field on the product at index
//   - "assets.<key>"             → uploaded asset URL by AssetSlot.key (post-asset_upload)
//   - "literal:<value>"          → hardcoded copy on the skeleton itself (no lookup)
//
// During the candidate-preview phase (withAssets:false), unresolved
// "assets.<key>" paths return a placeholder URL; the renderer also
// reports the missing asset keys.

export type ContentPath = string;

/**
 * A bind value is either a ContentPath (string) the renderer resolves, or
 * an inline literal value passed straight through to the block. Inline
 * literals are used for non-scalar props that don't have a natural path
 * on the blueprint — e.g. the tile labels on hero_tile_graphic.
 */
export type BindValue = ContentPath | unknown[] | Record<string, unknown> | number | boolean | null;

// ─── Skeleton manifest shape ───

export interface AssetSlot {
  /** Stable key used in bind paths (e.g. "hero", "closing"). */
  key: string;
  /** Operator-facing label shown on the asset-upload form. */
  label: string;
  required: boolean;
}

export interface BlockEntry {
  type: BlockType;
  /**
   * Maps a block prop name to a BindValue. Strings are resolved as ContentPath;
   * non-string values are passed straight through as inline literals.
   */
  bind: Record<string, BindValue>;
}

export interface SkeletonManifest {
  /** e.g. "sale-promo/mystery-tiles". Stable across renders. */
  id: string;
  /** Human-readable label, shown on the variant card. */
  name: string;
  /** Campaign types this skeleton is valid for (rules-narrowing). */
  campaignTypes: CampaignType[];
  /** Tags consumed by the LLM ranker. */
  tags: string[];
  /** Description fed to the LLM ranker as rationale source. */
  description: string;
  /** Assets the operator must upload AFTER selecting this variant. */
  requiredAssets: AssetSlot[];
  /** Ordered block list to render. */
  blocks: BlockEntry[];
}

// ─── Selection results ───

export interface SkeletonRanked {
  skeleton: SkeletonManifest;
  /** One-line "why this skeleton fits" — null when the ranker didn't run. */
  rationale: string | null;
}

// ─── Renderer output ───

export interface RenderResult {
  html: string;
  /**
   * AssetSlot.key values that the manifest references via "assets.<key>"
   * but that did not resolve during this render. Empty when withAssets:true
   * is called with all required assets supplied.
   */
  missingAssets: string[];
}

// ─── Stored on the campaign ───
//
// The Campaign.candidateVariants column persists the 3 selected skeletons
// after the rendering_candidates phase so we don't re-call selection on
// every page load.

export interface CandidateVariant {
  skeletonId: string;
  rationale: string | null;
  /** The candidate-phase HTML (placeholder assets), used for the iframe preview. */
  previewHtml: string;
}

// The Campaign.renderResult column persists the final post-asset_upload
// render, served at /campaigns/<id>/preview/<variantId>.
export interface FinalRenderResult {
  skeletonId: string;
  html: string;
  renderedAt: string; // ISO timestamp
}
