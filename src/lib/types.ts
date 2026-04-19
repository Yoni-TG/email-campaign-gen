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

// ─── Creative Seed ───

export interface CreativeSeed {
  targetCategories: string[];
  promoDetails?: string;
  mainMessage: string;
  secondaryMessage?: string;
  pinnedSkus?: string[];
  milledInspirationUrls?: string[];
  additionalNotes?: string;
  includeSms: boolean;
}

// ─── Generated Copy ───

export interface GeneratedCopy {
  subjectLines: string[];
  preHeader: string;
  hero: {
    title: string;
    subtitle: string;
    paragraph: string;
  };
  secondary: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  primaryCtaText: string;
  smsCopy?: string;
}

// ─── Approved Copy ───

export interface ApprovedCopy {
  subjectLine: string;
  preHeader: string;
  hero: {
    title: string;
    subtitle: string;
    paragraph: string;
  };
  secondary: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  primaryCtaText: string;
  smsCopy?: string;
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
  campaignId: string;
  hero: {
    title: string;
    subtitle: string;
    paragraph: string;
    imageUrl: string;
  };
  secondary: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  primaryCtaText: string;
  products: Array<{
    title: string;
    price: string;
    imageUrl: string;
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
