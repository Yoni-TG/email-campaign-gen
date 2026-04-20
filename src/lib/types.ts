// ─── Campaign Status ───

export const CAMPAIGN_STATUSES = [
  "draft",
  "generating",
  "review",
  "hero_upload",
  "filling_figma",
  "variant_selection",
  "completed",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  generating: "Generating…",
  review: "Needs Review",
  hero_upload: "Hero Image",
  filling_figma: "Filling Figma…",
  variant_selection: "Pick Variant",
  completed: "Completed",
};

// ─── Campaign Types ───

export const CAMPAIGN_TYPES = [
  "product_launch",
  "sale_promo",
  "editorial",
  "collection_spotlight",
  "holiday_seasonal",
] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  product_launch: "Product Launch",
  sale_promo: "Sale / Promo",
  editorial: "Editorial",
  collection_spotlight: "Collection Spotlight",
  holiday_seasonal: "Holiday / Seasonal",
};

// Shown in tooltips next to the type dropdown / chips so campaign managers
// know what each value shifts in the AI output.
export const CAMPAIGN_TYPE_DESCRIPTIONS: Record<CampaignType, string> = {
  product_launch: "Introducing a new SKU or capsule. Copy leans discovery + hero-forward.",
  sale_promo: "Time-bound discount push. Urgency + clear offer terms.",
  editorial: "Story-led or value-driven. No hard sell; mood + meaning.",
  collection_spotlight: "Re-surface an existing collection. Curated picks.",
  holiday_seasonal: "Tied to a calendar moment. Giftable framing.",
};

export const CAMPAIGN_STATUS_DESCRIPTIONS: Record<CampaignStatus, string> = {
  draft: "Brief saved but generation hasn't started.",
  generating: "Claude is writing copy and picking products (10–20 s).",
  review: "Ready for your edits. Approve copy + products to continue.",
  hero_upload: "Pick a hero image for the Figma templates.",
  filling_figma: "Templates are being filled with your approved content.",
  variant_selection: "Pick which layout variant to hand off.",
  completed: "Ready for retention to slice into Klaviyo.",
};

// ─── Creative Seed ───

// Which brand value the campaign leans on (brand-guide §3).
export const LEAD_VALUES = [
  "family_first",
  "meaningful_moments",
  "joy",
] as const;
export type LeadValue = (typeof LEAD_VALUES)[number];

export const LEAD_VALUE_LABELS: Record<LeadValue, string> = {
  family_first: "Family First",
  meaningful_moments: "Meaningful Moments",
  joy: "Joy",
};

export const LEAD_VALUE_DESCRIPTIONS: Record<LeadValue, string> = {
  family_first: "Love that endures — mother-daughter, couple, chosen family.",
  meaningful_moments: "Pieces that mark a memory or milestone.",
  joy: "Playful, celebratory energy. Gifting delight.",
};

// Which personalities the campaign emphasizes (brand-guide §4).
// A single brief can mix more than one — the wireframe agent uses them to
// modulate layout mood (see wireframe-guide §3).
export const LEAD_PERSONALITIES = [
  "joyfully_characterful",
  "fun",
  "charming",
  "warm_hearted",
] as const;
export type LeadPersonality = (typeof LEAD_PERSONALITIES)[number];

export const LEAD_PERSONALITY_LABELS: Record<LeadPersonality, string> = {
  joyfully_characterful: "Joyfully Characterful",
  fun: "Fun",
  charming: "Charming",
  warm_hearted: "Warm-hearted",
};

export const LEAD_PERSONALITY_DESCRIPTIONS: Record<LeadPersonality, string> = {
  joyfully_characterful: "Unexpected moments, spark, a wink of humor.",
  fun: "Bright, light-hearted, easy to read.",
  charming: "Elegant and considered, quietly confident.",
  warm_hearted: "Emotional, sincere, close-to-the-heart.",
};

export interface CreativeSeed {
  targetCategories: string[];
  promoDetails?: string;
  mainMessage: string;
  secondaryMessage?: string;
  pinnedSkus?: string[];
  milledInspirationUrls?: string[];
  additionalNotes?: string;
  includeSms: boolean;
  // Brief-time decisions that shape copy voice and wireframe mood.
  // Lead value is singular (pick one). Personalities can be 1+; the order
  // is not meaningful.
  leadValue: LeadValue;
  leadPersonalities: LeadPersonality[];
}

// ─── Generated Copy ───
//
// Shape matches how Theo Grace builds real campaigns (mirrors the past-
// campaign fixtures in src/content/few-shot-examples.json):
//
// - free_top_text — optional banner text above the hero image
// - body_blocks   — ordered sections in the body, each with an optional
//                   title / description / CTA. Block 0 sits directly
//                   under the hero; block N sits below block N-1.
//                   Typical count is 1-3.
// - subject_variants — 1-2 paired (subject, preheader) candidates for
//                      A/B testing. Review UI picks one.
// - sms — max 130 chars, optional.

export interface SubjectVariant {
  subject: string;
  preheader: string;
}

export interface BodyBlock {
  title: string | null;
  description: string | null;
  cta: string | null;
}

// Fields intentionally use snake_case to mirror the wire format — the Claude
// tool output, the brand-guide §11 contract, and the DB JSON column all share
// this shape. Same convention we use on FeedProduct.
//
// campaign_id is attached by the service layer (not emitted by the LLM) so
// the JSON stored in Campaign.generated_copy is self-contained: given a
// generated_copy blob in isolation, you can still look up the parent
// campaign row.
export interface GeneratedCopy {
  campaign_id: string;
  free_top_text: string | null;
  body_blocks: BodyBlock[];
  subject_variants: SubjectVariant[];
  sms: string | null;
}

// ─── Approved Copy ───
//
// After CP1 review: the operator has picked one subject_variant, may have
// edited the body blocks / free_top_text / sms, and is ready to hand off
// to the wireframe + Figma stages.

export interface ApprovedCopy {
  campaign_id: string;
  free_top_text: string | null;
  body_blocks: BodyBlock[];
  subject_variant: SubjectVariant;
  sms: string | null;
}

// ─── Derived field enums ───

export type PriceTier = "under_50" | "50_150" | "150_500" | "500_plus";

export type ReviewTier = "highly_reviewed" | "well_reviewed" | null;

export type PrimaryLanguage =
  | "english"
  | "arabic"
  | "non_latin"
  | "non_english";

// ─── Product Snapshot (stored on campaign records) ───

export interface ProductSnapshot {
  sku: string;
  name: string;
  imageUrl: string;
  price: string;
  salePrice: string;
  currency: string;
  link: string;
  productType: string[];
  priceTier: PriceTier;
  isOnSale: boolean;
  reviewTier: ReviewTier;
  personalizationSummary: string | null;
}

// ─── Feed Product (raw from the custom email-marketing.json CDN feed) ───
//
// Field names match the real feed shape (snake_case, singular). Confirmed
// against https://static.myka.com/.../email-marketing.json on 2026-04-19.
// The plan originally documented TitleCase / "Title Case" field names —
// those were aspirational; the real feed uses this shape.
export interface FeedProduct {
  sku: string;
  name: string;
  product_type: string[];
  product_type_singular?: string;
  shop_for: string[];
  occasion: string[];
  collection: string[];
  material: string[];
  metal_color: string;
  /** Upstream feed typo — kept as-is so field access works. */
  has_perosnalization?: string;
  num_of_inscriptions?: string[];
  stock_status: string;
  is_active: string;
  price: string;
  sale_price: string;
  currency: string;
  link: string;
  image_url: string;
  review_count: string;
  review_rate: string;
  "2y_sales"?: unknown[];
  [key: string]: unknown;
}

// ─── Digested Product (post-digestion, used by selection + search) ───

export interface DigestedProduct {
  sku: string;
  name: string;
  description: string;
  productType: string[];
  shopFor: string[];
  occasion: string[];
  collection: string[]; // "Clearance" removed — promoted to isClearance
  material: string[];
  metalColor: string;
  price: string;
  salePrice: string;
  currency: string;
  link: string;
  imageUrl: string;
  reviewCount: string;
  reviewRate: string;

  priceTier: PriceTier;
  isOnSale: boolean;
  isClearance: boolean;
  primaryLanguage: PrimaryLanguage;
  reviewTier: ReviewTier;
  personalizationSummary: string | null;
}

// ─── Figma ───

export interface FigmaVariant {
  variantName: string;
  figmaFrameUrl: string;
  thumbnailUrl: string;
}

export interface FigmaResult {
  variants: FigmaVariant[];
  selectedVariant?: string;
}

export interface CampaignBlueprint {
  campaign_id: string;
  lead_value: LeadValue;
  lead_personalities: LeadPersonality[];
  free_top_text: string | null;
  subject_variant: SubjectVariant;
  hero_image_url: string;
  body_blocks: BodyBlock[];
  sms: string | null;
  products: Array<{
    title: string;
    price: string;
    image_url: string;
    link: string;
  }>;
}

// ─── Figma Service Interface ───

export interface FigmaTemplate {
  id: string;
  name: string;
}

export interface FilledVariant {
  variantName: string;
  figmaFrameUrl: string;
}

export interface FigmaService {
  getAvailableTemplates(): Promise<FigmaTemplate[]>;
  fillTemplates(blueprint: CampaignBlueprint): Promise<FilledVariant[]>;
  exportThumbnails(variants: FilledVariant[]): Promise<string[]>;
}

// ─── Campaign (full record, as returned from DB) ───

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  seed: CreativeSeed;
  generatedCopy: GeneratedCopy | null;
  approvedCopy: ApprovedCopy | null;
  generatedProducts: ProductSnapshot[] | null;
  approvedProducts: ProductSnapshot[] | null;
  heroImagePath: string | null;
  figmaResult: FigmaResult | null;
  error: string | null;
}
